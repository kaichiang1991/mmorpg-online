import { GAME_CONSTANTS } from '@mmo/shared';
import type { CastProgress } from './active-casts';
import type { Player } from './player';

export type PlayerAnimation = 'idle' | 'walk';

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
    selfId: string | null,
  ): PlayerView[] {
    const seen = new Set<string>();
    const views = players.map((p): PlayerView => {
      seen.add(p.id);
      if (p.dirX !== 0 || p.dirY !== 0) this.facing.set(p.id, facingOf(p.dirX, p.dirY));

      return {
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        facing: this.facing.get(p.id) ?? 'down',
        animation: p.moving ? 'walk' : 'idle',
        hpPct: p.hp / GAME_CONSTANTS.MAX_HP,
        mpPct: p.mp / GAME_CONSTANTS.MAX_MP,
        castPct: casts.get(p.id)?.progress ?? 0,
        isSelf: p.id === selfId,
      };
    });

    // forget players who left, so the map doesn't grow forever
    for (const id of this.facing.keys()) {
      if (!seen.has(id)) this.facing.delete(id);
    }
    return views;
  }
}
