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

    it('default selectSkillIndex = undefined', () => {
      const panel = makePlayerPanel();
      expect(panel.selectSkillIndex).toBeUndefined();
    });

    it('cannot select empty skill', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', 0));
      panel.selectSkillAt(1);
      expect(panel.selectSkillIndex).toBeUndefined();
    });

    it('can select skill by index', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', 0));
      panel.selectSkillAt(0);
      expect(panel.selectSkillIndex).toBe(0);
    });

    it('can cancels select skill', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', 0));
      panel.selectSkillAt(0);
      panel.cancelSkillAt(0);
      expect(panel.selectSkillIndex).toBeUndefined();
    });

    it('cancels select skill at not selected index throws', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', 0));
      expect(() => panel.cancelSkillAt(0)).toThrow();

      panel.selectSkillAt(0);
      expect(() => panel.cancelSkillAt(1)).toThrow();
    });

    it('returns undefined when cast empty skill', () => {
      const panel = makePlayerPanel();
      expect(panel.castSkillAt(0)).toBeUndefined();
    });
  });
});
