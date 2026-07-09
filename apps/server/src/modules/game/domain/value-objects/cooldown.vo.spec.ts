import { CooldownVo } from './cooldown.vo';

describe('CooldownVo', () => {
  it('should create an instance', () => {
    expect(new CooldownVo(500)).toBeTruthy();
  });

  it('is ready immediately when never used', () => {
    expect(new CooldownVo(500).isReady(0)).toBe(true);
  });

  it('is not ready while cooling down', () => {
    const cd = new CooldownVo(500, 1000);
    expect(cd.isReady(1499)).toBe(false);
  });

  it('is ready exactly when the duration has elapsed', () => {
    const cd = new CooldownVo(500, 1000);
    expect(cd.isReady(1500)).toBe(true);
  });

  it('consume returns a new instance stamped at now', () => {
    const cd = new CooldownVo(500);
    const consumed = cd.consume(1000);
    expect(consumed).not.toBe(cd);
    expect(consumed.lastUsedAt).toBe(1000);
    expect(consumed.durationMs).toBe(500);
    expect(cd.lastUsedAt).toBe(Number.NEGATIVE_INFINITY);
  });

  it('a zero duration is always ready', () => {
    const cd = new CooldownVo(0).consume(1000);
    expect(cd.isReady(1000)).toBe(true);
  });

  it('rejects a negative or non-finite duration', () => {
    expect(() => new CooldownVo(-1)).toThrow();
    expect(() => new CooldownVo(Number.NaN)).toThrow();
    expect(() => new CooldownVo(Number.POSITIVE_INFINITY)).toThrow();
  });

  it('rejects a NaN lastUsedAt', () => {
    expect(() => new CooldownVo(500, Number.NaN)).toThrow();
  });
});
