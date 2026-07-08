export class SkillVo {
  static empty() {
    return new SkillVo('', '', '');
  }

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly imageUrl: string,
  ) {}
}
