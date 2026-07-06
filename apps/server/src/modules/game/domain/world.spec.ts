import { World } from './world';

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
    for (let i = 0; i < 200; i++) world.tick(0.1);
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
    world.tick(0.1);
    expect(a.x).toBeGreaterThan(ax);
    expect(b.x).toBeLessThan(bx);
  });

  describe('attack', () => {
    const worldWithPair = () => {
      const world = new World(1600, 1200);
      const a = world.addPlayer('a', 'A');
      const b = world.addPlayer('b', 'B');
      a.x = a.y = 100;
      b.x = 150; // within ATTACK_RANGE
      b.y = 100;
      return { world, a, b };
    };

    it('resolves an in-range attack with damage', () => {
      const { world } = worldWithPair();
      const result = world.attack('a', 'b', 1000);
      expect(result).not.toBeNull();
      expect(result!.finalDamage).toBeGreaterThanOrEqual(1);
    });

    it('rejects out-of-range attacks', () => {
      const { world, b } = worldWithPair();
      b.x = 100 + 201; // just past ATTACK_RANGE (200)
      expect(world.attack('a', 'b', 1000)).toBeNull();
    });

    it('rejects self, unknown attacker and unknown target', () => {
      const { world } = worldWithPair();
      expect(world.attack('a', 'a', 1000)).toBeNull();
      expect(world.attack('ghost', 'b', 1000)).toBeNull();
      expect(world.attack('a', 'ghost', 1000)).toBeNull();
    });

    it('enforces the attack cooldown per attacker', () => {
      const { world } = worldWithPair();
      expect(world.attack('a', 'b', 1000)).not.toBeNull();
      expect(world.attack('a', 'b', 1100)).toBeNull(); // still cooling down
      expect(world.attack('a', 'b', 1000 + 600)).not.toBeNull(); // cooldown over
      expect(world.attack('b', 'a', 1100)).not.toBeNull(); // b has own cooldown
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
});
