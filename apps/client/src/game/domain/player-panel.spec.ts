import { PlayerPanel } from './player-panel';
import { SkillBarVo } from './value-objects/skill-bar-vo';

const makePlayerPanel = () => new PlayerPanel();

describe('PlayerPanel', () => {
  it('have default skill bar', () => {
    const panel = makePlayerPanel();
    expect(panel).toHaveProperty('skillBar', SkillBarVo.empty());
  });

  it('can add skill at any index', () => {
    const panel = makePlayerPanel();
    panel.addSkillAt('basic', 5);
    expect(panel.skills.at(5)).toBe('basic');
  });
});
