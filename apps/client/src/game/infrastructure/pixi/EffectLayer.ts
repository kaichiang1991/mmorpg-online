import { Container, Graphics } from 'pixi.js';
import { ATTACK_TTL_MS, type ActiveAttack } from '../../domain/active-attacks';
import type { Player } from '../../domain/player';

/**
 * Draws attack effects. Stateless between frames: one Graphics is cleared
 * and redrawn from the active-attack list every tick, so effect lifecycle
 * is purely a function of (attack.startedAt, now) — nothing to leak.
 */
export class EffectLayer {
  readonly container = new Container();
  private readonly g = new Graphics();

  constructor() {
    this.container.addChild(this.g);
  }

  render(attacks: ActiveAttack[], playersById: ReadonlyMap<string, Player>, now: number): void {
    this.g.clear();

    for (const attack of attacks) {
      const from = playersById.get(attack.attackerId);
      const to = playersById.get(attack.targetId);
      if (!from || !to) continue; // endpoint no longer in the world: nothing to anchor to

      const age = now - attack.startedAt;
      if (age < 0 || age >= ATTACK_TTL_MS) continue;

      this.drawSlash(from, to, age / ATTACK_TTL_MS);
    }
  }

  /** How far the stroke's endpoints sit from the target's center. */
  private static readonly REACH = 1.5;

  /**
   * Slash: a single straight stroke from the attacker through the target,
   * like one swipe of an axe. Grayscale-shaded along its length and fading
   * out over the lifetime; t runs 0→1.
   */
  private drawSlash(from: Player, to: Player, t: number): void {
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    const tipX = from.x - dx * EffectLayer.REACH;
    const tipY = from.y - dy * EffectLayer.REACH;

    // Grayscale gradient along the stroke: brightest at the attacker's end,
    // darkening toward the tip. Drawn as short segments — cheaper than
    // allocating a gradient texture every frame.
    const SEGMENTS = 8;
    const BRIGHT = 0xff;
    const DARK = 0x40;
    for (let i = 0; i < SEGMENTS; i++) {
      const t0 = i / SEGMENTS;
      const t1 = (i + 1) / SEGMENTS;
      const shade = Math.round(BRIGHT - (BRIGHT - DARK) * ((t0 + t1) / 2));

      this.g
        .moveTo(from.x + (tipX - from.x) * t0, from.y + (tipY - from.y) * t0)
        .lineTo(from.x + (tipX - from.x) * t1, from.y + (tipY - from.y) * t1)
        .stroke({ width: 4, color: shade * 0x010101, alpha: 1 - t });
    }
  }
}
