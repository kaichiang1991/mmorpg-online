import { SkillBarVo } from './value-objects/skill-bar-vo';
import { SkillId } from '@mmo/shared';

export class PlayerPanel {
  public skills: string[]; // todo: skill to Vo

  private _skillBar: SkillBarVo;
  public get skillBar(): SkillBarVo {
    return this._skillBar;
  }

  constructor(skills: string[] = []) {
    this.skills = Array.from({ length: 10 }, (_, index) => skills.at(index) ?? '');
    this._skillBar = SkillBarVo.empty();
  }

  insertSkillAt(skillId: SkillId, index: number) {
    this._skillBar = this._skillBar.insertSkillAt(skillId, index);
  }
}
