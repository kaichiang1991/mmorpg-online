import { PlayerMpVo } from './playerMpVo';

describe('PlayerMpVo', () => {
  it('should create an instance', () => {
    expect(new PlayerMpVo(100, 100)).toBeTruthy();
  });

  it('percentage is the raw ratio', () => {
    expect(new PlayerMpVo(150, 200).percentage).toBe(0.75);
  });

  it('remain MP shows in integer', () => {
    const playerMpVo = new PlayerMpVo(50.123, 100);
    expect(playerMpVo.remainMp).toBe(50);
  });

  it('never drops below zero', () => {
    const playerMpVo = new PlayerMpVo(100, 100).decrease(250);
    expect(playerMpVo.remainMp).toBe(0);
    expect(playerMpVo.percentage).toBe(0);
  });

  it('caps mp at maxMp', () => {
    expect(new PlayerMpVo(500, 200).remainMp).toBe(200);
  });

  it('rejects a non-positive maxMp', () => {
    expect(() => new PlayerMpVo(100, 0)).toThrow();
    expect(() => new PlayerMpVo(100, -5)).toThrow();
  });
});
