import { PlayerPanel } from './player-panel';
import { SkillBarVo } from './value-objects/skill-bar.vo';
import { SKILL_DEFINITIONS } from '@mmo/shared';

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

    it('throws when cast empty skill', () => {
      const panel = makePlayerPanel();
      expect(() => panel.castSkillAt(0, 0)).toThrow();
    });

    it('skill processes has one entry per slot', () => {
      const panel = makePlayerPanel();
      expect(panel.skillProcesses(0)).toHaveLength(SkillBarVo.BAR_LENGTH);
    });

    it('skill process is 1 when cast skill with no cooldown', () => {
      const index = 0;
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', index));
      panel.castSkillAt(index, 0);
      expect(panel.skillProcesses(0)[index]).toBe(1);
    });

    it('skill process is 0 when cast skill needed cooldown', () => {
      const index = 0;
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', index));
      panel.castSkillAt(index, 0);
      expect(panel.skillProcesses(0)[index]).toBe(0);
    });

    it('cooldown follows skill when placed into another slot', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', 0));
      panel.castSkillAt(0, 0);

      panel.insertSkillAt('fireball', 1);

      const processes = panel.skillProcesses(0);
      expect(processes[0]).toBe(0); // original slot keeps cooling
      expect(processes[1]).toBe(0); // same skill in new slot shares the cooldown
    });

    it('skill process is 0.5 when skill cooldown is half', () => {
      const index = 0;
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', index)); // cooldown is 1000
      panel.castSkillAt(index, 0);
      expect(panel.skillProcesses(SKILL_DEFINITIONS.fireball.cooldown! / 2)[index]).toBe(0.5);
    });
  });
});
