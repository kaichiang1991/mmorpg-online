import { SkillId } from '@mmo/shared';

export interface ActiveCast {
  casterId: string;
  skillId: SkillId;
  startedAt: number;
}

export class ActiveCastTracker {
  private casts = new Map<string, ActiveCast>();

  activeAt(now: number): ActiveCast[] {
    return [];
  }
}

const makeTracker = () => new ActiveCastTracker();

describe('ActiveCastTracker', () => {
  it('returns empty before any cast', () => {
    expect(makeTracker().activeAt(0)).toEqual([]);
  });
});
