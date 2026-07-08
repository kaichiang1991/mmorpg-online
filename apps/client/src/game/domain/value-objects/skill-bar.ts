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
