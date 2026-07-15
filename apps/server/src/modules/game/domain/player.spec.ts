import { Player } from './player';
import { PositionVo } from './value-objects/position.vo';
import { SkillFactory } from './skill-factory';
import { SkillId } from '@mmo/shared';

const makePlayer = () => new Player('p1', 'Alice', 0, 0, 100);
const makeSkill = (skillId: SkillId = 'basic') => new SkillFactory().get(skillId)!;

describe('Player', () => {
  describe('advance', () => {
    it('does not move without a target', () => {
      const p = makePlayer();
      p.advance(1);
      expect(p.x).toBe(0);
      expect(p.y).toBe(0);
      expect(p.isMoving).toBe(false);
    });

    it('moves toward the target at its speed', () => {
      const p = makePlayer();
      p.setTarget(new PositionVo(300, 0));
      p.advance(1); // 100 px/s * 1s
      expect(p.x).toBeCloseTo(100);
      expect(p.y).toBeCloseTo(0);
      expect(p.isMoving).toBe(true);
    });

    it('moves along the diagonal, not axis by axis', () => {
      const p = makePlayer();
      p.setTarget(new PositionVo(300, 400)); // 3-4-5 triangle, distance 500
      p.advance(1);
      expect(p.x).toBeCloseTo(60); // 100 * 3/5
      expect(p.y).toBeCloseTo(80); // 100 * 4/5
    });

    it('stops exactly on the target without overshooting', () => {
      const p = makePlayer();
      p.setTarget(new PositionVo(30, 40)); // distance 50, step would be 100
      p.advance(1);
      expect(p.x).toBe(30);
      expect(p.y).toBe(40);
      expect(p.isMoving).toBe(false);
    });

    it('reports a unit direction toward the target while moving', () => {
      const p = makePlayer();
      p.setTarget(new PositionVo(300, 400)); // 3-4-5 triangle
      expect(p.direction.x).toBeCloseTo(0.6);
      expect(p.direction.y).toBeCloseTo(0.8);
    });

    it('reports the ZERO direction while standing still and after arrival', () => {
      const p = makePlayer();
      expect(p.direction.isZero).toBe(true);
      p.setTarget(new PositionVo(30, 40));
      p.advance(1); // arrives
      expect(p.direction.isZero).toBe(true);
    });

    it('a new target overrides the previous one', () => {
      const p = makePlayer();
      p.setTarget(new PositionVo(1000, 0));
      p.advance(1);
      p.setTarget(new PositionVo(0, 0));
      p.advance(10); // plenty of time to arrive
      expect(p.x).toBe(0);
      expect(p.y).toBe(0);
    });
  });

  describe('injured', () => {
    it('reduces hp', () => {
      const p = makePlayer();
      p.injured(100);
      expect(p.hp.remaining).toBe(900);
    });
  });

  describe('consumeMp', () => {
    it('reduces mp', () => {
      const p = makePlayer();
      p.consumeMp(50);
      expect(p.mp.remaining).toBe(150);
    });
  });

  describe('cast skill', () => {
    it('initial casting vo is null', () => {
      const p = makePlayer();
      expect(p.casting).toBeNull();
    });

    it('get casting vo when casting', () => {
      const p = makePlayer();
      p.castSkill(makeSkill('fireball'), 0);
      expect(p.casting).not.toBeNull();
    });
  });

  describe('skill cooldown', () => {
    it('a skill never used is ready', () => {
      expect(makePlayer().isSkillReady('basic', 0)).toBe(true);
    });

    it('tryUseSkill consumes the cooldown of that skill only', () => {
      const p = makePlayer();
      expect(p.tryUseSkill(makeSkill('fireball'), 0)).toBe(true);
      expect(p.isSkillReady('fireball', 0)).toBe(false);
      expect(p.isSkillReady('basic', 0)).toBe(true);
    });

    it('rejects reuse until the cooldown elapses', () => {
      const p = makePlayer();
      const fireball = makeSkill('fireball');
      p.tryUseSkill(fireball, 0);
      expect(p.tryUseSkill(fireball, fireball.cooldown! - 1)).toBe(false);
      expect(p.tryUseSkill(fireball, fireball.cooldown!)).toBe(true);
    });

    it('a skill without a cooldown is always usable', () => {
      const p = makePlayer();
      const basic = makeSkill('basic');
      expect(p.tryUseSkill(basic, 0)).toBe(true);
      expect(p.tryUseSkill(basic, 0)).toBe(true);
    });

    it('castSkill does not start the cooldown', () => {
      const p = makePlayer();
      p.castSkill(makeSkill('fireball'), 0);
      expect(p.isSkillReady('fireball', 0)).toBe(true);
    });
  });
});
