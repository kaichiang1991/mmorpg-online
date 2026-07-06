import { Container, Graphics } from 'pixi.js';
import { ATTACK_TTL_MS, type ActiveAttack } from '../../domain/active-attacks';
import type { Player } from '../../domain/player';

/** Duration of the axe-swing arc sweeping across the target — a visual choice. */
const SWING_MS = 200;
/** Impact ring lingers for whatever remains of the domain-owned lifetime. */
const LINGER_MS = ATTACK_TTL_MS - SWING_MS;

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

      if (age < SWING_MS) {
        this.drawSlash(from, to, age / SWING_MS);
      } else {
        this.drawImpact(to, (age - SWING_MS) / LINGER_MS);
      }
    }
  }

  /**
   * Axe-swing slash: an arc centered on the attacker, sweeping through the
   * target's direction. The trail behind the blade fades out and the leading
   * edge stays bright, like the streak left by a swung axe; t runs 0→1.
   */
  private drawSlash(from: Player, to: Player, t: number): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return; // overlapping endpoints: no swing direction to draw

    const SWEEP = Math.PI / 2; // 90° swing, centered on the aim direction
    const aim = Math.atan2(dy, dx);
    const start = aim - SWEEP / 2;
    const head = start + SWEEP * t;

    const inner = Math.max(dist - 7, 0);
    const outer = dist + 7;

    // Trail: crescent segments, brighter toward the blade's leading edge.
    const SEGMENTS = 6;
    for (let i = 0; i < SEGMENTS; i++) {
      const a0 = start + ((head - start) * i) / SEGMENTS;
      const a1 = start + ((head - start) * (i + 1)) / SEGMENTS;
      this.g
        .arc(from.x, from.y, outer, a0, a1)
        .arc(from.x, from.y, inner, a1, a0, true)
        .closePath()
        .fill({ color: 0xffd166, alpha: 0.08 + 0.5 * ((i + 1) / SEGMENTS) });
    }

    // Blade's leading edge.
    this.g
      .moveTo(from.x + Math.cos(head) * inner, from.y + Math.sin(head) * inner)
      .lineTo(from.x + Math.cos(head) * outer, from.y + Math.sin(head) * outer)
      .stroke({ width: 3, color: 0xfff2c9, alpha: 0.95 });
  }

  /** Expanding, fading ring on the target; t runs 0→1 over the linger. */
  private drawImpact(to: Player, t: number): void {
    this.g
      .circle(to.x, to.y, 10 + 14 * t)
      .stroke({ width: 3, color: 0xff6b4a, alpha: 0.8 * (1 - t) });
  }
}
