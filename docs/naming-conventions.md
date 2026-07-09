# Backend 檔案命名慣例

盤點 `apps/server/src` 現況整理，並已與使用者確認統一規則。

**核心規則：檔名（含路徑）一律 kebab-case，程式碼內 class/interface 名稱用 camelCase/PascalCase。**

## 1. Module 根目錄

`<domain>.module.ts` — kebab-case + `.module` 後綴。
例：`auth.module.ts`、`game.module.ts`。

## 2. presentation/

Nest adapter 一律 `<domain>.<type>.ts`：
- `auth.controller.ts`
- `game.gateway.ts`

## 3. application/

每個 use case 一個檔案，`<action>.use-case.ts`：
- `login.use-case.ts` → `LoginUseCase`
- `register-user.use-case.ts` → `RegisterUserUseCase`

game module 目前無獨立 use case，聚合成單一 `game.service.ts`。

## 4. domain/（純邏輯 entity／aggregate）

檔名 = class/interface 名稱轉 kebab-case，**無**型別後綴：
- `combat-resolver.ts` → `CombatResolver`
- `skill-factory.ts` → `SkillFactory`
- `combatant.ts`、`damage.ts`、`player.ts`、`skills.ts`、`world.ts`、`user.ts`、`errors.ts` — 單字直接對應

## 5. domain/value-objects/

VO class 一律 `Vo` 結尾；檔名比照第 6 節 port/adapter 模式，kebab-case + `.vo` 型別後綴：
- `AttackResultVo` → `attack-result.vo.ts`
- `CombatStatsVo` → `combat-stats.vo.ts`
- `CooldownVo` → `cooldown.vo.ts`
- `PositionVo` → `position.vo.ts`
- `ResourcePoolVo` → `resource-pool.vo.ts`

> 已於 2026-07-09 完成改名，全部改成上述 kebab-case 形式。

## 6. domain/ports/ 與 infrastructure/

Port interface 與其 adapter 實作大多用 `<name>.<type>.ts`：
- `token.service.ts` → `TokenService`（port）／`jwt-token.service.ts` → `JwtTokenService`（adapter）
- `user.repository.ts` → `UserRepository`（port）／`in-memory-user.repository.ts` → `InMemoryUserRepository`（adapter）

`password-hasher.ts` / `bcrypt-password-hasher.ts` 沒有型別後綴，維持現狀（不強制補後綴）。

## 7. 測試檔

1:1 對應 `<同名>.spec.ts`，一個來源檔一個測試檔。

> 已於 2026-07-09 拆分：`login.use-case.spec.ts`、`register-user.use-case.spec.ts`（原合併的 `auth.use-cases.spec.ts` 已移除）。
