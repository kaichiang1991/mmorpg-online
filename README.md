# MMORPG Online

RO 風格 MMORPG 正式產品開發庫。npm workspaces monorepo，TypeScript 全棧，TDD + DDD。

## 快速開始

```bash
npm install
npm run build -w @mmo/shared   # shared 需先編譯一次

npm run dev:server   # NestJS on :3001
npm run dev:client   # Vite on :5173（proxy /auth 與 /socket.io 到 3001）
```

開 http://localhost:5173 → 註冊 → 點地移動。多開分頁（不同帳號）驗證多人同步。

## 指令

| 指令 | 說明 |
|---|---|
| `npm test` | 全部測試（server: jest、client: vitest） |
| `npm run lint` | oxlint |
| `npm run format` | prettier |
| `npm run build` | 全 workspace 編譯 |

## 結構

```
packages/shared/          # 前後端共用協定（事件型別、遊戲常數）— 單一事實來源
apps/server/src/
  main.ts
  app.module.ts
  modules/
    auth/                 # Bounded Context: 帳號/認證
      domain/             #   實體與規則（User）、ports（UserRepository, PasswordHasher）
      application/        #   use cases（register-user / login .use-case.ts）、TokenService port
      infrastructure/     #   adapters（InMemory repo、bcrypt、JWT）
      presentation/       #   HTTP controller（domain error → HTTP status 映射）
    game/                 # Bounded Context: 遊戲世界
      domain/             #   World / Player 純邏輯，零框架依賴
      application/        #   GameService（tick 迴圈驅動 domain）
      presentation/       #   GameGateway（Socket.IO、JWT 握手驗證、snapshot 廣播）
apps/client/src/
  ui/                     # React 殼：LoginForm、GameCanvas（只負責掛載）
  game/                   # PixiJS 世界：GameApp（渲染/輸入/鏡頭）、Interpolator、network
```

## 開發約定

- **DDD 分層**：依賴方向永遠 `presentation → application → domain`；domain 不 import 任何框架。基礎設施透過 port（interface + Symbol token）注入，換 DB 只動 `infrastructure/`。
- **TDD**：domain 與 application 邏輯先寫測試（`*.spec.ts` 與實作同目錄）。目前 24 tests：auth use cases、Player/World 移動規則、client Interpolator。
- **Use case 檔名**：`<動作>.use-case.ts`。
- **協定變更**：只改 `packages/shared/src/protocol.ts`，前後端同時得到型別。
- **Server-authoritative**：client 只送意圖（`move`），位置由 server tick（20Hz）計算，snapshot（10Hz）廣播，client 插值渲染。

## 已實作

- 註冊/登入（bcrypt + JWT，錯誤映射 400/401/409）
- Socket 握手 JWT 驗證，無效 token 直接斷線
- 多人即時位置同步（點地移動、鏡頭跟隨、平滑插值）

## 下一步（規劃）

- PostgreSQL adapter 取代 InMemoryUserRepository（port 已就位）
- 技能/道具系統移植（PoC 已驗證協定）
- AOI + delta snapshot
- 斷線重連與 session 恢復
