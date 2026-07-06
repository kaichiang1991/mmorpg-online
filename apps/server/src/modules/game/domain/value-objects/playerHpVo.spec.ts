import { PlayerHpVo } from './playerHpVo';

describe('PlayerHpVo', () => {
  it('should create an instance', () => {
    expect(new PlayerHpVo(100, 100)).toBeTruthy();
  });

  it('show percentage fixed to 1 digit', () => {
    const playerHpVo = new PlayerHpVo(50, 100);
    expect(playerHpVo.percentage).toBe(0.5);
  });
});
