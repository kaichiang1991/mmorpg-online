import { DirectionVo } from './direction.vo';
import { PositionVo } from './position.vo';

describe('DirectionVo', () => {
  it('normalizes the vector between two positions', () => {
    const dir = DirectionVo.between(new PositionVo(0, 0), new PositionVo(30, 40));
    expect(dir.x).toBeCloseTo(0.6);
    expect(dir.y).toBeCloseTo(0.8);
    expect(Math.hypot(dir.x, dir.y)).toBeCloseTo(1);
  });

  it('points along a single axis when the other component matches', () => {
    const dir = DirectionVo.between(new PositionVo(10, 5), new PositionVo(0, 5));
    expect(dir.x).toBe(-1);
    expect(dir.y).toBe(0);
  });

  it('is ZERO when the positions coincide', () => {
    const p = new PositionVo(7, 7);
    expect(DirectionVo.between(p, p)).toBe(DirectionVo.ZERO);
  });

  it('isZero is true only for the ZERO direction', () => {
    expect(DirectionVo.ZERO.isZero).toBe(true);
    expect(DirectionVo.between(new PositionVo(0, 0), new PositionVo(1, 0)).isZero).toBe(false);
  });
});
