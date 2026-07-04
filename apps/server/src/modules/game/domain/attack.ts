enum AttackType {
  PHYSIC = 'physic',
  MAGIC = 'magic',
}

export class Attack {
  constructor(
    public readonly baseDamage: number,
    public readonly multiplier: number = 1,
    public readonly type: AttackType = AttackType.PHYSIC,
  ) {}
}
