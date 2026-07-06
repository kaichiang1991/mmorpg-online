# Client 遊戲架構：新增功能指南

紀錄 client 端四層架構的職責劃分、依賴方向，以及新增功能時的開發順序。
以「player 新增攻擊」為完整範例。

## 分層總覽

```
apps/client/src/
  game/                          ← bounded context：遊戲世界
    domain/                      ← 純邏輯。零 Pixi、零 socket、零 DOM
      player.ts                  ← Player entity（server 投影）
      interpolator.ts            ← snapshot 插值
      camera.ts                  ← 鏡頭 clamp 數學
      active-attacks.ts          ← ActiveAttack 型別（tracker 待 protocol 有 attack event）
    application/
      GameSession.ts             ← use-case 協調：socket ↔ domain ↔ renderer
    infrastructure/
      network.ts                 ← socket.io adapter
      pixi/
        PixiRenderer.ts          ← facade：sprite 生命週期、地板、鏡頭
        EffectLayer.ts           ← 攻擊特效繪圖（軌跡、命中 ring）
  ui/                            ← React presentation
    GameCanvas.tsx               ← 只 mount/unmount GameSession
```

### 依賴方向（唯一鐵律）

```
ui → application → domain ← infrastructure
```

- `domain/` 誰都不依賴，只能 import `@mmo/shared` 的型別和同層檔案。
- `infrastructure/` 可以 import `domain/`（外層依賴內層），反向禁止。
- `application/` 組裝一切：唯一同時認識 domain 和 infrastructure 的層。
- `ui/` 只認識 `GameSession`，不碰 socket、不碰 Pixi。

**檢驗方式**：`domain/` 內任何檔案出現 `import ... from 'pixi.js'` 或
`socket.io-client` 就是分層違規。

## 新東西該放哪層？

| 要加的東西 | 放哪 | 判斷依據 |
| --- | --- | --- |
| 遊戲規則、數值計算、狀態追蹤（帶 TTL 的特效列表、cooldown、預測移動） | `domain/` | 不碰 I/O 就能 unit test |
| 新的 server event 接線、使用者意圖轉 command、多個物件的協調流程 | `application/` | 是「流程」不是「規則」也不是「畫面」 |
| 畫面呈現（新 sprite、特效、動畫）、socket 通訊、browser API | `infrastructure/` | 換掉 Pixi/socket.io 時要跟著換的東西 |
| 選單、HUD、表單等 React 元件 | `ui/` | React 世界的東西 |
| 前後端共用的 payload / event 型別 | `packages/shared/src/protocol.ts` | wire protocol 唯一來源 |

拿不準時問一句：**「這段程式碼在沒有瀏覽器的 vitest 裡跑得起來嗎？」**
跑得起來 → domain。跑不起來 → 往外層放。

## 開發順序：由內而外（inside-out）

固定順序，每步都有明確驗收：

1. **`packages/shared/protocol.ts`** — 先定 wire type。前後端契約先講好，
   後面每一步都有型別可依。
2. **`domain/`** — 寫純邏輯 + `*.spec.ts`。這步結束就能 `npm test` 驗證
   規則正確，還不需要任何畫面。
3. **`application/GameSession.ts`** — 接線：socket event 餵 domain、
   使用者輸入轉 command 發出去。
4. **`infrastructure/pixi/`** — 最後才畫。renderer 只吃 domain 算好的
   輸出，每 frame 畫一次。
5. **`ui/`** — 通常不用動。

理由：domain 先行 → 邏輯 bug 在 unit test 就抓到，不用開瀏覽器對著畫面猜；
renderer 最後 → 畫面永遠只是 state 的投影，不會反過來藏邏輯。

## 完整範例：player 新增攻擊

依序要動的檔案：

### 1. `packages/shared/src/protocol.ts`

定義 payload 與 event：

```ts
export interface AttackPayload {
  targetId: string;
}

export interface AttackEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  /** server timestamp (ms epoch) */
  t: number;
}

// ClientToServerEvents 加：attack: (payload: AttackPayload) => void
// ServerToClientEvents 加：attack: (event: AttackEvent) => void
```

### 2. Server 端（`apps/server/src/modules/game/`）

server 已有 `domain/combat-resolver.ts`（傷害公式）。要補：
`domain/world.ts` 增加 attack 處理 → `presentation/game.gateway.ts`
收 `attack` event、廣播結果。server 是 authoritative，傷害只在 server 算。

### 3. `game/domain/active-attacks.ts`（新檔）+ spec

Client 端攻擊狀態追蹤——「有哪些攻擊正在發生」是 state，不是畫面：

```ts
export interface ActiveAttack {
  attackerId: string;
  targetId: string;
  damage: number;
  startedAt: number; // 本地時鐘，同 interpolator 的 receivedAt
}

export interface ActiveAttackTracker {
  push(event: AttackEvent, receivedAt: number): void;
  /** 回傳 now 時刻仍存活的攻擊（TTL 過期自動剔除） */
  activeAt(now: number): ActiveAttack[];
}
```

模式跟 `Interpolator` 完全相同：`push()` 收資料、`xxxAt(now)` 給渲染用。
先寫 spec 再寫實作。

### 4. `game/application/GameSession.ts`

接兩條線：

```ts
// 收：server 廣播的攻擊事件
this.socket.on('attack', (e) => this.attacks.push(e, performance.now()));

// 發：使用者點擊敵人 → attack command（點擊判定屬 renderer，意圖轉發屬這裡）
this.renderer.onPlayerClick((targetId) => this.socket?.emit('attack', { targetId }));

// 每 frame 把攻擊列表一起餵給 renderer
this.renderer.onTick(() => {
  const now = performance.now();
  this.renderer.render(this.interpolator.playersAt(now), this.attacks.activeAt(now), this.selfId);
});
```

### 5. `game/infrastructure/pixi/`

- `PixiRenderer.render()` 簽名加 `attacks: ActiveAttack[]` 參數。
- 軌跡怎麼畫（顏色、飛行時間、淡出）全部在這層，domain 不知道也不在乎。
- class 變肥就內部拆 `EffectLayer` / `PlayerLayer`，`PixiRenderer` 保持
  facade，`GameSession` 對外介面不變。

### 6. `ui/` — 不動

## 原則備忘

- **domain 說「發生了什麼」，renderer 說「看起來怎樣」。** 攻擊的事實
  （誰打誰、多少傷害、何時）放 domain；線條與動畫放 renderer。
- **Server authoritative**：client domain 是投影 + 純計算，不守 invariant。
  傷害、命中、位置以 server 為準；client 只做呈現與（未來的）預測。
- **兩個 "player" 是不同概念**：登入帳號屬 account context（未建），
  地圖上會動的 Player 屬 game context。不要做全域共用 Player。
- **時鐘一致**：所有 `receivedAt` / `now` 用 `performance.now()`，
  跟 `Interpolator` 同一時鐘，不要混用 server timestamp。
- 目錄結構與 server 的 `modules/game/{domain,application,presentation}`
  對稱，兩邊心智模型共用。
