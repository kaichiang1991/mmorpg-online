import { PositionVo } from './value-objects/position.vo';
import { AttackOutcome, World } from './world';
import { AttackResultVo } from './value-objects/attack-result.vo';
import { FIRE_BALL } from './skills';

function resolvedAttack(outcome: AttackOutcome): AttackResultVo {
  if (outcome.kind !== 'resolved') throw new Error(`expected 'resolved', got '${outcome.kind}'`);
  return outcome.attack;
}

describe('World', () => {
  it('spawns players inside the map', () => {
    const world = new World(1600, 1200);
    const p = world.addPlayer('p1', 'Alice');
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x).toBeLessThanOrEqual(1600);
    expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThanOrEqual(1200);
    expect(world.playerCount).toBe(1);
  });

  it('removes players', () => {
    const world = new World();
    world.addPlayer('p1', 'Alice');
    world.removePlayer('p1');
    expect(world.playerCount).toBe(0);
    expect(world.getPlayer('p1')).toBeUndefined();
  });

  it('clamps move targets to map bounds', () => {
    const world = new World(1600, 1200);
    world.addPlayer('p1', 'Alice');
    world.setMoveTarget('p1', -500, 99999);
    // run long enough to arrive at the clamped target
    for (let i = 0; i < 200; i++) world.tick(0.1, 0);
    const p = world.getPlayer('p1')!;
    expect(p.x).toBe(0);
    expect(p.y).toBe(1200);
  });

  it('ignores move intents for unknown players', () => {
    const world = new World();
    expect(() => world.setMoveTarget('ghost', 10, 10)).not.toThrow();
  });

  it('tick advances every player', () => {
    const world = new World(1600, 1200);
    const a = world.addPlayer('a', 'A');
    const b = world.addPlayer('b', 'B');
    const [ax, bx] = [a.x, b.x];
    world.setMoveTarget('a', ax + 100, a.y);
    world.setMoveTarget('b', bx - 100, b.y);
    world.tick(0.1, 0);
    expect(a.x).toBeGreaterThan(ax);
    expect(b.x).toBeLessThan(bx);
  });

  function worldWithPair() {
    const world = new World(1600, 1200);
    const a = world.addPlayer('a', 'A');
    const b = world.addPlayer('b', 'B');
    a.position = new PositionVo(100, 100);
    b.position = new PositionVo(120, 100); // within ATTACK_RANGE
    return { world, a, b };
  }

  describe('basic attack', () => {
    const basicSkillId = 'basic';

    it('resolves an in-range attack with damage', () => {
      const { world } = worldWithPair();
      const attack = resolvedAttack(world.attack('a', 'b', basicSkillId, 1000));
      expect(attack.finalDamage).toBeGreaterThanOrEqual(1);
    });

    it('rejects out-of-range attacks', () => {
      const { world, b } = worldWithPair();
      b.position = new PositionVo(100 + 201, 100); // just past ATTACK_RANGE (200)
      expect(world.attack('a', 'b', basicSkillId, 1000)).toEqual({ kind: 'rejected' });
    });

    it('rejects self, unknown attacker and unknown target', () => {
      const { world } = worldWithPair();
      expect(world.attack('a', 'a', basicSkillId, 1000)).toEqual({ kind: 'rejected' });
      expect(world.attack('ghost', 'b', basicSkillId, 1000)).toEqual({ kind: 'rejected' });
      expect(world.attack('a', 'ghost', basicSkillId, 1000)).toEqual({ kind: 'rejected' });
    });

    it('applies the resolved damage to the target', () => {
      const { world, b } = worldWithPair();
      const before = b.hp.remaining;
      const attack = resolvedAttack(world.attack('a', 'b', basicSkillId, 1000));
      expect(b.hp.remaining).toBe(before - attack.finalDamage);
    });

    it('reports damaged hp in the snapshot', () => {
      const { world, b } = worldWithPair();
      world.attack('a', 'b', basicSkillId, 1000);
      const snap = world.snapshot(2000);
      expect(snap.players.find((p) => p.id === 'b')!.hp).toBe(b.hp.remaining);
    });

    it('has no cooldown — consecutive attacks resolve', () => {
      const { world } = worldWithPair();
      expect(world.attack('a', 'b', basicSkillId, 1000).kind).toBe('resolved');
      expect(world.attack('a', 'b', basicSkillId, 1100).kind).toBe('resolved');
    });
  });

  describe('skill attack', () => {
    describe('Instant case skill', () => {
      it("reduce attacker's mp", () => {
        const { world, a, b } = worldWithPair();
        const skillId = 'spear';
        const result = world.attack(a.id, b.id, skillId, 1000);

        expect(result.kind).toBe('resolved');
        expect(a.mp.remaining).toBe(190); // 200 - 10
      });

      it('rejects an attack the attacker cannot afford', () => {
        const { world, a, b } = worldWithPair();
        a.consumeMp(195); // 5 mp left, spear costs 10
        expect(world.attack(a.id, b.id, 'spear', 1000)).toEqual({ kind: 'rejected' });
        expect(a.mp.remaining).toBe(5);
      });
    });

    describe('Non-Instant case skill', () => {
      it('reports castStarted with cast timing instead of resolving', () => {
        const { world, a, b } = worldWithPair();
        expect(world.attack(a.id, b.id, 'fireball', 1000)).toEqual({
          kind: 'castStarted',
          skillId: 'fireball',
          duration: FIRE_BALL.castTime,
          endsAt: 1000 + FIRE_BALL.castTime,
        });
      });
    });

    it('rejects an unknown skill id', () => {
      const { world } = worldWithPair();
      expect(world.attack('a', 'b', 'no-such-skill', 1000)).toEqual({ kind: 'rejected' });
      expect(world.attack('a', 'b', '', 1000)).toEqual({ kind: 'rejected' });
    });

    it('enforces the per-skill cooldown', () => {
      const { world } = worldWithPair();
      expect(world.attack('a', 'b', 'fireball', 1000).kind).toBe('castStarted');
      // global attack cooldown has elapsed, fireball's own cooldown has not
      expect(world.attack('a', 'b', 'fireball', 1000 + 600).kind).toBe('rejected');
      expect(world.attack('a', 'b', 'fireball', 1000 + FIRE_BALL.cooldown!).kind).toBe(
        'castStarted',
      );
    });

    it('tracks the cooldown per skill and per attacker', () => {
      const { world } = worldWithPair();
      expect(world.attack('a', 'b', 'fireball', 1000).kind).toBe('castStarted');
      expect(world.attack('a', 'b', 'fireball', 1100).kind).toBe('rejected'); // still cooling down
      expect(world.attack('a', 'b', 'spear', 1100).kind).toBe('resolved'); // other skill unaffected
      expect(world.attack('b', 'a', 'fireball', 1100).kind).toBe('castStarted'); // b has own cooldown
    });
  });

  describe('cast resolution (tick)', () => {
    const castAt = 1000;
    const castEndsAt = castAt + FIRE_BALL.castTime;

    it('does not resolve before the cast time elapses', () => {
      const { world, a } = worldWithPair();
      world.attack(a.id, 'b', 'fireball', castAt);
      const events = world.tick(0.1, castEndsAt - 1);
      expect(events).toEqual([]);
      expect(a.casting).not.toBeNull();
    });

    it('resolves the attack and clears casting once the cast time elapses', () => {
      const { world, a, b } = worldWithPair();
      world.attack(a.id, b.id, 'fireball', castAt);
      const before = b.hp.remaining;
      const events = world.tick(0.1, castEndsAt);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'attackResolved',
        attackerId: a.id,
        targetId: b.id,
        skillId: 'fireball',
      });
      expect(b.hp.remaining).toBeLessThan(before);
      expect(a.casting).toBeNull();
    });

    it('cancels the cast if the target left the world', () => {
      const { world, a, b } = worldWithPair();
      world.attack(a.id, b.id, 'fireball', castAt);
      world.removePlayer(b.id);

      const events = world.tick(0.1, castEndsAt);

      expect(events).toEqual([{ type: 'castCancelled', casterId: a.id, reason: 'interrupted' }]);
      expect(a.casting).toBeNull();
    });

    it('cancels the cast if the target moved out of range', () => {
      const { world, a, b } = worldWithPair();
      world.attack(a.id, b.id, 'fireball', castAt); // fireball range 500
      b.position = new PositionVo(100 + 501, 100);

      const events = world.tick(0.1, castEndsAt);

      expect(events).toEqual([{ type: 'castCancelled', casterId: a.id, reason: 'interrupted' }]);
      expect(a.casting).toBeNull();
    });
  });

  describe('move cancels cast', () => {
    it('cancels the cast and reports it when the caster moves', () => {
      const { world, a } = worldWithPair();
      world.attack(a.id, 'b', 'fireball', 1000);

      const event = world.setMoveTarget(a.id, 500, 500);

      expect(event).toEqual({ type: 'castCancelled', casterId: a.id, reason: 'moved' });
      expect(a.casting).toBeNull();
    });

    it('does not resolve the cancelled cast when its cast time elapses', () => {
      const { world, a, b } = worldWithPair();
      world.attack(a.id, b.id, 'fireball', 1000);
      world.setMoveTarget(a.id, 500, 500);
      const before = b.hp.remaining;

      const events = world.tick(0.1, 1000 + FIRE_BALL.castTime);

      expect(events).toEqual([]);
      expect(b.hp.remaining).toBe(before);
    });

    it('returns no event when the mover is not casting', () => {
      const { world, a } = worldWithPair();
      expect(world.setMoveTarget(a.id, 500, 500)).toBeNull();
    });

    it('returns no event for an unknown player', () => {
      expect(new World().setMoveTarget('ghost', 10, 10)).toBeNull();
    });
  });

  it('snapshot contains all players with rounded coordinates', () => {
    const world = new World();
    world.addPlayer('p1', 'Alice');
    const snap = world.snapshot(12345);
    expect(snap.t).toBe(12345);
    expect(snap.players).toHaveLength(1);
    expect(snap.players[0]).toMatchObject({ id: 'p1', name: 'Alice' });
    expect(Number.isInteger(snap.players[0].x)).toBe(true);
    expect(Number.isInteger(snap.players[0].y)).toBe(true);
  });

  describe('snapshot direction', () => {
    it('is zero for a standing player', () => {
      const world = new World();
      world.addPlayer('p1', 'Alice');
      expect(world.snapshot(0).players[0]).toMatchObject({ dirX: 0, dirY: 0 });
    });

    it('reports the quantized unit heading while moving', () => {
      const world = new World(1600, 1200);
      const p = world.addPlayer('p1', 'Alice');
      p.position = new PositionVo(100, 100);
      world.setMoveTarget('p1', 400, 500); // 3-4-5 triangle from (100,100)
      const { dirX, dirY } = world.snapshot(0).players[0];
      expect(dirX).toBe(0.6);
      expect(dirY).toBe(0.8);
    });

    it('returns to zero after arrival', () => {
      const world = new World(1600, 1200);
      const p = world.addPlayer('p1', 'Alice');
      p.position = new PositionVo(100, 100);
      world.setMoveTarget('p1', 110, 100);
      for (let i = 0; i < 10; i++) world.tick(0.1, 0); // plenty of time to arrive
      expect(world.snapshot(0).players[0]).toMatchObject({ dirX: 0, dirY: 0 });
    });
  });
});
