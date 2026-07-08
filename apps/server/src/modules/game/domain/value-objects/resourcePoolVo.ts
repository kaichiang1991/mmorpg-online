/** A bounded resource pool (HP, MP, ...): clamped to [0, max], immutable. */
export class ResourcePoolVo {
  private readonly current: number;
  private readonly max: number;

  constructor(current: number, max: number) {
    if (max <= 0) throw new Error(`max must be positive, got ${max}`);
    this.max = max;
    this.current = Math.min(max, Math.max(0, current));
  }

  get percentage(): number {
    return this.current / this.max;
  }

  get remaining(): number {
    return Math.round(this.current);
  }

  decrease(amount: number): ResourcePoolVo {
    return new ResourcePoolVo(this.current - amount, this.max);
  }
}
