import { SkillBarVo, SkillVo } from './value-objects/skill-bar.vo';
import { SkillId, SkillIdWithEmpty } from '@mmo/shared';

export class PlayerPanel {
  private _skillBar: SkillBarVo;

  /** cooldown keyed by skill id, not slot: moving a skill must not reset or fork its cooldown */
  private readonly _castStartTimes = new Map<SkillIdWithEmpty, number>();
  public get skillBar(): SkillBarVo {
    return this._skillBar;
  }

  /** selection is a skill, not a slot: the same skill in two slots is one selection */
  private _selectedSkill: SkillVo | null = null;
  public get selectedSkill(): SkillVo | null {
    return this._selectedSkill;
  }

  public get selectedSkillId(): SkillId | null {
    return this._selectedSkill?.hasSkill() ? this._selectedSkill.id : null;
  }

  static from(props: { skillBar: SkillBarVo }): PlayerPanel {
    return new PlayerPanel(props);
  }

  private constructor({ skillBar }: { skillBar?: SkillBarVo }) {
    this._skillBar = skillBar ?? SkillBarVo.empty();
  }

  insertSkillAt(skillId: SkillId, index: number) {
    this._skillBar = this._skillBar.insertSkillAt(skillId, index);
  }

  selectSkillAt(index: number) {
    const skill = this._skillBar.at(index);
    if (!skill.hasSkill()) return;

    this._selectedSkill = skill;
  }

  cancelSelect() {
    this._selectedSkill = null;
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

  isSelectedSkillReady(now: number) {
    if (!this._selectedSkill) return false;

    return (
      this._selectedSkill.cooldownProcess(
        this._castStartTimes.get(this._selectedSkill.id) ?? -Infinity,
        now,
      ) === 1
    );
  }
}
