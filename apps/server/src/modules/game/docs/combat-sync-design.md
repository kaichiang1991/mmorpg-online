# 戰鬥同步設計（Combat Network Sync Design）

> 狀態：設計定案。瞬發路徑（`attack` 意圖 → 結算 → 廣播）已實作，詠唱路徑尚未實作。
> 範圍：施放技能（含普攻）、施法進度條的多人連線同步機制。
> 前置：[combat-design.md](./combat-design.md)（傷害計算領域模型）。本文件講的是「算完之後，怎麼讓所有玩家看到一致的結果」。
> 現況基礎：server 20Hz tick、10Hz snapshot 廣播、client `Interpolator` 插值渲染。

---

## 1. 核心原則：Server Authoritative（伺服器權威）

**Client 永遠只送「意圖」，不送「結果」。** 傷害、命中、施法成功與否全由 server 判定。

原因：client 可被竄改。若 client 能直接上報「我打了 9999」，等於對外掛敞開大門。現有 `move` 事件已是這個模式——client 送目標點，server 負責算位置——戰鬥沿用同一哲學。

由此推導出每個戰鬥動作的固定三步：

```
1. Client 送意圖（我想對誰放什麼技能）
2. Server 驗證 + 結算（距離、冷卻、MP → CombatResolver）
3. Server 廣播結果事件，所有 client 收到同一份資料 → 畫面一致
```

「所有人收到同一份 server 產出的結果」就是多人同步的本質。

---

## 2. 兩條同步通道：Snapshot vs Event

這是整個設計最重要的區分。

| | Snapshot（現有） | Event（本文件新增） |
|---|---|---|
| 內容 | **持續狀態**：位置、HP、MP | **瞬間發生**：攻擊命中、暴擊、施法開始/完成/取消 |
| 頻率 | 固定 10Hz，丟一包無妨（下一包蓋掉） | 發生才送，**不能丟** |
| Client 處理 | 插值（`Interpolator`） | 播動畫、飄傷害數字、開進度條 |

- 攻擊若塞進 snapshot：10Hz 取樣可能整個錯過一次攻擊，動畫與飄字沒有觸發點。
- 進度條若每 tick 廣播百分比：拿事件通道做狀態同步，頻寬浪費且抖動，是反模式。

**狀態走 snapshot，事件走 event。** HP/MP 是狀態（進 `PlayerSnapshot`），「這一下打了多少」是事件（獨立廣播）。

---

## 3. 技能施放同步（普攻即技能）

### 3.1 統一意圖：一個事件，不分普攻與技能

普攻在領域模型裡就是一個技能（`skills.ts` 的 `BASIC_ATTACK`，id `'basic'`），client 送的 `AttackPayload` 也已帶 `skillId`。因此 client→server **只有一個施放意圖事件**，不另設 `castStart`：

- 兩者 payload 形狀完全相同（`{ targetId, skillId }`），分兩個事件只是重複驗證邏輯。
- 「瞬發 vs 詠唱」不是協定層的分支，是**資料層**的分支：`Skill` 定義加 `castTime: number`（ms），普攻與瞬發技能為 `0`。
- Client 不需要（也不該）知道一個技能是瞬發還是詠唱——`castTime` 是 server 權威資料。之後把普攻調成有前搖，改資料就好，協定零改動。

Server 收到意圖後依 `castTime` 走兩條路：

```
server 收到 attack { targetId, skillId }
  → 驗證（統一一條路：會這技能? 目標活著? 距離? 冷卻? MP?）
  → skill.castTime === 0 → 立即結算 → 廣播 attack（結果事件）
  → skill.castTime > 0  → 記 castEndAt → 廣播 castBegin
                          → tick 到點結算 → 廣播 attack（結果事件）
```

### 3.2 瞬發流程（castTime = 0，含普攻）

```
Client A                    Server                       Client B
   |-- attack ------------->  |                             |
   |   {targetId, skillId}    | 驗證: 會這技能? 距離? 冷卻?    |
   |                          |       MP 夠? 目標活著?       |
   |                          | CombatResolver.resolve()    |
   |                          | 扣 MP、目標扣 HP（狀態，隨 snapshot 出去）
   |  <-- attack（結果） ------|-------- attack（結果） ----->|
   |  播動畫 + 飄傷害數字        |                 播動畫 + 飄傷害數字
```

### 3.3 各步驟責任

