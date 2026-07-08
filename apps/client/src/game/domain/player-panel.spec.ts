import { describe, expect, it } from 'vitest';

class PlayerPanel {
  public skills: string[]; // todo: skill to Vo

  constructor(skills: string[] = []) {
    this.skills = Array.from({ length: 10 }, (_, index) => skills.at(index) ?? '');
  }

  addSkillAt(skillId: string, index?: number) {
    if (index === undefined) {
      const findIndex = this.skills.findIndex((s) => s === '');
      this.skills[findIndex] = skillId;
      return;
    }

    this.skills[index] = skillId;
  }
}

const makePlayerPanel = () => new PlayerPanel();

describe('PlayerPanel', () => {
  it('have default ten skills ', () => {
    const panel = makePlayerPanel();
    expect(panel.skills.length).toBe(10);
  });

  it('can add skill to the panel', () => {
    const panel = makePlayerPanel();
    panel.addSkillAt('basic');
    expect(panel.skills.at(0)).toBe('basic');
  });

  it('can add skill at any index', () => {
    const panel = makePlayerPanel();
    panel.addSkillAt('basic', 5);
    expect(panel.skills.at(5)).toBe('basic');
  });
});
