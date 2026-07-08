/** 冷卻計時：不可變，`consume` 回傳新實例 */
export class CooldownVo {
  constructor(
    readonly durationMs: number,
    readonly lastUsedAt = Number.NEGATIVE_INFINITY,
  ) {
    if (!Number.isFinite(durationMs) || durationMs < 0)
      throw new Error(`durationMs must be >= 0, got ${durationMs}`);
    if (Number.isNaN(lastUsedAt))
      throw new Error(`lastUsedAt must not be NaN`);
  }

  isReady(now: number): boolean {
    return now - this.lastUsedAt >= this.durationMs;
  }

  consume(now: number): CooldownVo {
    return new CooldownVo(this.durationMs, now);
  }
}
