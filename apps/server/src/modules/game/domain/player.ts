import { GAME_CONSTANTS, SkillId } from '@mmo/shared';
import { Combatant, CombatUnit, DEFAULT_COMBATANT } from './combatant';
import { CombatStatsVo } from './value-objects/combat-stats.vo';
import { CooldownVo } from './value-objects/cooldown.vo';
import { PositionVo } from './value-objects/position.vo';
import { ResourcePoolVo } from './value-objects/resource-pool.vo';
import { Skill } from './skills';
import { CastingVo } from './value-objects/casting.vo';

/** Pure domain entity: a player pawn in the world. No framework dependencies. */
export class Player implements CombatUnit {
  private target: PositionVo | null = null;
  private _position: PositionVo;
  private _hp: ResourcePoolVo;
  private _mp: ResourcePoolVo;
  private readonly _stats: CombatStatsVo;
  private _casting: CastingVo | null = null;
  private _cooldownMap = new Map<SkillId, CooldownVo>();

  constructor(
    readonly id: string,
    readonly name: string,
    x: number,
    y: number,
    private readonly speed: number,
    combatant: Combatant = DEFAULT_COMBATANT,
  ) {
    this._position = new PositionVo(x, y);
    this._hp = new ResourcePoolVo(GAME_CONSTANTS.MAX_HP, GAME_CONSTANTS.MAX_HP);
    this._mp = new ResourcePoolVo(GAME_CONSTANTS.MAX_MP, GAME_CONSTANTS.MAX_MP);

    // 刻意保留的測試後門：名字 'aaa' 才吃傳入屬性，其餘玩家一律 DEFAULT_COMBATANT。
    // 等角色屬性系統落地後移除。
    this._stats = CombatStatsVo.from(name === 'aaa' ? combatant : DEFAULT_COMBATANT);
  }

  get stats(): CombatStatsVo {
    return this._stats;
  }

  get hp(): ResourcePoolVo {
    return this._hp;
  }

  get mp(): ResourcePoolVo {
    return this._mp;
  }

  get position(): PositionVo {
    return this._position;
  }

  set position(position: PositionVo) {
    this._position = position;
  }

  get x(): number {
    return this._position.x;
  }

  get y(): number {
    return this._position.y;
  }

  get isMoving(): boolean {
    return this.target !== null;
  }

  get casting(): CastingVo | null {
    return this._casting;
  }

  setTarget(target: PositionVo): void {
    this.target = target;
  }

  /** Advance toward the target by speed * dt seconds. Stops exactly on arrival. */
  advance(dt: number): void {
    if (this.target === null) return;
    this._position = this._position.moveToward(this.target, this.speed * dt);
    if (this._position.equals(this.target)) this.target = null;
  }

  injured(damage: number): void {
    this._hp = this._hp.decrease(damage);
  }

  consumeMp(cost: number): void {
    this._mp = this._mp.decrease(cost);
  }

  castSkill(skill: Skill, now: number) {
    this._casting = new CastingVo(skill, now);
  }

  clearCasting(): void {
    this._casting = null;
  }

  isSkillReady(skillId: SkillId, now: number): boolean {
    return this._cooldownMap.get(skillId)?.isReady(now) ?? true;
  }

  tryUseSkill(skill: Skill, now: number): boolean {
    if (!this.isSkillReady(skill.id, now)) return false;
    const cooldown = CooldownVo.from(skill);
    if (cooldown) this._cooldownMap.set(skill.id, cooldown.consume(now));
    return true;
  }
}
