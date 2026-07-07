import { describe, expect, it } from 'vitest';
import type { AttackResultPayload } from '@mmo/shared';
import { ATTACK_TTL_MS, ActiveAttackTracker } from './active-attacks';

const event = (attackerId = 'a1', targetId = 't1'): AttackResultPayload => ({
  attackerId,
  targetId,
  skillId: 'basic',
  damage: 42,
  crit: false,
  kind: 'physical',
  element: 'none',
  multipliers: [],
});

describe('ActiveAttackTracker', () => {
  it('returns empty before any attack', () => {
    expect(new ActiveAttackTracker().activeAt(0)).toEqual([]);
  });

  it('maps the event onto the local clock, ignoring the server timestamp', () => {
    const tracker = new ActiveAttackTracker();
    tracker.push(event(), 1000);
    expect(tracker.activeAt(1000)).toEqual([
      { attackerId: 'a1', targetId: 't1', damage: 42, startedAt: 1000 },
    ]);
  });

  it('keeps attacks alive until the TTL elapses', () => {
    const tracker = new ActiveAttackTracker();
    tracker.push(event(), 1000);
    expect(tracker.activeAt(1000 + ATTACK_TTL_MS - 1)).toHaveLength(1);
  });

  it('drops attacks once the TTL elapses', () => {
    const tracker = new ActiveAttackTracker();
    tracker.push(event(), 1000);
    expect(tracker.activeAt(1000 + ATTACK_TTL_MS)).toEqual([]);
  });

  it('expires attacks independently', () => {
    const tracker = new ActiveAttackTracker();
    tracker.push(event('a1'), 1000);
    tracker.push(event('a2'), 1200);
    const alive = tracker.activeAt(1000 + ATTACK_TTL_MS);
    expect(alive).toHaveLength(1);
    expect(alive[0].attackerId).toBe('a2');
  });
});
