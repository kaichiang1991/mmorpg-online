export class PlayerHpVo {
  constructor(
    private readonly hp: number,
    private readonly maxHp: number,
  ) {}

  get percentage(): number {
    return parseFloat((this.hp / this.maxHp).toFixed(1));
  }

  get remainHp(): number {
    return parseInt(this.hp.toFixed(0));
  }
}
