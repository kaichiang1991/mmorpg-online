import { SkillBarVo } from './value-objects/skill-bar-vo';

export class PlayerPanel {
  public skills: string[]; // todo: skill to Vo

  private readonly _skillBar: SkillBarVo;
  public get skillBar(): SkillBarVo {
    return this._skillBar;
  }

  constructor(skills: string[] = []) {
    this.skills = Array.from({ length: 10 }, (_, index) => skills.at(index) ?? '');
    this._skillBar = SkillBarVo.empty();
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
