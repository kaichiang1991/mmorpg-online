# Value Object 候選清單（VO Candidates）

> 狀態：`AttackResultVo`、`CombatStatsVo` 已完成，其餘為待辦候選。
> 範圍：`modules/game/domain` 的值物件盤點。
> 慣例：VO class 一律以 `Vo` 結尾，放在 `domain/value-objects/`，不可變（`readonly`）、建構子驗不變式、無 identity。

---

## 0. 已完成：`AttackResultVo`

原 `Attack` class 改造而來（`value-objects/attackResultVo.ts`）。

- 不變式：`finalDamage` 必須為正整數（原本散在 `combat-resolver.ts` 的 `Math.max(1, floor(...))`，現由 VO 自守）。
- 行為：`isCrit`（multipliers 內含 `crit` 來源）、`totalMultiplier`（全倍率連乘）。
- `game.service.ts` 的 payload 映射已改用真值（`isCrit`/`kind`/`element`/`multipliers`），resolver 補上 crit roll 後 payload 自動跟上。

---

## 1. `PositionVo` — 優先度最高

座標邏輯目前散在三處：

| 位置 | 邏輯 |
|---|---|
| `player.ts` | `x/y/targetX/targetY` + `advance()` 整段向量運算 |
| `world.ts` `attack()` | `Math.hypot` 距離判定（攻擊範圍） |
| `world.ts` 頂部 | `clamp()` 限制目標在地圖內 |

```typescript
export class PositionVo {
  constructor(readonly x: number, readonly y: number) {}
  distanceTo(other: PositionVo): number;
  moveToward(target: PositionVo, step: number): PositionVo; // 到達即回傳 target
  clampTo(width: number, height: number): PositionVo;
}
```

三處重複的向量數學收進一個地方；`advance()` 的「到達即停」邏輯也一併內聚。

## 2. `CombatStatsVo` — 已完成

`value-objects/combatStatsVo.ts`。`Player` 五個 public 可變欄位改為持有 `CombatStatsVo`，對外以 getter 滿足 `Combatant` 介面。

- 不變式：`0 ≤ critRate ≤ 1`，其餘屬性 `≥ 0` 且 finite。
- `CombatStatsVo.from(combatant)` 從任意 `Combatant` 複製快照。
- `player.ts` 的 `name === 'aaa'` 分支是刻意保留的測試後門（已註解），等角色屬性系統落地後移除。
- 之後 buff／裝備加成掛載點：加 `withBuff(...)` 回傳新 VO。

## 3. `CooldownVo` — 小而美

`player.ts` 的 `lastAttackAt` + `tryAttack(now)` 就是冷卻邏輯。

```typescript
export class CooldownVo {
  constructor(readonly durationMs: number, readonly lastUsedAt = Number.NEGATIVE_INFINITY) {}
  isReady(now: number): boolean;
  consume(now: number): CooldownVo; // 回傳新實例
}
```

之後技能系統各技能獨立 CD 時直接複用，`Player` 不用為每個技能長一個 `lastXxxAt` 欄位。

## 4. `MultiplierVo` — 順手加驗證

現為 interface（`attack.ts`），任何 `value`（含 0、負數）都收。轉 class 驗 `value > 0`、`source` 非空即可。成本低，但影響 `AttackResultVo` 建構參數與 shared 的 wire-format 映射，建議與 crit roll 實作一起動。

## 5. `ResourcePoolVo` — 反向建議：合併而非新增

`PlayerHpVo` 與 `PlayerMpVo` 幾乎逐行相同（上限 clamp、`percentage`、`decrease` 回傳新實例）。同一個「資源池」概念，建議合併：

```typescript
export class ResourcePoolVo {
  constructor(readonly current: number, readonly max: number) {}
  // hp/mp 只是兩個實例，不是兩個 class
}
```

若之後 HP／MP 行為分岔（如 MP 自然回復規則），再拆不遲。

---

## 不建議做成 VO

- **`Skill`**：有 `id`、走 factory 查表（`world.ts` todo 已註明），是靜態定義／entity，不是值。
- **`WorldSnapshot`、`AttackResultPayload` 等 payload**：跨網路 DTO，保持 plain object，不掛行為。
- **client 端 `ActiveAttack`**（`apps/client/.../active-attacks.ts`）：純資料 + tracker 已足夠，client 目前不需要 domain VO 的不變式保護。
