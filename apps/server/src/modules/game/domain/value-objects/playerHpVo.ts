export class PlayerHpVo {
  private readonly hp: number;
  private readonly maxHp: number;

  constructor(hp: number, maxHp: number) {
    if (maxHp <= 0) throw new Error(`maxHp must be positive, got ${maxHp}`);
    this.maxHp = maxHp;
    this.hp = Math.min(maxHp, Math.max(0, hp));
  }

  get percentage(): number {
    return this.hp / this.maxHp;
  }

  get remainHp(): number {
    return Math.round(this.hp);
  }

  decrease(amount: number): PlayerHpVo {
    return new PlayerHpVo(this.hp - amount, this.maxHp);
  }
}
