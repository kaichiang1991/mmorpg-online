import { Container, Graphics, Text } from 'pixi.js';
import { ATTACK_TTL_MS, type ActiveAttack } from '../../domain/active-attacks';
import type { Player } from '../../domain/player';

/**
 * Draws attack effects. Stateless between frames: graphics/text are cleared
 * and redrawn from the active-attack list every tick, so effect lifecycle
 * is purely a function of (attack.startedAt, now) — nothing to leak.
 */
export class EffectLayer {
  readonly container = new Container();
  private readonly g = new Graphics();
  private readonly damageLayer = new Container();

  constructor() {
    this.container.addChild(this.g, this.damageLayer);
  }

  render(attacks: ActiveAttack[], playersById: ReadonlyMap<string, Player>, now: number): void {
    this.g.clear();
    this.damageLayer.removeChildren().forEach((child) => child.destroy());

    for (const attack of attacks) {
      const from = playersById.get(attack.attackerId);
      const to = playersById.get(attack.targetId);
      if (!from || !to) continue; // endpoint no longer in the world: nothing to anchor to

      const age = now - attack.startedAt;
      if (age < 0 || age >= ATTACK_TTL_MS) continue;

      const t = age / ATTACK_TTL_MS;
      this.drawSlash(from, to, t);
      this.drawDamage(attack.damage, to, t);
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

  /** Damage numbers ≥ this are shown in yellow instead of white. */
  private static readonly BIG_DAMAGE_THRESHOLD = 100;
  /** Total upward drift over the effect's lifetime. */
  private static readonly FLOAT_DISTANCE = 30;
  /** Fraction of the lifetime spent popping in from oversized to normal scale. */
  private static readonly POP_END = 0.2;

  /**
   * RO-style damage number: pops in oversized, settles to normal scale,
   * then floats straight up while fading out; t runs 0→1.
   */
  private drawDamage(damage: number, player: Player, t: number): void {
    const isBigDamage = damage >= EffectLayer.BIG_DAMAGE_THRESHOLD;
    const text = new Text({
      text: String(damage),
      style: {
        fontSize: 20,
        fontWeight: 'bold',
        fill: isBigDamage ? 0xffe066 : 0xffffff,
        stroke: { color: 0x000000, width: 4 },
      },
    });
    text.anchor.set(0.5);

    const scale =
      t < EffectLayer.POP_END ? 1.5 - 0.5 * (t / EffectLayer.POP_END) : 1;
    text.scale.set(scale);

    text.x = player.x;
    text.y = player.y - 40 - EffectLayer.FLOAT_DISTANCE * t;
    text.alpha = 1 - Math.max(0, (t - 0.6) / 0.4); // fade out over the last 40% of life

    this.damageLayer.addChild(text);
  }
}
