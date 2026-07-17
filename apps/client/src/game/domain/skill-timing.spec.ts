import type { ActiveAttack } from './active-attacks';
import {
  ATTACK_TTL_MS,
  attackRetentionMs,
  HURT_DURATION_MS,
  impactAtMs,
  isAttackingAt,
  isHurtingAt,
} from './skill-timing';

const attack = (overrides: Partial<ActiveAttack> = {}): ActiveAttack => ({
  attackerId: 'a1',
  targetId: 't1',
  skillId: 'basic',
  damage: 10,
  startedAt: 1000,
  ...overrides,
});

describe('impactAtMs', () => {
  it('defaults to an instant hit for skills without an entry', () => {
    expect(impactAtMs('basic')).toBe(0);
    expect(impactAtMs('spear')).toBe(0);
  });

  it('delays the fireball hit until the fall ends', () => {
    expect(impactAtMs('fireball')).toBe(ATTACK_TTL_MS * 0.9);
  });
});

describe('attackRetentionMs', () => {
  it('keeps an instant-hit attack for the longer of swing and flinch', () => {
    expect(attackRetentionMs('basic')).toBe(Math.max(ATTACK_TTL_MS, HURT_DURATION_MS));
  });

  it('keeps a late-hit attack until the flinch window closes', () => {
    expect(attackRetentionMs('fireball')).toBe(impactAtMs('fireball') + HURT_DURATION_MS);
  });
});

describe('isAttackingAt', () => {
  it('is true for the swing and false afterwards', () => {
    const a = attack();
    expect(isAttackingAt(a, 1000)).toBe(true);
    expect(isAttackingAt(a, 1000 + ATTACK_TTL_MS - 1)).toBe(true);
    expect(isAttackingAt(a, 1000 + ATTACK_TTL_MS)).toBe(false);
  });
});

describe('isHurtingAt', () => {
  it('opens immediately for an instant-hit skill', () => {
    const a = attack();
    expect(isHurtingAt(a, 1000)).toBe(true);
    expect(isHurtingAt(a, 1000 + HURT_DURATION_MS - 1)).toBe(true);
    expect(isHurtingAt(a, 1000 + HURT_DURATION_MS)).toBe(false);
  });

  it('waits for the fireball to land', () => {
    const a = attack({ skillId: 'fireball' });
    const impact = 1000 + impactAtMs('fireball');
    expect(isHurtingAt(a, impact - 1)).toBe(false);
    expect(isHurtingAt(a, impact)).toBe(true);
    expect(isHurtingAt(a, impact + HURT_DURATION_MS - 1)).toBe(true);
    expect(isHurtingAt(a, impact + HURT_DURATION_MS)).toBe(false);
  });
});
