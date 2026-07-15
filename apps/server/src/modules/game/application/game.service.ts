import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  AttackResultPayload,
  CastBeginPayload,
  CastCancelPayload,
  GAME_CONSTANTS,
  SkillId,
  WorldSnapshot,
} from '@mmo/shared';
import { AttackResultVo } from '../domain/value-objects/attack-result.vo';
import { World, WorldEvent } from '../domain/world';

/** Domain occurrence translated to the wire: which socket event to emit, with its payload. */
export type GameEvent =
  | { name: 'attack'; payload: AttackResultPayload }
  | { name: 'castBegin'; payload: CastBeginPayload }
  | { name: 'castCancel'; payload: CastCancelPayload };

/**
 * Application service: drives the domain World with a fixed tick loop.
 * Presentation (gateway) calls in with intents and pulls snapshots out;
 * tick-born events (cast completion/cancel) are pushed via onEvent.
 */
@Injectable()
export class GameService implements OnModuleInit, OnModuleDestroy {
  private readonly world = new World();
  private tickTimer: NodeJS.Timeout | null = null;
  private lastTickAt = Date.now();
  private listener: ((event: GameEvent) => void) | null = null;

  /** Presentation registers here to broadcast tick-born events. */
  onEvent(listener: (event: GameEvent) => void): void {
    this.listener = listener;
  }

  onModuleInit(): void {
    this.lastTickAt = Date.now();
    this.tickTimer = setInterval(() => {
      const now = Date.now();
      const events = this.world.tick((now - this.lastTickAt) / 1000, now);
      this.lastTickAt = now;
      for (const event of events) this.listener?.(this.toGameEvent(event));
    }, 1000 / GAME_CONSTANTS.TICK_RATE);
  }

  onModuleDestroy(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
  }

  join(playerId: string, name: string): void {
    this.world.addPlayer(playerId, name);
  }

  leave(playerId: string): void {
    this.world.removePlayer(playerId);
  }

  skillMpCosts(playerId: string): Record<SkillId, number> {
    return this.world.skillMpCosts(playerId);
  }

  setMoveTarget(playerId: string, x: number, y: number): GameEvent | null {
    const event = this.world.setMoveTarget(playerId, x, y);
    return event ? this.toGameEvent(event) : null;
  }

  snapshot(): WorldSnapshot {
    return this.world.snapshot(Date.now());
  }

  attack(playerId: string, targetId: string, skillId: string): GameEvent | null {
    const now = Date.now();
    const outcome = this.world.attack(playerId, targetId, skillId, now);
    switch (outcome.kind) {
      case 'resolved':
        return {
          name: 'attack',
          payload: this.toAttackPayload(playerId, targetId, outcome.skillId, outcome.attack),
        };
      case 'castStarted':
        return {
          name: 'castBegin',
          payload: this.toCastBeginPayload(
            playerId,
            outcome.skillId,
            outcome.duration,
            outcome.endsAt,
          ),
        };
      case 'rejected':
        return null;
    }
  }

  private toGameEvent(event: WorldEvent): GameEvent {
    switch (event.type) {
      case 'attackResolved':
        return {
          name: 'attack',
          payload: this.toAttackPayload(
            event.attackerId,
            event.targetId,
            event.skillId,
            event.attack,
          ),
        };
      case 'castCancelled':
        return {
          name: 'castCancel',
          payload: { casterId: event.casterId, reason: event.reason },
        };
    }
  }

  private toAttackPayload(
    attackerId: string,
    targetId: string,
    skillId: SkillId,
    attackVo: AttackResultVo,
  ): AttackResultPayload {
    // domain enums share the wire-format string values, hence the casts
    return {
      attackerId,
      targetId,
      skillId,
      damage: attackVo.finalDamage,
      crit: attackVo.isCrit,
      kind: attackVo.kind,
      element: attackVo.element,
      multipliers: [...attackVo.multipliers],
    };
  }

  private toCastBeginPayload(
    casterId: string,
    skillId: SkillId,
    duration: number,
    endsAt: number,
  ): CastBeginPayload {
    return {
      casterId,
      skillId,
      duration,
      endsAt,
    };
  }

  get mapSize(): { width: number; height: number } {
    return { width: this.world.width, height: this.world.height };
  }
}
