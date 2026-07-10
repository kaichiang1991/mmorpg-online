import type { CastBeginPayload, SkillId } from '@mmo/shared';

/**
 * A client-side fact: "this caster is channeling a cast right now."
 * Data only — how it looks (bar shape, colors) lives in the renderer.
 */
export interface ActiveCast {
  casterId: string;
  skillId: SkillId;
  /** local clock (same as interpolator's receivedAt / performance.now()) */
  startedAt: number;
  /** cast duration in ms, from the server payload */
  duration: number;
}

/** An active cast enriched with render-time progress. */
export interface CastProgress extends ActiveCast {
  /** 0 (just started) .. <1 (about to finish) */
  progress: number;
}

/**
 * Tracks casts currently channeling. Same pattern as ActiveAttackTracker:
 * `push()` ingests a server event, `activeAt(now)` answers for render time.
 * Keyed by casterId — a caster channels at most one cast at a time.
 * Pure logic — unit-tested, no Pixi/socket dependencies.
 */
export class ActiveCastTracker {
  private casts = new Map<string, ActiveCast>();

  /**
   * `receivedAt` is the local clock. Simple-clock scheme: progress runs on
   * `duration` from receipt; the payload's server-epoch `endsAt` is ignored.
   */
  push(event: CastBeginPayload, receivedAt: number): void {
    this.casts.set(event.casterId, {
      casterId: event.casterId,
      skillId: event.skillId,
      startedAt: receivedAt,
      duration: event.duration,
    });
  }

  /** Server said the cast stopped early (moved / interrupted / died / …). */
  cancel(casterId: string): void {
    this.casts.delete(casterId);
  }

  /**
   * Casts still channeling at `now`, keyed by casterId (a caster has at most
   * one), with progress; finished ones are dropped for good.
   */
  activeAt(now: number): Map<string, CastProgress> {
    const alive = new Map<string, CastProgress>();
    for (const [casterId, cast] of this.casts) {
      const progress = (now - cast.startedAt) / cast.duration;
      if (progress >= 1) {
        this.casts.delete(casterId);
        continue;
      }
      alive.set(casterId, { ...cast, progress });
    }
    return alive;
  }
}
