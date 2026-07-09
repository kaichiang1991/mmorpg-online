import type { Player } from './player';

/** Approximates the on-screen body (49x78 px, centered on the player position) as a circle. */
export const PLAYER_HIT_RADIUS = 40;

/**
 * What occupies a point in the world. Extend the union as new clickable
 * entities appear (monsters, items, ...).
 */
export type WorldHit = { kind: 'player'; player: Player } | { kind: 'ground' };

/** Resolves a world point to the nearest player within hit radius, else ground. */
export function hitTestWorld(players: Player[], x: number, y: number): WorldHit {
  let nearest: Player | undefined;
  let nearestDistSq = PLAYER_HIT_RADIUS ** 2;

  for (const player of players) {
    const distSq = (player.x - x) ** 2 + (player.y - y) ** 2;
    if (distSq <= nearestDistSq) {
      nearest = player;
      nearestDistSq = distSq;
    }
  }

  return nearest ? { kind: 'player', player: nearest } : { kind: 'ground' };
}
