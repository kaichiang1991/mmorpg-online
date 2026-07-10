# 戰鬥系統設計（Combat System Design）

> 狀態：設計定案。骨架已實作（順序 1–3、6：型別、`AttackResultVo`、`CombatResolver`、`Player` 戰鬥屬性）。
> 尚未實作：暴擊（順序 4）、屬性克制與抗性（順序 5）、buff/debuff（順序 7）——見第 7 節現況。
> 範圍：`modules/game` 的傷害計算領域模型。
> 風格前提：純 domain 物件、無框架依賴，與現有 `Player`、`World` 一致，且每一塊都能單獨寫單元測試。

---

## 1. 目標

打**完整戰鬥系統**的地基，而非只跑通一次攻擊。設計要能承接後續擴充：暴擊、buff/debuff、物理與魔法減免、屬性克制（火/冰/雷…）、以及戰報／傷害日誌。

因此核心原則是：**角色與技能只存資料，傷害邏輯集中在一個結算者。** 這樣類別不會被戰鬥規則塞爆，新規則只動一個地方。

---

## 2. 核心決策（討論結論）

### 決策一：`Attack` 是「一次攻擊的結算快照」，不是技能定義
技能的靜態設定（火球術：base 50、倍率 1.5）屬於 `Skill`。`Attack` 代表「**這一下**實際打出多少、什麼屬性、有沒有暴擊」，是計算的產物，不是設定資料。

### 決策二：入口採「獨立結算者」
```typescript
resolver.resolve(attacker, target, skill): Attack
```
角色與技能都不主導計算，交給專門的 `CombatResolver`。角色類別（`Player`）不會因為戰鬥規則而變肥，結算邏輯可獨立測試。

（已排除：`attacker.useSkill(...)` 會讓 `Player` 越長越大；`skill.cast(...)` 會讓技能被迫認識攻守雙方屬性。）

### 決策三：倍率是「一串來源」，不是單一數字
`Attack` 持有倍率的**來源清單**（暴擊、buff、屬性克制各自一筆），而非一個乘好的黑盒數字。好處是可追溯、可做傷害日誌、debug「為什麼這下這麼痛」很容易。

### 決策四：大類與屬性是兩個正交維度
- **大類**（`DamageKind`）：物理 / 魔法 → 決定看 DEF 還是 MDEF。
- **屬性**（`DamageElement`）：火 / 冰 / 雷 / 無 → 決定看哪種抗性、有無克制。

兩者分開存欄位，避免爆炸成 `PhysicalFire`、`MagicalFire`… 的組合地獄。一把「火焰劍」＝物理大類＋火屬性。

---

## 3. 物件分工

| 物件 | 類型 | 職責 | 例子 |
|------|------|------|------|
| `Skill` | 靜態定義 | 技能不變的設定 | 火球術：base 50、倍率 1.5、魔法、火屬性 |
| `Combatant` | 當下狀態 | 攻/守方此刻的屬性 | STR、INT、暴擊率、DEF、MDEF、抗性、buff |
| `Attack` | 結算快照 | 這一次攻擊的產出 | 打了 320、暴擊、火屬性、倍率來源清單 |
| `CombatResolver` | 純函式服務 | 組合上面三者、跑完整傷害公式 | `resolve(attacker, target, skill)` |

> `Combatant` 是攻守雙方共通的「參戰者屬性」介面。`Player` 可以實作它，之後的怪物/NPC 也實作同一個介面，`CombatResolver` 就不必認識具體是誰。

---

## 4. 傷害計算流程（Damage Pipeline）

`CombatResolver.resolve` 內部依序：

```
1. 攻擊力基底  attackPower = 依 skill.kind 取 attacker 的 STR 或 INT
2. 原始傷害    raw = (attackPower + skill.baseDamage)
3. 倍率疊乘    收集倍率來源 → [skill 倍率, 暴擊?, buff?, 屬性克制?]
              multiplied = raw × Π(每個來源的 value)
4. 減免        mitigation = 依 skill.kind 取 target 的 DEF 或 MDEF
              （屬性抗性也在此套用）
5. 收斂        final = max(1, floor(multiplied − mitigation))
6. 產出        回傳 Attack { finalDamage: final, kind, element, multipliers: [...] }
```

