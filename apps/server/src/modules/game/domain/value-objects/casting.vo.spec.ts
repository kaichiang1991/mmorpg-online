import { SkillId } from '@mmo/shared';
import { SkillFactory } from '../skill-factory';
import { Skill } from '../skills';

class CastingVo {
  constructor(
    private readonly _skill: Skill,
    private readonly _now: number,
  ) {
    if (this._skill.castTime === 0) throw new Error('instant cast');
  }
}

const makeSkill = (skillId: SkillId = 'basic') => new SkillFactory().get(skillId)!;

describe('CastingVo', () => {
  it('throws when skill is instant cast', () => {
    expect(() => new CastingVo(makeSkill(), 0)).toThrow();
  });
});
