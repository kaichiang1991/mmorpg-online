import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AttackResultPayload, GAME_CONSTANTS, WorldSnapshot } from '@mmo/shared';
import { World } from '../domain/world';

/**
 * Application service: drives the domain World with a fixed tick loop.
 * Presentation (gateway) calls in with intents and pulls snapshots out.
 */
@Injectable()
export class GameService implements OnModuleInit, OnModuleDestroy {
  private readonly world = new World();
  private tickTimer: NodeJS.Timeout | null = null;
  private lastTickAt = Date.now();

  onModuleInit(): void {
    this.lastTickAt = Date.now();
    this.tickTimer = setInterval(() => {
      const now = Date.now();
      this.world.tick((now - this.lastTickAt) / 1000);
      this.lastTickAt = now;
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

  setMoveTarget(playerId: string, x: number, y: number): void {
    this.world.setMoveTarget(playerId, x, y);
  }

  snapshot(): WorldSnapshot {
    return this.world.snapshot(Date.now());
  }

  attack(playerId: string, targetId: string, skillId: string): AttackResultPayload | null {
    const now = Date.now();
    const attackVo = this.world.attack(playerId, targetId, skillId, now);
    if (!attackVo) return null;
    // domain enums share the wire-format string values, hence the casts
    return {
      attackerId: playerId,
      targetId,
      skillId,
      damage: attackVo.finalDamage,
      crit: attackVo.isCrit,
      kind: attackVo.kind,
      element: attackVo.element,
      multipliers: [...attackVo.multipliers],
    };
  }

  get mapSize(): { width: number; height: number } {
    return { width: this.world.width, height: this.world.height };
  }
}
