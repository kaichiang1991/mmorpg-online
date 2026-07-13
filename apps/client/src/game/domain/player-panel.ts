import { SkillBarVo, SkillVo } from './value-objects/skill-bar.vo';
import { SkillId, SkillIdWithEmpty } from '@mmo/shared';

export class PlayerPanel {
  private _skillBar: SkillBarVo;

  /** cooldown keyed by skill id, not slot: moving a skill must not reset or fork its cooldown */
  private readonly _castStartTimes = new Map<SkillIdWithEmpty, number>();
  public get skillBar(): SkillBarVo {
    return this._skillBar;
  }

  private _selectSkillIndex: number | undefined = undefined;
  public get selectSkillIndex(): number | undefined {
    return this._selectSkillIndex;
  }

  public get selectedSkill(): SkillVo | undefined {
    if (this._selectSkillIndex === undefined) return undefined;
    return this._skillBar.at(this._selectSkillIndex);
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

  castSkillAt(index: number, now: number) {
    const skill = this._skillBar.at(index);
    if (skill.isEmpty) throw new Error('castSkillAt: invalid index');

    this._castStartTimes.set(skill.id, now);
  }

  skillProcesses(now: number): number[] {
    return this._skillBar.map((skill) =>
      skill.cooldownProcess(this._castStartTimes.get(skill.id) ?? -Infinity, now),
    );
  }
}
