import { PlayerHpVo } from './playerHpVo';

describe('PlayerHpVo', () => {
  it('should create an instance', () => {
    expect(new PlayerHpVo(100, 100)).toBeTruthy();
  });

  it('show percentage fixed to 1 digit', () => {
    const playerHpVo = new PlayerHpVo(50, 100);
    expect(playerHpVo.percentage).toBe(0.5);
  });

  it('remain HP shows in integer', () => {
    const playerHpVo = new PlayerHpVo(50.123, 100);
    expect(playerHpVo.remainHp).toBe(50);
  });
});