1. **Client 送意圖**：`attack { targetId, skillId }`。不含傷害值、不含命中判定。
2. **Server 驗證**：技能存在？目標存在且活著？距離在射程內？冷卻結束？MP 夠？任一不過就靜默丟棄（與 `game.gateway.ts` 的 `onMove` payload 驗證同思路——非法輸入不回錯誤，直接忽略）。
3. **Server 結算**：呼叫已就位的 `CombatResolver.resolve(attacker, target, skill)`，產出結算快照。
4. **廣播結果事件**：`attack { attackerId, targetId, skillId, damage, crit, kind, element, multipliers }` 發給所有相關 client。A 與 B 收到同一份資料，畫面必然一致。`multipliers` 來源清單讓 client 做戰報與飄字細節（暴擊字樣、屬性顏色），接上 combat-design.md 的決策三。
5. **HP/MP 更新**：server 扣完後，新值隨下一包 snapshot 自然到達所有 client，不需要事件裡重複帶。

### 3.4 體感優化（可選）

攻擊者本地可在按下攻擊時立刻播「揮刀動畫」（純視覺、無數字），等結果事件回來才飄傷害。動畫零延遲、數字仍權威。這是 client-side prediction 的最弱形式——預測的只有動畫，做壞了也不會造成狀態不同步。

---

## 4. 施法進度條（詠唱，castTime > 0）

同步的精華在此。**進度條不是每 tick 傳「目前 35%…40%…」**——正解是**傳時間資訊，讓每個 client 自己算進度**。

### 4.1 流程

意圖事件與瞬發完全相同（同一個 `attack`），差別只在 server 的處理與多出的 `castBegin` / `castCancel` 廣播：

```
Client A                    Server                        Client B
   |-- attack -------------->  |                             |
   |   {targetId, skillId}     | 驗證 → 記錄 castEndAt        |
   |                           |   = now + skill.castTime    |
   | <-- castBegin ------------|-------- castBegin --------->|
   |     { casterId, skillId, duration, endsAt }             |
   |                           |                             |
   |  每 frame 本地計算:                        B 也本地計算:   |
   |  progress = 1 - (endsAt - now) / duration               |
   |                           |                             |
   |                           | tick 檢查 now >= castEndAt   |
   |                           | → CombatResolver 結算        |
   | <-- attack（結果） --------|------- attack（結果） ------->|
   |                           |                             |
   |  （或中途） <-- castCancel {casterId, reason} -->         |
```

瞬發技能直接跳過 `castBegin`，不發 `duration: 0` 的假事件；client 收到結果事件即播表現。**詠唱完成與瞬發共用同一個結果事件**——對 client 而言「一次結算發生了」語意相同，payload 也同構，不需要獨立的 `castComplete`。

### 4.2 四個關鍵設計

**一、一個事件定義整條進度條。**
`castBegin { casterId, skillId, duration, endsAt }` 發出後，詠唱期間零網路流量。每個 client 在自己的 render loop（60fps）計算 `progress`，進度條天生滑順，與 10Hz snapshot 無關。

**二、完成由 server 判定。**
Client 進度條跑滿 ≠ 技能成功。Server 在 tick 中自行計時，到點才結算傷害並廣播結果事件。Client 的進度條只是「預告」，真正的結果以 server 事件為準。

**三、打斷也由 server 判定。**
詠唱中移動、被暈、死亡、斷線 → server 廣播 `castCancel { casterId, reason }`，所有 client 收掉進度條。判定依據是 server 自己的位置與狀態資料——client 聲稱「我沒動」不算數。

實作上：`GameService.setMoveTarget` 需檢查該玩家是否詠唱中，是則先取消詠唱（或拒絕移動，依遊戲規則定案）。

**四、時鐘偏差處理。**
Client 與 server 時鐘不同步，直接拿 `endsAt`（server epoch）對 client 本地時間會偏。兩個方案：

| 方案 | 做法 | 誤差 | 適用 |
|------|------|------|------|
| 簡單版 | 忽略 `endsAt`，收到 `castBegin` 當下起算 `duration` | 單程網路延遲（~50ms） | 進度條夠用，**先做這個** |
| 完整版 | 握手時估 clock offset（類 NTP：`offset = serverTime − (send+recv)/2`），將 `endsAt` 換算成本地時間 | 可壓到 ~10ms | 之後需要精準同步再上 |

現有 `WorldSnapshot.t` 已帶 server timestamp，完整版可拿它持續校正 offset，不必另開通道。

---

## 5. 協定草案（protocol.ts 增量）

> `attack` 意圖與結果事件已實作於 `protocol.ts`；`castBegin` / `castCancel` 為增量，實作時定案形狀。欄位沿用 combat-design.md 的 `DamageKind` / `DamageElement` / `Multiplier`。

