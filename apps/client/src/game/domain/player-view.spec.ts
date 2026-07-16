import { GAME_CONSTANTS } from '@mmo/shared';
import type { CastProgress } from './active-casts';
import { PlayerViewBuilder } from './player-view';
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

describe('PlayerViewBuilder', () => {
  describe('facing', () => {
    it('faces right by default', () => {
      expect(build(new PlayerViewBuilder(), player()).facing).toBe(1);
    });

    it('faces along the horizontal heading', () => {
      const builder = new PlayerViewBuilder();
      expect(build(builder, player({ dirX: -0.7 })).facing).toBe(-1);
      expect(build(builder, player({ dirX: 0.7 })).facing).toBe(1);
    });

    it('keeps the last facing while the heading is vertical', () => {
      const builder = new PlayerViewBuilder();
      build(builder, player({ dirX: -1 }));
      expect(build(builder, player({ dirX: 0, dirY: 1 })).facing).toBe(-1);
    });

    it('tracks facing per player', () => {
      const builder = new PlayerViewBuilder();
      const views = builder.build(
        [player({ id: 'a', dirX: -1 }), player({ id: 'b', dirX: 1 })],
        noCasts,
        null,
      );
      expect(views.map((v) => v.facing)).toEqual([-1, 1]);
    });

    it('forgets facing for players who left', () => {
      const builder = new PlayerViewBuilder();
      build(builder, player({ dirX: -1 }));
      builder.build([], noCasts, null); // p1 left the world
      expect(build(builder, player()).facing).toBe(1);
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
