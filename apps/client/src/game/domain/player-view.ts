import { GAME_CONSTANTS } from '@mmo/shared';
import type { CastProgress } from './active-casts';
import type { Player } from './player';

export type PlayerAnimation = 'idle' | 'walk';

/**
 * Everything the renderer needs to draw one player. Data only — how it
 * looks (textures, bar shapes, colors) lives in the renderer.
 */
export interface PlayerView {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Horizontal facing; holds the last value while the heading is vertical. */
  facing: 1 | -1;
  animation: PlayerAnimation;
  /** 0..1 */
  hpPct: number;
  mpPct: number;
  castPct: number;
  isSelf: boolean;
}

/**
 * Projects raw players into render-ready views. Stateful only for facing:
 * while dirX is 0 (vertical heading) the last horizontal facing is kept,
 * so the sprite doesn't snap back to a default while walking up or down.
 * Pure logic — unit-tested, no Pixi dependencies.
 */
export class PlayerViewBuilder {
  private readonly facing = new Map<string, 1 | -1>();

  build(
    players: Player[],
    casts: ReadonlyMap<string, CastProgress>,
    selfId: string | null,
  ): PlayerView[] {
    const seen = new Set<string>();
    const views = players.map((p): PlayerView => {
      seen.add(p.id);
      if (p.dirX !== 0) this.facing.set(p.id, p.dirX < 0 ? -1 : 1);

      return {
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        facing: this.facing.get(p.id) ?? 1,
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
