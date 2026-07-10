import gsap from 'gsap';
import { AnimatedSprite, Container, Graphics, Text } from 'pixi.js';
import { ATTACK_TTL_MS, type ActiveAttack } from '../../domain/active-attacks';
import type { Player } from '../../domain/player';
import { SkillId } from '@mmo/shared';
import { SKILL_EFFECTS } from './skills/SkillConfig';

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
  private readonly castingLayer = new Container();
  // separate layer keeps damage numbers above every slash
  private readonly damageLayer = new Container();
  private readonly ctx = gsap.context(() => {});
  /**
   * Dedup relies on ActiveAttackTracker returning stable object references
   * across frames (its activeAt() filters the same array in place).
   */
  private readonly spawned = new WeakSet<ActiveAttack>();

  constructor() {
    this.container.addChild(this.slashLayer, this.castingLayer, this.damageLayer);
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
        this.spawnBySkillId(attack.skillId, to, remaining);
        this.spawnDamage(attack.damage, to, remaining);
      });
    }
  }

  /** Kills all in-flight tweens. Must run before the Pixi app is destroyed. */
  destroy(): void {
    this.ctx.kill();
  }

  /** Fixed cut direction, upper-right to lower-left — every slash reads the same regardless of attacker/target layout. */
  private static readonly SLASH_ANGLE = (3 * Math.PI) / 4;
  /** Impact crescent radius and angular span at the target. */
  private static readonly IMPACT_RADIUS = 28;
  private static readonly IMPACT_SPAN = Math.PI / 1.8;

  private spawnBySkillId(skillId: SkillId, to: Player, duration: number): void {
    switch (skillId) {
      case 'basic':
        return this.spawnSlash(to, duration);
      case 'fireball':
        return this.castFireball(to, duration);

      default:
        console.log('skill not implement');
        return this.spawnSlash(to, duration);
    }
  }

  /**
   * Slash: a single straight stroke from the attacker through the target,
   * like one swipe of an axe — whipped out fast from the attacker's end,
   * then fading over the rest of its life.
   */
  private spawnSlash(to: Player, duration: number): void {
    const angle = EffectLayer.SLASH_ANGLE;

    // Impact crescent (劍影): a clean arc() curve, not the old arcTo() hook,
    // so the trajectory is one smooth cut instead of a jagged corner-round.
    // Rotated 90° off the swing direction so it slices across the target
    // rather than pointing along the blade's travel.
    const g2 = new Graphics();
    g2.arc(
      0,
      0,
      EffectLayer.IMPACT_RADIUS,
      -EffectLayer.IMPACT_SPAN / 2,
      EffectLayer.IMPACT_SPAN / 2,
    ).stroke({ width: 3, color: 0xffffff, cap: 'round' });
    g2.position.set(to.x - 5, to.y - 10);
    g2.rotation = angle - Math.PI / 2;
    this.slashLayer.addChild(g2);

    // Icy flash that whips in then fades fast — a glint, not a lingering mark.
    const tintProxy = { t: 0 };
    gsap
      .timeline({ onComplete: () => g2.destroy() })
      .fromTo(
        g2.scale,
        { x: 0.5, y: 0.5 },
        { x: 1, y: 1, duration: duration * 0.2, ease: 'power4.out' },
        0,
      )
      .to(
        tintProxy,
        {
          t: 1,
          duration: duration * 0.5,
          onUpdate: () => {
            g2.tint = gsap.utils.interpolate('#14294d', '#ffffff', tintProxy.t);
          },
        },
        0,
      )
      .to(g2, { alpha: 0, duration: duration * 0.6, ease: 'power2.in' }, duration * 0.4);
  }

  private async castFireball(to: Player, duration: number): Promise<void> {
    const CONFIG = await SKILL_EFFECTS['fireball'];
    const animation = new AnimatedSprite(CONFIG!.frames ?? []);
    animation.position.set(to.x, to.y);
    animation.anchor.set(0.5, 1);
    animation.scale.set(0.5);
    this.castingLayer.addChild(animation);

    const fallDuration = duration * 0.9;
    const scale = animation.scale.x;

    gsap
      .timeline({
        onStart: () => {
          animation.play();
        },
        onComplete: () => {
          animation.destroy();
        },
      })
      // Drop straight down with gravity-style acceleration (starts slow, speeds up).
      .from(animation, { alpha: 0, y: '-=200', duration: fallDuration, ease: 'power2.in' })
      // Impact squash on landing — flattens wide then snaps back, selling the weight of the hit.
      .to(
        animation.scale,
        { x: scale * 1.4, y: scale * 0.6, duration: duration * 0.08, ease: 'power4.out' },
        fallDuration,
      )
      .to(animation.scale, {
        x: scale,
        y: scale,
        duration: duration * 0.18,
        ease: 'back.out(2)',
      })
      .to(animation, { alpha: 0, duration: duration * 0.25 }, `-=${duration * 0.1}`);
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
        { x: 2, y: 2 },
        { x: 1, y: 1, duration: duration, ease: 'back.out(2.5)' },
        0,
      )
      .to(text, { y: text.y - EffectLayer.FLOAT_DISTANCE, duration, ease: 'power1.out' }, 0)
      .to(text, { alpha: 0, duration: duration * 0.4, ease: 'power1.in' }, duration * 0.6);
  }
}
