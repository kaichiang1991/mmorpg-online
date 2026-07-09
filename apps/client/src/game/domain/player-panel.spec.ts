import { PlayerPanel } from './player-panel';
import { SkillBar } from './value-objects/skill-bar';

const makePlayerPanel = () => new PlayerPanel();

describe('PlayerPanel', () => {
  it('have default skill bar', () => {
    const panel = makePlayerPanel();
    expect(panel).toHaveProperty('skillBar', SkillBar.empty());
  });

  it('can add skill at any index', () => {
    const panel = makePlayerPanel();
    panel.addSkillAt('basic', 5);
    expect(panel.skills.at(5)).toBe('basic');
  });
});
