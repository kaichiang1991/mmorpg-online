import gsap from 'gsap';
import { Container, Graphics, Text } from 'pixi.js';
import { ATTACK_TTL_MS, type ActiveAttack } from '../../domain/active-attacks';
import type { Player } from '../../domain/player';

/** Visual lifetime in seconds — derived from the domain TTL, never the reverse. */
const DURATION_S = ATTACK_TTL_MS / 1000;

/**
 * Draws attack effects. Each attack spawns its display objects once and
 * hands them to a GSAP timeline that destroys them on completion; render()
 * only detects attacks that haven't spawned yet. Effects freeze at the
 * positions the endpoints held at spawn time — they don't track players.
 */
export class EffectLayer {
  readonly container = new Container();
  private readonly slashLayer = new Container();
  // separate layer keeps damage numbers above every slash
  private readonly damageLayer = new Container();
  private readonly ctx = gsap.context(() => {});
  /**
   * Dedup relies on ActiveAttackTracker returning stable object references
   * across frames (its activeAt() filters the same array in place).
   */
  private readonly spawned = new WeakSet<ActiveAttack>();

  constructor() {
    this.container.addChild(this.slashLayer, this.damageLayer);
  }

  render(attacks: ActiveAttack[], playersById: ReadonlyMap<string, Player>, now: number): void {
    for (const attack of attacks) {
      if (this.spawned.has(attack)) continue;

      const from = playersById.get(attack.attackerId);
      const to = playersById.get(attack.targetId);
      if (!from || !to) continue; // endpoint not in the world yet: retry next frame until the TTL expires

      this.spawned.add(attack);
      const remaining = DURATION_S - (now - attack.startedAt) / 1000;
      if (remaining <= 0) continue;

      this.ctx.add(() => {
        this.spawnSlash(from, to, remaining);
        this.spawnDamage(attack.damage, to, remaining);
      });
    }
  }

  /** Kills all in-flight tweens. Must run before the Pixi app is destroyed. */
  destroy(): void {
    this.ctx.kill();
  }

  /** How far the stroke's endpoint sits past the target's center. */
  private static readonly REACH = 1.5;

  /**
   * Slash: a single straight stroke from the attacker through the target,
   * like one swipe of an axe — whipped out fast from the attacker's end,
   * then fading over the rest of its life.
   */
  private spawnSlash(from: Player, to: Player, duration: number): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) * EffectLayer.REACH;

    // Grayscale gradient along the stroke: brightest at the attacker's end,
    // darkening toward the tip. Drawn as short segments along local +x so
    // the whole stroke scales and rotates as one object — cheaper than
    // allocating a gradient texture.
    const SEGMENTS = 8;
    const BRIGHT = 0xff;
    const DARK = 0x40;
    const g = new Graphics();
    for (let i = 0; i < SEGMENTS; i++) {
      const t0 = i / SEGMENTS;
      const t1 = (i + 1) / SEGMENTS;
      const shade = Math.round(BRIGHT - (BRIGHT - DARK) * ((t0 + t1) / 2));
      g.moveTo(length * t0, 0)
        .lineTo(length * t1, 0)
        .stroke({ width: 4, color: shade * 0x010101 });
    }
    g.position.set(from.x, from.y);
    g.rotation = Math.atan2(dy, dx);
    this.slashLayer.addChild(g);

    gsap
      .timeline({ onComplete: () => g.destroy() })
      .fromTo(g.scale, { x: 0.15 }, { x: 1, duration: duration * 0.3, ease: 'power4.out' }, 0)
      .to(g, { alpha: 0, duration: duration * 0.7, ease: 'power2.in' }, duration * 0.3);
  }

  /** Damage numbers ≥ this are shown in yellow instead of white. */
  private static readonly BIG_DAMAGE_THRESHOLD = 100;
  /** Total upward drift over the effect's lifetime. */
  private static readonly FLOAT_DISTANCE = 30;

  /**
   * RO-style damage number: pops in oversized with an overshoot bounce,
   * floats straight up, and fades out over the last 40% of its life.
   */
  private spawnDamage(damage: number, target: Player, duration: number): void {
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
    text.position.set(target.x, target.y - 40);
    this.damageLayer.addChild(text);

    gsap
      .timeline({ onComplete: () => text.destroy() })
      .fromTo(
        text.scale,
        { x: 1.6, y: 1.6 },
        { x: 1, y: 1, duration: duration * 0.35, ease: 'back.out(2.5)' },
        0,
      )
      .to(text, { y: text.y - EffectLayer.FLOAT_DISTANCE, duration, ease: 'power1.out' }, 0)
      .to(text, { alpha: 0, duration: duration * 0.4, ease: 'power1.in' }, duration * 0.6);
  }
}
