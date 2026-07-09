import type { Player } from './player';
import { hitTestWorld, PLAYER_HIT_RADIUS } from './world-hit-test';

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'P1',
  x: 100,
  y: 100,
  hp: 1000,
  mp: 200,
  ...overrides,
});

describe('hitTestWorld', () => {
  it('returns ground when no players', () => {
    expect(hitTestWorld([], 100, 100)).toEqual({ kind: 'ground' });
  });

  it('returns ground when click is outside every hit radius', () => {
    const player = makePlayer();
    expect(hitTestWorld([player], 100 + PLAYER_HIT_RADIUS + 1, 100)).toEqual({ kind: 'ground' });
  });

  it('returns the player when click is within hit radius', () => {
    const player = makePlayer();
    expect(hitTestWorld([player], 100 + PLAYER_HIT_RADIUS, 100)).toEqual({
      kind: 'player',
      player,
    });
  });

  it('returns the nearest player when hit circles overlap', () => {
    const near = makePlayer({ id: 'near', x: 110 });
    const far = makePlayer({ id: 'far', x: 130 });
    expect(hitTestWorld([far, near], 100, 100)).toEqual({ kind: 'player', player: near });
  });
});
