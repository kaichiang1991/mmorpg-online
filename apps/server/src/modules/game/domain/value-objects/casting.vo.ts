import { Skill } from '../skills';

export class CastingVo {
  private readonly _endsAt: number;

  constructor(
    private readonly _skill: Skill,
    now: number,
  ) {
    if (this._skill.castTime === 0) throw new Error('instant cast');

    this._endsAt = now + this._skill.castTime;
  }

  get skill(): Skill {
    return this._skill;
  }

  isDone(now: number): boolean {
    return now >= this._endsAt;
  }
}
