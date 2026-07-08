export class PlayerPanel {
  public skills: string[]; // todo: skill to Vo

  constructor(skills: string[] = []) {
    this.skills = Array.from({ length: 10 }, (_, index) => skills.at(index) ?? '');
  }

  addSkillAt(skillId: string, index: number) {
    if (index === undefined) {
      const findIndex = this.skills.findIndex((s) => s === '');
      this.skills[findIndex] = skillId;
      return;
    }

    this.skills[index] = skillId;
  }
}