每一步都是純計算，可用固定輸入寫斷言測試。

---

## 5. 型別草案

> 僅示意介面形狀，實作時再定案。

```typescript
export enum DamageKind {
  Physical = 'physical',
  Magical = 'magical',
}

export enum DamageElement {
  None = 'none',
  Fire = 'fire',
  Ice = 'ice',
  Thunder = 'thunder',
}

/** 倍率的單一來源，供追溯與戰報顯示 */
export interface Multiplier {
  readonly source: string; // 'skill' | 'crit' | 'buff' | 'element' ...
  readonly value: number;  // 1.5 = +50%
}

/** 技能的靜態定義 */
export interface Skill {
  readonly id: string;
  readonly baseDamage: number;
  readonly multiplier: number; // 技能本身的倍率
  readonly kind: DamageKind;
  readonly element: DamageElement;
}

/** 參戰者當下屬性（Player、怪物皆實作） */
export interface Combatant {
  readonly str: number;
  readonly int: number;
  readonly def: number;
  readonly mdef: number;
  readonly critRate: number;
  // resistances、buffs... 之後擴充
}

/** 一次攻擊的結算快照 */
export class Attack {
  constructor(
    public readonly finalDamage: number,
    public readonly kind: DamageKind,
    public readonly element: DamageElement,
    public readonly multipliers: readonly Multiplier[],
  ) {}
}

/** 純函式服務：跑完整傷害公式 */
export class CombatResolver {
  resolve(attacker: Combatant, target: Combatant, skill: Skill): Attack {
    // 見第 4 節流程
  }
}
```

---

## 6. 與現有程式碼的銜接

- ~~舊 `attack.ts` 改寫~~ 已完成：結算快照落地為 `value-objects/attack-result.vo.ts` 的 `AttackResultVo`（驗證 `finalDamage` 為正整數；`isCrit` / `totalMultiplier` 由 `multipliers` 推導）。
- `Player` 已實作 `Combatant`（`str`/`int`/`def`/`mdef`/`critRate`，經 `CombatStatsVo`）；`resistances` 尚未加入。
- 玩家出生屬性目前寫死在 `World.addPlayer`（掛 todo），`critRate` 一律 0——暴擊實作時一併處理。

---

## 7. 建議實作順序（含現況，2026-07-11）

1. ~~`DamageKind`、`DamageElement`、`Multiplier`、`Skill`、`Combatant` 型別~~（`damage.ts` / `skills.ts` / `combatant.ts`）。
2. ~~改寫 `Attack` 為結算快照~~（`AttackResultVo` + spec）。
3. ~~`CombatResolver.resolve` 骨架：「攻擊力 + base × 技能倍率 − 減免」~~（含測試）。
4. **未做**：疊加暴擊（進 `multipliers`），寫測試。現況 resolver 不 roll 暴擊、`critRate` 一律 0、`isCrit` 恆為 false——client 飄字的暴擊表現也因此接不上。
5. **未做**：疊加屬性克制與抗性，寫測試。現況 `element` 只隨結果傳遞、不參與計算，`Combatant` 無 `resistances`。
6. ~~`Player implements Combatant`，補戰鬥屬性~~（`CombatStatsVo`）。
7. **未做**：buff/debuff、戰報輸出等後續擴充。

已知技債：`combat-resolver.spec.ts` 測資與現行 `Skill` 介面（`range` / `castTime` 必填）型別不合——`tsconfig.build.json` 排除 spec 所以 typecheck 靜默，遲早要修。`Skill.hitCount` 已定義但 resolver 未使用（多段攻擊在待議清單）。

---

## 8. 明確排除 / 待議

- **排除**：用繼承拆 `PhysicalAttack` / `MagicalAttack`——兩者公式相同，差別只在減免來源，繼承是過度設計。
- **待議**：命中/閃避、傷害浮動（隨機 ±%）、多段攻擊（AOE / 連擊）、傷害上下限與破防機制——都可掛在 `CombatResolver` 或 `Multiplier` 上，不影響現有骨架。
