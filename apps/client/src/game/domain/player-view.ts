import { GAME_CONSTANTS } from '@mmo/shared';
import type { ActiveAttack } from './active-attacks';
import type { CastProgress } from './active-casts';
import type { Player } from './player';
import { isAttackingAt, isHurtingAt } from './skill-timing';

export type PlayerAnimation = 'idle' | 'walk' | 'attack' | 'hurt';

/** Eight-way facing, named by screen direction (y grows downward). */
export type Facing8 =
  'down' | 'down-left' | 'left' | 'up-left' | 'up' | 'up-right' | 'right' | 'down-right';

/** Octant lookup for atan2(dirY, dirX): index 0 is +x, going clockwise on screen. */
const FACING_BY_OCTANT: Facing8[] = [
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
  'up',
  'up-right',
];

/** Snap a heading vector to the nearest of the eight facings. */
export const facingOf = (dirX: number, dirY: number): Facing8 =>
  FACING_BY_OCTANT[(Math.round(Math.atan2(dirY, dirX) / (Math.PI / 4)) + 8) % 8];

/**
 * Everything the renderer needs to draw one player. Data only — how it
 * looks (textures, bar shapes, colors) lives in the renderer.
 */
export interface PlayerView {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Holds the last heading while the player stands still. */
  facing: Facing8;
  animation: PlayerAnimation;
  /** 0..1 */
  hpPct: number;
  mpPct: number;
  castPct: number;
  isSelf: boolean;
}

/**
 * Projects raw players into render-ready views. Stateful only for facing:
 * while the heading is the zero vector (never moved yet) the last facing is
 * kept, so the sprite doesn't snap back to a default while standing.
 * Pure logic — unit-tested, no Pixi dependencies.
 */
export class PlayerViewBuilder {
  private readonly facing = new Map<string, Facing8>();

  build(
    players: Player[],
    casts: ReadonlyMap<string, CastProgress>,
    attacks: readonly ActiveAttack[],
    selfId: string | null,
    now: number,
  ): PlayerView[] {
    const playerById = new Map(players.map((p) => [p.id, p]));
    // phases open and close independently: the swing runs from the attack
    // event, the flinch only from the skill's impact time (skill-timing)
    const attackers = new Set(
      attacks.filter((a) => isAttackingAt(a, now)).map((a) => a.attackerId),
    );
    const hurting = new Set(attacks.filter((a) => isHurtingAt(a, now)).map((a) => a.targetId));

    // facing: heading first, then combatants override to face each other
    // for the attack's whole retention, flinch included
    for (const p of players) {
      if (p.dirX !== 0 || p.dirY !== 0) this.facing.set(p.id, facingOf(p.dirX, p.dirY));
    }
    for (const { attackerId, targetId } of attacks) {
      const attacker = playerById.get(attackerId);
      const target = playerById.get(targetId);
      if (attacker && target) {
        this.facing.set(attackerId, facingOf(target.x - attacker.x, target.y - attacker.y));
        this.facing.set(targetId, facingOf(attacker.x - target.x, attacker.y - target.y));
      }
    }

    const views = players.map((p): PlayerView => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      facing: this.facing.get(p.id) ?? 'down',
      animation: hurting.has(p.id)
        ? 'hurt'
        : attackers.has(p.id)
          ? 'attack'
          : p.moving
            ? 'walk'
            : 'idle',
      hpPct: p.hp / GAME_CONSTANTS.MAX_HP,
      mpPct: p.mp / GAME_CONSTANTS.MAX_MP,
      castPct: casts.get(p.id)?.progress ?? 0,
      isSelf: p.id === selfId,
    }));

    // forget players who left, so the map doesn't grow forever
    for (const id of this.facing.keys()) {
      if (!playerById.has(id)) this.facing.delete(id);
    }
    return views;
  }
}
