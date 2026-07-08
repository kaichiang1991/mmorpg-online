class SkillVo {
  static empty() {
    return new SkillVo('', '', '');
  }

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly imageUrl: string,
  ) {}
}

describe('Skill', () => {
  it('creates an empty skill', () => {
    const skill = SkillVo.empty();
    expect(skill.id).toBe('');
    expect(skill.name).toBe('');
    expect(skill.imageUrl).toBe('');
  });
});
