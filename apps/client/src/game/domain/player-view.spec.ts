import { GAME_CONSTANTS } from '@mmo/shared';
import type { ActiveAttack } from './active-attacks';
import type { CastProgress } from './active-casts';
import { facingOf, PlayerViewBuilder } from './player-view';
import type { Player } from './player';
import { ATTACK_TTL_MS, HURT_DURATION_MS, impactAtMs } from './skill-timing';

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
const noAttacks: ActiveAttack[] = [];

const attackBy = (attackerId: string, overrides: Partial<ActiveAttack> = {}): ActiveAttack => ({
  attackerId,
  targetId: 'target',
  skillId: 'basic',
  damage: 10,
  startedAt: 0,
  ...overrides,
});

const build = (builder: PlayerViewBuilder, p: Player, selfId: string | null = null, now = 0) =>
  builder.build([p], noCasts, noAttacks, selfId, now)[0];

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
        noAttacks,
        null,
        0,
      );
      expect(views.map((v) => v.facing)).toEqual(['left', 'down']);
    });

    it('turns combatants toward each other during an attack', () => {
      const views = new PlayerViewBuilder().build(
        [player({ id: 'p1', x: 0, y: 0 }), player({ id: 'target', x: 10, y: 0 })],
        noCasts,
        [attackBy('p1')],
        null,
        0,
      );
      expect(views[0].facing).toBe('right');
      expect(views[1].facing).toBe('left');
    });

    it('forgets facing for players who left', () => {
      const builder = new PlayerViewBuilder();
      build(builder, player({ dirX: -1 }));
      builder.build([], noCasts, noAttacks, null, 0); // p1 left the world
      expect(build(builder, player()).facing).toBe('down');
    });
  });

  describe('animation', () => {
    const buildWith = (attacks: ActiveAttack[], players: Player[], now: number) =>
      new PlayerViewBuilder().build(players, noCasts, attacks, null, now);

    it('walks while moving, idles otherwise', () => {
      const builder = new PlayerViewBuilder();
      expect(build(builder, player({ moving: true })).animation).toBe('walk');
      expect(build(builder, player({ moving: false })).animation).toBe('idle');
    });

    it('attacks during the swing, then goes back to idle', () => {
      const attacks = [attackBy('p1')];
      expect(buildWith(attacks, [player()], 0)[0].animation).toBe('attack');
      expect(buildWith(attacks, [player()], ATTACK_TTL_MS)[0].animation).toBe('idle');
    });

    it('attack wins over walk', () => {
      const views = buildWith([attackBy('p1')], [player({ moving: true })], 0);
      expect(views[0].animation).toBe('attack');
    });

    it('hurts the target immediately for an instant-hit skill', () => {
      const views = buildWith([attackBy('p1')], [player(), player({ id: 'target' })], 0);
      expect(views[1].animation).toBe('hurt');
    });

    it('hurt wins over the target own attack', () => {
      const attacks = [attackBy('p1'), attackBy('target', { targetId: 'p1' })];
      const views = buildWith(attacks, [player(), player({ id: 'target' })], 0);
      expect(views.map((v) => v.animation)).toEqual(['hurt', 'hurt']);
    });

    it('delays the flinch until the skill lands', () => {
      const impact = impactAtMs('fireball');
      const attacks = [attackBy('p1', { skillId: 'fireball' })];
      const players = [player(), player({ id: 'target' })];

      expect(buildWith(attacks, players, impact - 1)[1].animation).toBe('idle');
      expect(buildWith(attacks, players, impact)[1].animation).toBe('hurt');
      expect(buildWith(attacks, players, impact + HURT_DURATION_MS - 1)[1].animation).toBe('hurt');
      expect(buildWith(attacks, players, impact + HURT_DURATION_MS)[1].animation).toBe('idle');
    });

    it('ends the swing on schedule even while the target still flinches', () => {
      const attacks = [attackBy('p1', { skillId: 'fireball' })];
      const players = [player(), player({ id: 'target' })];
      const views = buildWith(attacks, players, ATTACK_TTL_MS);

      expect(views[0].animation).toBe('idle');
      expect(views[1].animation).toBe('hurt'); // fireball lands at 0.9 * TTL
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
        [
          'p1',
          { casterId: 'p1', skillId: 'fireball', startedAt: 0, duration: 1000, progress: 0.4 },
        ],
      ]);
      expect(builder.build([player()], casts, noAttacks, null, 0)[0].castPct).toBe(0.4);
      expect(build(builder, player()).castPct).toBe(0);
    });
  });

  it('marks only the self player', () => {
    const views = new PlayerViewBuilder().build(
      [player({ id: 'me' }), player({ id: 'other' })],
      noCasts,
      noAttacks,
      'me',
      0,
    );
    expect(views.map((v) => v.isSelf)).toEqual([true, false]);
  });
});
