import { PlayerPanel } from './player-panel';
import { SkillBarVo } from './value-objects/skill-bar.vo';

const makePlayerPanel = (skillBar?: SkillBarVo) => new PlayerPanel({ skillBar });

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

    it('can reconstitute from snapshot', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', 0));
      expect(panel.skillBar.at(0).id).toBe('basic');
    });

    it('default selectIndex = undefined', () => {
      const panel = makePlayerPanel();
      expect(panel.selectSkillIndex).toBeUndefined();
    });
  });
});
