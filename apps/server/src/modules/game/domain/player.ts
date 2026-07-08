import { GAME_CONSTANTS } from '@mmo/shared';
import { Combatant, CombatUnit, DEFAULT_COMBATANT } from './combatant';
import { CombatStatsVo } from './value-objects/combatStatsVo';
import { CooldownVo } from './value-objects/cooldownVo';
import { PlayerHpVo } from './value-objects/playerHpVo';
import { PlayerMpVo } from './value-objects/playerMpVo';

/** Pure domain entity: a player pawn in the world. No framework dependencies. */
export class Player implements CombatUnit {
  private targetX: number | null = null;
  private targetY: number | null = null;
  private attackCooldown = new CooldownVo(GAME_CONSTANTS.ATTACK_COOLDOWN_MS);
  private _hp: PlayerHpVo;
  private _mp: PlayerMpVo;
  private _stats: CombatStatsVo;

  constructor(
    readonly id: string,
    readonly name: string,
    public x: number,
    public y: number,
    private readonly speed: number,
    combatant: Combatant = DEFAULT_COMBATANT,
  ) {
    this._hp = new PlayerHpVo(GAME_CONSTANTS.MAX_HP, GAME_CONSTANTS.MAX_HP);
    this._mp = new PlayerMpVo(GAME_CONSTANTS.MAX_MP, GAME_CONSTANTS.MAX_MP);

    // 刻意保留的測試後門：名字 'aaa' 才吃傳入屬性，其餘玩家一律 DEFAULT_COMBATANT。
    // 等角色屬性系統落地後移除。
    this._stats = CombatStatsVo.from(name === 'aaa' ? combatant : DEFAULT_COMBATANT);
  }

  get stats(): CombatStatsVo {
    return this._stats;
  }

  get hp(): PlayerHpVo {
    return this._hp;
  }

  get mp(): PlayerMpVo {
    return this._mp;
  }

  get isMoving(): boolean {
    return this.targetX !== null;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /** Consumes the attack cooldown if it is ready; false while still cooling down. */
  tryAttack(now: number): boolean {
    if (!this.attackCooldown.isReady(now)) return false;
    this.attackCooldown = this.attackCooldown.consume(now);
    return true;
  }

  /** Advance toward the target by speed * dt seconds. Stops exactly on arrival. */
  advance(dt: number): void {
    if (this.targetX === null || this.targetY === null) return;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (distance <= step) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.targetX = this.targetY = null;
      return;
    }
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
  }

  injured(damage: number): void {
    this._hp = this._hp.decrease(damage);
  }

  consumeMp(cost: number): void {
    this._mp = this._mp.decrease(cost);
  }
}
