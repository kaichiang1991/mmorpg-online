export class PlayerMpVo {
  private readonly mp: number;
  private readonly maxMp: number;

  constructor(mp: number, maxMp: number) {
    if (maxMp <= 0) throw new Error(`maxMp must be positive, got ${maxMp}`);
    this.maxMp = maxMp;
    this.mp = Math.min(maxMp, Math.max(0, mp));
  }

  get percentage(): number {
    return this.mp / this.maxMp;
  }

  get remainMp(): number {
    return Math.round(this.mp);
  }

  decrease(amount: number): PlayerMpVo {
    return new PlayerMpVo(this.mp - amount, this.maxMp);
  }
}
