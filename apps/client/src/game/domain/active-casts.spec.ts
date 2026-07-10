import type { CastBeginPayload } from '@mmo/shared';
import { ActiveCastTracker } from './active-casts';

const event = (casterId = 'c1', duration = 1000): CastBeginPayload => ({
  casterId,
  skillId: 'fireball',
  duration,
  endsAt: 999999, // server epoch — simple-clock scheme ignores it
});

describe('ActiveCastTracker', () => {
  it('returns empty before any cast', () => {
    expect(new ActiveCastTracker().activeAt(0).size).toBe(0);
  });

  it('maps the event onto the local clock, ignoring the server endsAt', () => {
    const tracker = new ActiveCastTracker();
    tracker.push(event(), 1000);
    expect(tracker.activeAt(1000).get('c1')).toEqual({
      casterId: 'c1',
      skillId: 'fireball',
      startedAt: 1000,
      duration: 1000,
      progress: 0,
    });
  });

  it('reports progress as elapsed fraction of duration', () => {
    const tracker = new ActiveCastTracker();
    tracker.push(event('c1', 1000), 1000);
    expect(tracker.activeAt(1250).get('c1')?.progress).toBe(0.25);
    expect(tracker.activeAt(1750).get('c1')?.progress).toBe(0.75);
  });

  it('keeps the cast alive until the duration elapses', () => {
    const tracker = new ActiveCastTracker();
    tracker.push(event('c1', 1000), 1000);
    expect(tracker.activeAt(1999).size).toBe(1);
  });

  it('drops the cast once the duration elapses', () => {
    const tracker = new ActiveCastTracker();
    tracker.push(event('c1', 1000), 1000);
    expect(tracker.activeAt(2000).size).toBe(0);
  });

  it('replaces a previous cast by the same caster', () => {
    const tracker = new ActiveCastTracker();
    tracker.push(event('c1', 1000), 1000);
    tracker.push(event('c1', 500), 1200);
    const alive = tracker.activeAt(1200);
    expect(alive.size).toBe(1);
    expect(alive.get('c1')).toMatchObject({ startedAt: 1200, duration: 500 });
  });

  it('expires casts independently', () => {
    const tracker = new ActiveCastTracker();
    tracker.push(event('c1', 500), 1000);
    tracker.push(event('c2', 1000), 1000);
    const alive = tracker.activeAt(1600);
    expect(alive.size).toBe(1);
    expect(alive.has('c2')).toBe(true);
  });

  it('removes a cast on cancel', () => {
    const tracker = new ActiveCastTracker();
    tracker.push(event('c1'), 1000);
    tracker.cancel('c1');
    expect(tracker.activeAt(1000).size).toBe(0);
  });

  it('ignores cancel for an unknown caster', () => {
    const tracker = new ActiveCastTracker();
    tracker.push(event('c1'), 1000);
    tracker.cancel('nobody');
    expect(tracker.activeAt(1000).size).toBe(1);
  });
});
