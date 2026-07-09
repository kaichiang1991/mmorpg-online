import { PlayerPanel } from './player-panel';
import { SkillBarVo } from './value-objects/skill-bar.vo';

const makePlayerPanel = () => new PlayerPanel();

describe('PlayerPanel', () => {
  describe('Skills', () => {
    it('have default skill bar', () => {
      const panel = makePlayerPanel();
      expect(panel).toHaveProperty('skillBar', SkillBarVo.empty());
    });

    it('can add skill at any index', () => {
      const panel = makePlayerPanel();
      panel.insertSkillAt('basic', 5);
      expect(panel.skillBar.at(5).id).toBe('basic');
    });
  });
});
