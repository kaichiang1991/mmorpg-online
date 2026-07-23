# UI 架構決策：React Overlay 與 Pixi 的邊界

2026-07-23 討論結論。目前螢幕級 UI 全在 Pixi；隨著 inventory、聊天、任務等系統進來，UI 複雜度會超過手刻划算的範圍。此文件記錄未來遷移方向與 bridge 設計，供屆時實作參考。

## 邊界原則

| UI 類型 | 歸屬 | 例子 |
|---|---|---|
| 螢幕級 UI（chrome） | React DOM overlay | sidebar、popup/dialog、inventory、設定、聊天 |
| 世界內 UI | Pixi | 頭上 cast bar、傷害數字、HP 條、點擊特效 |

判斷式：跟著「螢幕」走的歸 React，跟著「世界座標 / 角色」走的歸 Pixi。

## 分層與指令流向

React 不直接碰 PixiRenderer 或 Panel 物件。指令一律走 application layer（`GameSession`）轉發，與現有 socket → session → renderer 同方向：

```
React click ─→ GameSession.togglePanel(id) ─→ UiState 改變
                                                ├─→ React re-render（icon 高亮）
                                                └─→ Pixi popup visible
```

## 單一事實來源：UiState

開關狀態只存一份，React 與 Pixi 都是讀者（與現有 view-model pipeline 同構 — UI 狀態是 model，React/Pixi 都只是 view）：

```ts
// application/ui-state.ts — 手刻 observable，暫不需要 zustand
export class UiState {
  private openPanel: PanelId | null = null;
  private listeners = new Set<() => void>();

  toggle(id: PanelId): void {
    this.openPanel = this.openPanel === id ? null : id;
    this.listeners.forEach((l) => l());
  }
  get current(): PanelId | null { return this.openPanel; }
  subscribe(l: () => void): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}
```

- React 端：`useSyncExternalStore(uiState.subscribe, () => uiState.current)`
- Pixi 端：subscribe 或 `onTick` 內依狀態開關 popup
- ESC 關窗、開 A 關 B 互斥等規則，全部集中在 `UiState` 解決

## React 端掛載模式

```tsx
function GameView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GameSession | null>(null);

  useEffect(() => {
    const session = new GameSession();
    sessionRef.current = session;
    session.mount(hostRef.current!, token);
    return () => session.destroy();
  }, []);

  return (
    <div className="relative">
      <div ref={hostRef} />
      {/* overlay 容器不吃事件，互動元素才吃 */}
      <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
        <button
          className="pointer-events-auto"
          onClick={() => sessionRef.current?.togglePanel('skills')}
        >
          S
        </button>
      </div>
    </div>
  );
}
```

## 已知陷阱

1. **pointer-events**：overlay 容器必須 `pointer-events: none`，否則會擋住世界點擊；互動元素個別以 `pointer-events: auto` 開回來。
2. **座標系**：React icon 在 DOM 座標、Pixi dialog 在 canvas 座標，devicePixelRatio 與 canvas resize 會讓兩者不同步。Pixi 內的定位一律用 Pixi 的 `screen.width/height` 計算，不要從 DOM 傳座標進 canvas。
3. **狀態重複**：不要讓 React 與 Pixi 各存一份 `isOpen`，一律走 `UiState`。

## 遷移時的既有元件處置

- `pixi/side-panel.ts`（icon 條）→ 由 React overlay 取代後退役
- `pixi/panels/` 的 `PanelWidget` 介面 → trigger 換成 React 後，介面砍剩 `mount(popupParent)` / `toggle` / `layout` / `destroy`
- `PanelFactory` → 保留，`GameSession.togglePanel` 經由它找 panel
