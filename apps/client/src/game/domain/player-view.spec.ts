import { GAME_CONSTANTS } from '@mmo/shared';
import type { CastProgress } from './active-casts';
import { facingOf, PlayerViewBuilder } from './player-view';
import type { Player } from './player';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Kai',
  x: 10,
  y: 20,
  dirX: 0,
  dirY: 0,
  moving: false,
  hp: GAME_CONSTANTS.MAX_HP,
  mp: GAME_CONSTANTS.MAX_MP,
  ...overrides,
});

const noCasts = new Map<string, CastProgress>();

const build = (builder: PlayerViewBuilder, p: Player, selfId: string | null = null) =>
  builder.build([p], noCasts, selfId)[0];

const DIAGONAL = Math.SQRT1_2; // unit-vector component at 45°

describe('facingOf', () => {
  it.each([
    [0, 1, 'down'],
    [0, -1, 'up'],
    [1, 0, 'right'],
    [-1, 0, 'left'],
    [DIAGONAL, DIAGONAL, 'down-right'],
    [-DIAGONAL, DIAGONAL, 'down-left'],
    [DIAGONAL, -DIAGONAL, 'up-right'],
    [-DIAGONAL, -DIAGONAL, 'up-left'],
  ] as const)('maps heading (%f, %f) to %s', (dirX, dirY, expected) => {
    expect(facingOf(dirX, dirY)).toBe(expected);
  });

  it('snaps a heading between octants to the nearest one', () => {
    expect(facingOf(0.99, 0.1)).toBe('right');
    expect(facingOf(0.6, 0.8)).toBe('down-right');
  });
});

describe('PlayerViewBuilder', () => {
  describe('facing', () => {
    it('faces down by default', () => {
      expect(build(new PlayerViewBuilder(), player()).facing).toBe('down');
    });

    it('faces along the heading', () => {
      const builder = new PlayerViewBuilder();
      expect(build(builder, player({ dirX: -1 })).facing).toBe('left');
      expect(build(builder, player({ dirX: DIAGONAL, dirY: -DIAGONAL })).facing).toBe('up-right');
    });

    it('keeps the last facing while the heading is the zero vector', () => {
      const builder = new PlayerViewBuilder();
      build(builder, player({ dirX: -1 }));
      expect(build(builder, player()).facing).toBe('left');
    });

    it('tracks facing per player', () => {
      const builder = new PlayerViewBuilder();
      const views = builder.build(
        [player({ id: 'a', dirX: -1 }), player({ id: 'b', dirY: 1 })],
        noCasts,
        null,
      );
      expect(views.map((v) => v.facing)).toEqual(['left', 'down']);
    });

    it('forgets facing for players who left', () => {
      const builder = new PlayerViewBuilder();
      build(builder, player({ dirX: -1 }));
      builder.build([], noCasts, null); // p1 left the world
      expect(build(builder, player()).facing).toBe('down');
    });
  });

  describe('animation', () => {
    it('walks while moving, idles otherwise', () => {
      const builder = new PlayerViewBuilder();
      expect(build(builder, player({ moving: true })).animation).toBe('walk');
      expect(build(builder, player({ moving: false })).animation).toBe('idle');
    });
  });

  describe('stats', () => {
    it('reports hp and mp as fractions of the shared maxima', () => {
      const view = build(
        new PlayerViewBuilder(),
        player({ hp: GAME_CONSTANTS.MAX_HP / 2, mp: GAME_CONSTANTS.MAX_MP / 4 }),
      );
      expect(view.hpPct).toBe(0.5);
      expect(view.mpPct).toBe(0.25);
    });

    it('takes cast progress from the matching cast, defaulting to 0', () => {
      const builder = new PlayerViewBuilder();
      const casts = new Map<string, CastProgress>([
        ['p1', { casterId: 'p1', skillId: 'fireball', startedAt: 0, duration: 1000, progress: 0.4 }],
      ]);
      expect(builder.build([player()], casts, null)[0].castPct).toBe(0.4);
      expect(build(builder, player()).castPct).toBe(0);
    });
  });

  it('marks only the self player', () => {
    const views = new PlayerViewBuilder().build(
      [player({ id: 'me' }), player({ id: 'other' })],
      noCasts,
      'me',
    );
    expect(views.map((v) => v.isSelf)).toEqual([true, false]);
  });
});
