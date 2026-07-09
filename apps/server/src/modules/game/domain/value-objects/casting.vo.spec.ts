import { SkillId } from '@mmo/shared';
import { SkillFactory } from '../skill-factory';
import { Skill } from '../skills';

class CastingVo {
  private readonly _endsAt: number;

  constructor(
    private readonly _skill: Skill,
    now: number,
  ) {
    if (this._skill.castTime === 0) throw new Error('instant cast');

    this._endsAt = now + this._skill.castTime;
  }

  isDone(now: number): boolean {
    return now >= this._endsAt;
  }
}

const makeSkill = (skillId: SkillId = 'basic') => new SkillFactory().get(skillId)!;

describe('CastingVo', () => {
  it('throws when skill is instant cast', () => {
    expect(() => new CastingVo(makeSkill(), 0)).toThrow();
  });

  it('isDone when time is exactly at end time', () => {
    const skill = makeSkill('fireball');
    const casting = new CastingVo(skill, 0);
    expect(casting.isDone(skill.castTime)).toBe(true);
  });
});