```typescript
/* ---- client → server：只有意圖，普攻與技能同一事件 ---- */

export interface AttackPayload {
  targetId: string;
  skillId: string;
}

export interface ClientToServerEvents {
  move: (payload: MovePayload) => void;
  attack: (payload: AttackPayload) => void;
}

/* ---- server → client：權威結果 ---- */

export interface AttackResultPayload {
  attackerId: string;
  targetId: string;
  skillId: string;
  damage: number;
  crit: boolean;
  kind: DamageKind;
  element: DamageElement;
  multipliers: Multiplier[]; // 戰報/飄字追溯用
}

export interface CastBeginPayload {
  casterId: string;
  skillId: string;
  duration: number; // ms，簡單版時鐘方案只用這個
  endsAt: number;   // server epoch ms，完整版校正後使用
}

export interface CastCancelPayload {
  casterId: string;
  reason: 'moved' | 'interrupted' | 'died' | 'disconnected';
}

export interface ServerToClientEvents {
  welcome: (payload: WelcomePayload) => void;
  snapshot: (payload: WorldSnapshot) => void;
  attack: (event: AttackResultPayload) => void; // 瞬發結算與詠唱完成共用
  castBegin: (payload: CastBeginPayload) => void;
  castCancel: (payload: CastCancelPayload) => void;
}

/* ---- snapshot：HP/MP 是狀態，走 snapshot（已實作） ---- */

export interface PlayerSnapshot {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  mp: number;
}
```

技能定義增量（server domain，`skills.ts`）：

```typescript
export interface Skill {
  readonly id: SkillId;
  readonly baseDamage: number;
  readonly multiplier: number;
  readonly kind: DamageKind;
  readonly element: DamageElement;
  readonly mpCost: number;
  readonly castTime: number; // ms；未設或 0 = 瞬發（普攻、瞬發技能）
  readonly hitCount?: number;
}
```

---

## 6. 與現有程式碼的銜接

| 位置 | 改動 |
|------|------|
| `packages/shared/src/protocol.ts` | `attack` 意圖/結果已就位；增 `castBegin` / `castCancel` 事件與 payload 型別。共用型別 = 兩端編譯期就對齊，不會歪 |
| `game.gateway.ts` | `@SubscribeMessage('attack')` 已就位；增 `castBegin` / `castCancel` 廣播（由 service/tick 觸發） |
| `GameService` / `World` | 冷卻管理、詠唱狀態（每 player 一個 `castEndAt`）、tick 內檢查詠唱完成、移動時取消詠唱 |
| `skills.ts` / `SkillFactory` | `Skill` 加 `castTime`，資料驅動瞬發/詠唱分支 |
| `CombatResolver` | 已就位，直接被呼叫，零改動 |
| `Player` | 實作 `Combatant`（combat-design.md 順序 6），補 `hp`/`mp` |
| client `GameSession.ts` | `attack` 結果已監聽；增 `castBegin` / `castCancel` 監聽；進度條 = `Graphics` 長方形每 frame 依 `progress` 更新寬度；飄傷害數字 |
| client `Interpolator` | HP/MP 直接取 `next` 值即可（不插值，血量跳變是可接受的） |

---

## 7. 建議實作順序

1. ~~`protocol.ts` 加型別~~、~~`PlayerSnapshot` 加 `hp`/`mp`~~、~~`attack` 意圖 → 驗證 → `CombatResolver` → 廣播結果~~——瞬發最短路徑已通。
2. Client 飄傷害數字 + 受擊表現。
3. 冷卻、MP 消耗驗證補齊（統一驗證路徑，詠唱前置）。
4. 詠唱：`Skill.castTime` / server 計時 / `castBegin` / 到點結算廣播，時鐘先用簡單版（收到即起算）。
5. 打斷：移動取消詠唱、`castCancel` 廣播。
6. 體感優化（本地預播動畫）。

---

## 8. 明確排除 / 待議

- **排除**：client 上報傷害或命中結果——違反權威原則，任何情況都不做。
- **排除**：進度條逐 tick 廣播百分比——見第 4 節，時間戳方案全面優於它。
- **排除**：普攻與技能分成兩個 client→server 事件——普攻即技能（`skillId: 'basic'`），payload 與驗證流程完全同構，瞬發/詠唱由 `Skill.castTime` 資料驅動，協定層不分支。
- **待議**：移動的 client-side prediction + server reconciliation（現在移動也是純 server 權威 + 插值，延遲感可接受就不急）。
- **待議**：lag compensation（server 回溯攻擊瞬間的目標位置判定命中）——目前攻擊以 targetId 鎖定，無需命中判定；未來做技能彈道/範圍技再議。
- **待議**：興趣管理（AOI，只廣播給看得到的玩家）——單地圖小人數先全服廣播，人數上來再切。
