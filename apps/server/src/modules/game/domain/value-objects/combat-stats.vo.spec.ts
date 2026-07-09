import { CombatStatsVo } from './combat-stats.vo';

describe('CombatStatsVo', () => {
  it('creates with valid stats', () => {
    const stats = new CombatStatsVo(200, 100, 80, 60, 0.25);
    expect(stats.str).toBe(200);
    expect(stats.int).toBe(100);
    expect(stats.def).toBe(80);
    expect(stats.mdef).toBe(60);
    expect(stats.critRate).toBe(0.25);
  });

  it('rejects negative base stats', () => {
    expect(() => new CombatStatsVo(-1, 100, 100, 100, 0)).toThrow();
    expect(() => new CombatStatsVo(100, -1, 100, 100, 0)).toThrow();
    expect(() => new CombatStatsVo(100, 100, -1, 100, 0)).toThrow();
    expect(() => new CombatStatsVo(100, 100, 100, -1, 0)).toThrow();
  });

  it('rejects critRate outside [0, 1]', () => {
    expect(() => new CombatStatsVo(100, 100, 100, 100, -0.1)).toThrow();
    expect(() => new CombatStatsVo(100, 100, 100, 100, 1.1)).toThrow();
  });

  it('allows critRate boundaries', () => {
    expect(new CombatStatsVo(100, 100, 100, 100, 0).critRate).toBe(0);
    expect(new CombatStatsVo(100, 100, 100, 100, 1).critRate).toBe(1);
  });

  it('rejects non-finite values', () => {
    expect(() => new CombatStatsVo(NaN, 100, 100, 100, 0)).toThrow();
    expect(() => new CombatStatsVo(Infinity, 100, 100, 100, 0)).toThrow();
  });

  it('from() copies a Combatant snapshot', () => {
    const stats = CombatStatsVo.from({ str: 1, int: 2, def: 3, mdef: 4, critRate: 0.5 });
    expect(stats).toEqual(new CombatStatsVo(1, 2, 3, 4, 0.5));
  });
});
