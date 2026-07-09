import { SkillBarVo } from './value-objects/skill-bar.vo';
import { SkillId } from '@mmo/shared';

export class PlayerPanel {
  private _skillBar: SkillBarVo;
  public get skillBar(): SkillBarVo {
    return this._skillBar;
  }

  constructor({ skillBar }: { skillBar?: SkillBarVo }) {
    this._skillBar = skillBar ?? SkillBarVo.empty();
  }

  insertSkillAt(skillId: SkillId, index: number) {
    this._skillBar = this._skillBar.insertSkillAt(skillId, index);
  }
}
