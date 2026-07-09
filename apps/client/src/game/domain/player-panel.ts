import { SkillBarVo } from './value-objects/skill-bar.vo';
import { SkillId } from '@mmo/shared';

export class PlayerPanel {
  private _skillBar: SkillBarVo;
  public get skillBar(): SkillBarVo {
    return this._skillBar;
  }

  private _selectSkillIndex: number | undefined = undefined;
  public get selectSkillIndex(): number | undefined {
    return this._selectSkillIndex;
  }

  constructor({ skillBar }: { skillBar?: SkillBarVo }) {
    this._skillBar = skillBar ?? SkillBarVo.empty();
    this._selectSkillIndex = undefined;
  }

  insertSkillAt(skillId: SkillId, index: number) {
    this._skillBar = this._skillBar.insertSkillAt(skillId, index);
  }

  selectSkillAt(index: number) {
    if (this._skillBar.at(index).isEmpty) return;
    this._selectSkillIndex = index;
  }

  cancelSkillAt(index: number) {
    if (this._selectSkillIndex !== index) throw new Error('cancelSkillAt: invalid index');

    this._selectSkillIndex = undefined;
  }
}
