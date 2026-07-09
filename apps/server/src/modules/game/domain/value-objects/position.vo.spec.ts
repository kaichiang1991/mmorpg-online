import { PositionVo } from './position.vo';

describe('PositionVo', () => {
  describe('distanceTo', () => {
    it('computes the euclidean distance', () => {
      expect(new PositionVo(0, 0).distanceTo(new PositionVo(300, 400))).toBe(500);
    });

    it('is zero for the same point', () => {
      expect(new PositionVo(5, 5).distanceTo(new PositionVo(5, 5))).toBe(0);
    });
  });

  describe('moveToward', () => {
    it('moves along the diagonal, not axis by axis', () => {
      const next = new PositionVo(0, 0).moveToward(new PositionVo(300, 400), 100);
      expect(next.x).toBeCloseTo(60); // 100 * 3/5
      expect(next.y).toBeCloseTo(80); // 100 * 4/5
    });

    it('returns the target itself when the step covers the distance', () => {
      const target = new PositionVo(30, 40);
      expect(new PositionVo(0, 0).moveToward(target, 100)).toBe(target);
    });

    it('does not move with a zero step', () => {
      const next = new PositionVo(10, 20).moveToward(new PositionVo(100, 100), 0);
      expect(next.equals(new PositionVo(10, 20))).toBe(true);
    });
  });

  describe('clampTo', () => {
    it('clamps into the map rectangle', () => {
      const clamped = new PositionVo(-500, 99999).clampTo(1600, 1200);
      expect(clamped.equals(new PositionVo(0, 1200))).toBe(true);
    });

    it('leaves an in-bounds position untouched', () => {
      const clamped = new PositionVo(800, 600).clampTo(1600, 1200);
      expect(clamped.equals(new PositionVo(800, 600))).toBe(true);
    });
  });

  describe('equals', () => {
    it('compares by value', () => {
      expect(new PositionVo(1, 2).equals(new PositionVo(1, 2))).toBe(true);
      expect(new PositionVo(1, 2).equals(new PositionVo(2, 1))).toBe(false);
    });
  });
});
