import { SKILL_DEFINITIONS, SkillId, SkillIdWithEmpty } from '@mmo/shared';

export class SkillVo {
  static empty(): SkillVo {
    return new SkillVo('', '');
  }

  constructor(
    public readonly id: SkillIdWithEmpty,
    public readonly name: string,
    private readonly _castingTimeMs = 0,
  ) {}

  get isInstantCast(): boolean {
    return this._castingTimeMs === 0;
  }

  get isEmpty(): boolean {
    return this.id === '';
  }
}

export const SKILL_MAPPING = new Map<SkillIdWithEmpty, SkillVo>([
  ['', SkillVo.empty()],
  ...Object.values(SKILL_DEFINITIONS).map(
    (d) => [d.id, new SkillVo(d.id, d.name, d.castTime)] as const,
  ),
]);

export class SkillBarVo {
  static BAR_LENGTH = 10;
  static empty(): SkillBarVo {
    return new SkillBarVo([]);
  }

  static from(skillIds: SkillIdWithEmpty[]): SkillBarVo {
    return new SkillBarVo(skillIds);
  }

  private elements: SkillVo[] = [];

  constructor(skillIds: SkillIdWithEmpty[]) {
    if (skillIds.length > SkillBarVo.BAR_LENGTH)
      throw new Error(`SkillBar cannot have more than ${SkillBarVo.BAR_LENGTH} skills`);

    this.elements = Array.from({ length: SkillBarVo.BAR_LENGTH }, (_, i) => i).map((i) => {
      const skillId = skillIds.at(i) ?? '';
      return SKILL_MAPPING.get(skillId)!;
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
    if (index < 0 || index >= SkillBarVo.BAR_LENGTH)
      throw new Error(`SkillBar index out of range: ${index}`);
    return this.elements.at(index)!;
  }

  insertSkillAt(newSkillId: SkillId, at: number): SkillBarVo {
    return new SkillBarVo(
      this.elements.map((skill, index) => (index === at ? newSkillId : skill.id)),
    );
  }
}
