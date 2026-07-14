# ADR-001：GameSession 直接依賴 infrastructure 具體實作

- **狀態**：已接受（暫行），待條件成立時重構
- **日期**：2026-07-15
- **相關檔案**：`game/application/GameSession.ts`、`docs/architecture.md`

## 問題

`GameSession.ts` 位於 application 層，卻直接 import 並實例化 infrastructure
的具體實作：

```ts
import { connect, GameSocket } from '../infrastructure/network';
import { PixiRenderer } from '../infrastructure/pixi/PixiRenderer';

export class GameSession {
  private readonly renderer = new PixiRenderer();
  // ...
  this.socket = connect(token);
}
```

依嚴格的 Clean Architecture / Hexagonal 依賴規則（Dependency Rule），
依賴方向只能由外向內：`infrastructure → application → domain`。
application 層認得具體的 `PixiRenderer` 與 socket.io adapter，
就教科書定義而言是違規。

## 決策：暫時接受，理由是 GameSession 兼任 Composition Root

`GameSession` 實際上扮演兩個角色：

1. **Application Service**：編排 socket event → domain 物件
   （`Interpolator`、`PlayerPanel`、`ActiveCastTracker`）→ renderer 的資料流。
2. **Composition Root（組裝根）**：整個遊戲的 object graph 在這裡被 `new`
   出來。`ui/GameCanvas.tsx` 刻意保持零知識，只 mount/unmount。

Composition Root 本來就被允許（也必須）認識所有具體實作——DI 容器或
`main()` 就是做這件事的。小型 client 專案把「組裝」和「編排」合併在
一個類別，換來簡單直接。`architecture.md` 的依賴方向一節
（「application 組裝一切：唯一同時認識 domain 和 infrastructure 的層」）
也是基於這個前提寫的。

## 代價

- **可測試性**：無法在不載入 Pixi（依賴 canvas/WebGL）和真實 WebSocket
  的情況下單元測試 GameSession 的編排邏輯。目前測試全部集中在 domain 層
  （`PlayerPanel`、`Interpolator` 等），正是這個限制的結果。
- **可替換性**：換渲染引擎或 mock network 需要修改 application 層原始碼。

## 未來重構方案：抽 Port（DIP 標準做法）

在 application 層定義 port interface，infrastructure 實作它，
由外層（React 掛載處或獨立的 composition root）注入：

```ts
// application/ports.ts — application 只認得抽象
export interface Renderer {
  init(host: HTMLElement): Promise<void>;
  setMap(map: MapData): void;
  onWorldClick(cb: (x: number, y: number) => void): void;
  render(players: Player[], /* ... */): void;
  destroy(): void;
  // 以 GameSession 實際呼叫到的方法為準，不多不少
}

export interface GameSocketPort {
  on(event: string, handler: (...args: unknown[]) => void): void;
  emit(event: string, payload: unknown): void;
  disconnect(): void;
}

// GameSession 改為建構子注入
export class GameSession {
  constructor(
    private readonly renderer: Renderer,
    private readonly connect: (token: string) => GameSocketPort,
  ) {}
}

// ui/GameCanvas.tsx（或新的 composition/ 模組）成為組裝點
new GameSession(new PixiRenderer(), connect);
```

重構後依賴箭頭變成 `PixiRenderer (infra) → Renderer (application port)`，
方向正確；GameSession 可用 fake renderer / fake socket 做單元測試。

### 重構步驟

1. 從 `GameSession` 實際使用的方法反推，在 `application/ports.ts`
   定義 `Renderer` 與 `GameSocketPort` interface。
2. `PixiRenderer` 加上 `implements Renderer`（結構已相容，只是宣告意圖）。
3. `GameSession` 改建構子注入，移除對 `infrastructure/` 的 import。
4. `ui/GameCanvas.tsx` 負責 `new GameSession(new PixiRenderer(), connect)`；
   若組裝邏輯變複雜，另立 `composition root` 模組。
5. 補 GameSession 編排邏輯的單元測試（fake renderer + fake socket）。
6. 更新 `architecture.md` 的依賴方向一節：application 不再認識
   infrastructure，改為「port 定義在 application，實作在 infrastructure，
   組裝在 ui/composition root」。

### 觸發條件（何時動手）

滿足任一項就值得做：

- 需要單元測試 GameSession 的編排邏輯（event 接線、意圖轉 command）。
- 需要替換或並存第二種 renderer（如 headless renderer 供測試/回放）。
- GameSession 的組裝邏輯膨脹到需要獨立的 composition root。

在那之前維持現狀——過早抽 port 會猜錯介面形狀；等測試需求出現時，
哪些方法真的需要抽象會更清楚。