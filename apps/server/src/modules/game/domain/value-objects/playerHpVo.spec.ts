import { PlayerHpVo } from './playerHpVo';

describe('PlayerHpVo', () => {
  it('should create an instance', () => {
    expect(new PlayerHpVo(100, 100)).toBeTruthy();
  });

  it('percentage is the raw ratio', () => {
    expect(new PlayerHpVo(950, 1000).percentage).toBe(0.95);
  });

  it('remain HP shows in integer', () => {
    const playerHpVo = new PlayerHpVo(50.123, 100);
    expect(playerHpVo.remainHp).toBe(50);
  });

  it('never drops below zero', () => {
    const playerHpVo = new PlayerHpVo(100, 100).decrease(250);
    expect(playerHpVo.remainHp).toBe(0);
    expect(playerHpVo.percentage).toBe(0);
  });

  it('caps hp at maxHp', () => {
    expect(new PlayerHpVo(1500, 1000).remainHp).toBe(1000);
  });

  it('rejects a non-positive maxHp', () => {
    expect(() => new PlayerHpVo(100, 0)).toThrow();
    expect(() => new PlayerHpVo(100, -5)).toThrow();
  });
});
