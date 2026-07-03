import { Player } from './player';

describe('Player', () => {
  const makePlayer = () => new Player('p1', 'Alice', 0, 0, 100);

  it('does not move without a target', () => {
    const p = makePlayer();
    p.advance(1);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
    expect(p.isMoving).toBe(false);
  });

  it('moves toward the target at its speed', () => {
    const p = makePlayer();
    p.setTarget(300, 0);
    p.advance(1); // 100 px/s * 1s
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
    expect(p.isMoving).toBe(true);
  });

  it('moves along the diagonal, not axis by axis', () => {
    const p = makePlayer();
    p.setTarget(300, 400); // 3-4-5 triangle, distance 500
    p.advance(1);
    expect(p.x).toBeCloseTo(60); // 100 * 3/5
    expect(p.y).toBeCloseTo(80); // 100 * 4/5
  });

  it('stops exactly on the target without overshooting', () => {
    const p = makePlayer();
    p.setTarget(30, 40); // distance 50, step would be 100
    p.advance(1);
    expect(p.x).toBe(30);
    expect(p.y).toBe(40);
    expect(p.isMoving).toBe(false);
  });

  it('a new target overrides the previous one', () => {
    const p = makePlayer();
    p.setTarget(1000, 0);
    p.advance(1);
    p.setTarget(0, 0);
    p.advance(10); // plenty of time to arrive
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });
});
