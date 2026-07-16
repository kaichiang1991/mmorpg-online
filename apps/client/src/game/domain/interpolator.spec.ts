import type { WorldSnapshot } from '@mmo/shared';
import { Interpolator } from './interpolator';

const snap = (t: number, x: number, y: number, dirX = 0, dirY = 0): WorldSnapshot => ({
  t,
  players: [{ id: 'p1', name: 'Alice', x, y, dirX, dirY, hp: 1000, mp: 200 }],
});

describe('Interpolator', () => {
  it('returns empty before any snapshot', () => {
    expect(new Interpolator().playersAt(0)).toEqual([]);
  });

  it('snaps to the only snapshot when there is no previous one', () => {
    const itp = new Interpolator();
    itp.push(snap(0, 100, 200), 1000);
    expect(itp.playersAt(1050)).toEqual([
      {
        id: 'p1',
        name: 'Alice',
        x: 100,
        y: 200,
        dirX: 0,
        dirY: 0,
        moving: false,
        hp: 1000,
        mp: 200,
      },
    ]);
  });

  it('lerps halfway between two snapshots', () => {
    const itp = new Interpolator();
    itp.push(snap(0, 0, 0), 1000);
    itp.push(snap(100, 100, 50), 1100); // span 100ms
    const [p] = itp.playersAt(1150); // 50ms after latest → alpha 0.5
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(25);
  });

  it('clamps alpha at 1 when render time passes the snapshot span', () => {
    const itp = new Interpolator();
    itp.push(snap(0, 0, 0), 1000);
    itp.push(snap(100, 100, 50), 1100);
    const [p] = itp.playersAt(5000);
    expect(p.x).toBe(100);
    expect(p.y).toBe(50);
  });

  it('snaps players that appear only in the latest snapshot', () => {
    const itp = new Interpolator();
    itp.push({ t: 0, players: [] }, 1000);
    itp.push(snap(100, 300, 400), 1100);
    const [p] = itp.playersAt(1110);
    expect(p.x).toBe(300);
    expect(p.y).toBe(400);
  });

  it('drops players missing from the latest snapshot', () => {
    const itp = new Interpolator();
    itp.push(snap(0, 0, 0), 1000);
    itp.push({ t: 100, players: [] }, 1100);
    expect(itp.playersAt(1150)).toEqual([]);
  });

  describe('movement vector', () => {
    it('is moving with the latest heading while the segment has displacement', () => {
      const itp = new Interpolator();
      itp.push(snap(0, 0, 0, 1, 0), 1000);
      itp.push(snap(100, 100, 0, 1, 0), 1100);
      const [p] = itp.playersAt(1150);
      expect(p.moving).toBe(true);
      expect(p.dirX).toBe(1);
      expect(p.dirY).toBe(0);
    });

    it('keeps the previous heading on the stop segment', () => {
      // latest snapshot reports the arrival: position moved but heading is
      // already (0,0) — the sprite is still sliding, so the walk facing holds
      const itp = new Interpolator();
      itp.push(snap(0, 0, 0, 0.6, 0.8), 1000);
      itp.push(snap(100, 30, 40, 0, 0), 1100);
      const [p] = itp.playersAt(1150);
      expect(p.moving).toBe(true);
      expect(p.dirX).toBe(0.6);
      expect(p.dirY).toBe(0.8);
    });

    it('is idle when the segment has no displacement', () => {
      const itp = new Interpolator();
      itp.push(snap(0, 30, 40, 0, 0), 1000);
      itp.push(snap(100, 30, 40, 0, 0), 1100);
      const [p] = itp.playersAt(1150);
      expect(p.moving).toBe(false);
      expect(p.dirX).toBe(0);
      expect(p.dirY).toBe(0);
    });

    it('snaps newly appeared players as not moving', () => {
      const itp = new Interpolator();
      itp.push({ t: 0, players: [] }, 1000);
      itp.push(snap(100, 300, 400, 1, 0), 1100);
      const [p] = itp.playersAt(1110);
      expect(p.moving).toBe(false);
      expect(p.dirX).toBe(1);
    });
  });
});
