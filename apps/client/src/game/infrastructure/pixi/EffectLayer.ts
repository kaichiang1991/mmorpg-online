import { Container, Graphics } from 'pixi.js';
import { ATTACK_TTL_MS, type ActiveAttack } from '../../domain/active-attacks';
import type { Player } from '../../domain/player';

/** Projectile flight time from attacker to target — a visual choice. */
const FLIGHT_MS = 250;
/** Impact ring lingers for whatever remains of the domain-owned lifetime. */
const LINGER_MS = ATTACK_TTL_MS - FLIGHT_MS;

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

      if (age < FLIGHT_MS) {
        this.drawFlight(from, to, age / FLIGHT_MS);
      } else {
        this.drawImpact(to, (age - FLIGHT_MS) / LINGER_MS);
      }
    }
  }

  /** Trail from attacker to the projectile, projectile dot at progress t. */
  private drawFlight(from: Player, to: Player, t: number): void {
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;

    this.g
      .moveTo(from.x, from.y)
      .lineTo(x, y)
      .stroke({ width: 2, color: 0xffd166, alpha: 0.35 });
    this.g.circle(x, y, 5).fill({ color: 0xffd166, alpha: 0.9 });
  }

  /** Expanding, fading ring on the target; t runs 0→1 over the linger. */
  private drawImpact(to: Player, t: number): void {
    this.g
      .circle(to.x, to.y, 10 + 14 * t)
      .stroke({ width: 3, color: 0xff6b4a, alpha: 0.8 * (1 - t) });
  }
}
