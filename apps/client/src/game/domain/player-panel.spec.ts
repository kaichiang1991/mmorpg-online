import { PlayerPanel } from './player-panel';
import { SkillBarVo } from './value-objects/skill-bar.vo';
import { SKILL_DEFINITIONS } from '@mmo/shared';

const makePlayerPanel = (skillBar?: SkillBarVo) =>
  PlayerPanel.from({ skillBar: skillBar ?? SkillBarVo.empty() });

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

    it('cannot select empty skill', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', 0));
      panel.selectSkillAt(1);
      expect(panel.selectedSkillId).toBeNull();
    });

    it('can cancel selected skill', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', 0));
      panel.selectSkillAt(0);
      panel.cancelSelect();
      expect(panel.selectedSkillId).toBeNull();
    });

    it('cancel without selection is a no-op', () => {
      const panel = makePlayerPanel();
      expect(() => panel.cancelSelect()).not.toThrow();
      expect(panel.selectedSkillId).toBeNull();
    });

    it('throws when cast empty skill', () => {
      const panel = makePlayerPanel();
      expect(() => panel.castSkill('', 0)).toThrow();
    });

    it('skill processes has one entry per slot', () => {
      const panel = makePlayerPanel();
      expect(panel.skillProcesses(0)).toHaveLength(SkillBarVo.BAR_LENGTH);
    });

    it('skill process is 1 when cast skill with no cooldown', () => {
      const index = 0;
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', index));
      panel.castSkill('basic', 0);
      expect(panel.skillProcesses(0)[index]).toBe(1);
    });

    it('skill process is 0 when cast skill needed cooldown', () => {
      const index = 0;
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', index));
      panel.castSkill('fireball', 0);
      expect(panel.skillProcesses(0)[index]).toBe(0);
    });

    it('cooldown follows skill when placed into another slot', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', 0));
      panel.castSkill('fireball', 0);

      panel.insertSkillAt('fireball', 1);

      const processes = panel.skillProcesses(0);
      expect(processes[0]).toBe(0); // original slot keeps cooling
      expect(processes[1]).toBe(0); // same skill in new slot shares the cooldown
    });

    it('skill process is 0.5 when skill cooldown is half', () => {
      const index = 0;
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', index)); // cooldown is 1000
      panel.castSkill('fireball', 0);
      expect(panel.skillProcesses(SKILL_DEFINITIONS.fireball.cooldown! / 2)[index]).toBe(0.5);
    });

    it('default select skill id is null', () => {
      const panel = makePlayerPanel();
      expect(panel.selectedSkillId).toBeNull();
    });

    it('select skill at skill bar', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('basic', 0));
      panel.selectSkillAt(0);
      expect(panel.selectedSkillId).toBe('basic');
    });

    it('isSelectedSkillReady returns false when no skill selected', () => {
      const panel = makePlayerPanel();
      expect(panel.isSelectedSkillReady(0)).toBe(false);
    });

    it('isSelectedSkillReady returns tue when selected skill is not casted', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', 0));
      panel.selectSkillAt(0);
      expect(panel.isSelectedSkillReady(0)).toBe(true);
    });

    it('isSelectedSkillReady returns false when selected skill just cast', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', 0));
      panel.selectSkillAt(0);
      panel.castSkill('fireball', 0);
      expect(panel.isSelectedSkillReady(0)).toBe(false);
    });

    it('isSelectedSkillReady returns true when selected skill cooldown over', () => {
      const panel = makePlayerPanel(SkillBarVo.empty().insertSkillAt('fireball', 0));
      panel.selectSkillAt(0);
      panel.castSkill('fireball', 0);
      expect(panel.isSelectedSkillReady(SKILL_DEFINITIONS['fireball'].cooldown!)).toBe(true);
    });

    it('tryUseSkill returns false when no skill selected', () => {
      const panel = makePlayerPanel();
      expect(panel.tryUseSkill(0)).toBe(false);
    });
  });
});
