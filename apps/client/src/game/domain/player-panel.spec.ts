import { PlayerPanel } from './player-panel';

const makePlayerPanel = () => new PlayerPanel();

describe('PlayerPanel', () => {
  it('have default ten skills ', () => {
    const panel = makePlayerPanel();
    expect(panel.skills.length).toBe(10);
  });

  it('can add skill at any index', () => {
    const panel = makePlayerPanel();
    panel.addSkillAt('basic', 5);
    expect(panel.skills.at(5)).toBe('basic');
  });
});
