export class SkillVo {
  static empty(): SkillVo {
    return new SkillVo('', '', '');
  }

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly imageUrl: string,
  ) {}
}

export const SKILL_MAPPING = new Map<string, SkillVo>([
  ['empty', SkillVo.empty()],
  ['basic', new SkillVo('basic', 'Attack', '')],
  ['spear', new SkillVo('spear', 'Spear', '')],
]);

export class SkillBar {
  static BAR_LENGTH = 10;
  static empty(): SkillBar {
    return new SkillBar([]);
  }

  private elements: SkillVo[] = [];

  constructor(skillIds: string[]) {
    if (skillIds.length > SkillBar.BAR_LENGTH)
      throw new Error(`SkillBar cannot have more than ${SkillBar.BAR_LENGTH} skills`);

    this.elements = Array.from({ length: SkillBar.BAR_LENGTH }, (_, i) => i).map((i) => {
      const skillId = skillIds.at(i);
      return SKILL_MAPPING.get(skillId ?? 'empty')!;
    });
  }

  get length(): number {
    return this.elements.length;
  }

  some(predict: (skill: SkillVo) => boolean): boolean {
    return this.elements.some(predict);
  }

  every(predict: (skill: SkillVo) => boolean): boolean {
    return this.elements.every(predict);
  }

  at(index: number): SkillVo {
    if (index < 0 || index >= SkillBar.BAR_LENGTH)
      throw new Error(`SkillBar index out of range: ${index}`);
    return this.elements.at(index)!;
  }

  insertSkillAt(newSkill: SkillVo, at: number): SkillBar {
    return new SkillBar(this.elements.map((skill, index) => (index === at ? newSkill : skill).id));
  }
}
