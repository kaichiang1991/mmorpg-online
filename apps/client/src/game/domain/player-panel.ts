import { SkillBarVo, SkillVo } from './value-objects/skill-bar.vo';
import { SkillId, SkillIdWithEmpty } from '@mmo/shared';

export class PlayerPanel {
  private _skillBar: SkillBarVo;

  /** cooldown keyed by skill id, not slot: moving a skill must not reset or fork its cooldown */
  private readonly _castStartTimes = new Map<SkillIdWithEmpty, number>();
  public get skillBar(): SkillBarVo {
    return this._skillBar;
  }

  private _selectedSkillIndex: number | undefined = undefined;
  public get selectedSkillIndex(): number | undefined {
    return this._selectedSkillIndex;
  }

  // todo: 也不一定要從skill bar拿
  public get selectedSkill(): SkillVo | undefined {
    if (this._selectedSkillIndex === undefined) return undefined;
    return this._skillBar.at(this._selectedSkillIndex);
  }

  static from(props: { skillBar: SkillBarVo }): PlayerPanel {
    return new PlayerPanel(props);
  }

  private constructor({ skillBar }: { skillBar?: SkillBarVo }) {
    this._skillBar = skillBar ?? SkillBarVo.empty();
    this._selectedSkillIndex = undefined;
  }

  insertSkillAt(skillId: SkillId, index: number) {
    this._skillBar = this._skillBar.insertSkillAt(skillId, index);
  }

  selectSkillAt(index: number) {
    if (this._skillBar.at(index).isEmpty) return;
    this._selectedSkillIndex = index;
  }

  cancelSkillAt(index: number) {
    if (this._selectedSkillIndex !== index) throw new Error('cancelSkillAt: invalid index');

    this._selectedSkillIndex = undefined;
  }

  castSkill(skillId: SkillIdWithEmpty, now: number) {
    if (skillId === '') throw new Error('castSkill: cannot cast empty skill');

    this._castStartTimes.set(skillId, now);
  }

  skillProcesses(now: number): number[] {
    return this._skillBar.map((skill) =>
      skill.cooldownProcess(this._castStartTimes.get(skill.id) ?? -Infinity, now),
    );
  }

  isSkillInCooldown(skill: SkillVo, now: number): boolean {
    return skill.cooldownProcess(this._castStartTimes.get(skill.id) ?? -Infinity, now) < 1;
  }
}
