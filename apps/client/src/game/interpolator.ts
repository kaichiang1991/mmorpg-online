import type { PlayerSnapshot, WorldSnapshot } from '@mmo/shared';

export interface InterpolatedPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
}

/**
 * Buffers the two most recent world snapshots and lerps entity positions
 * between them, so a 10Hz network stream renders smoothly at 60fps.
 * Pure logic — unit-tested, no Pixi/socket dependencies.
 */
export class Interpolator {
  private prev: WorldSnapshot | null = null;
  private next: WorldSnapshot | null = null;
  private nextReceivedAt = 0;
  private prevReceivedAt = 0;

  push(snapshot: WorldSnapshot, receivedAt: number): void {
    this.prev = this.next;
    this.prevReceivedAt = this.nextReceivedAt;
    this.next = snapshot;
    this.nextReceivedAt = receivedAt;
  }

  /** Interpolated player list at render time `now` (same clock as receivedAt). */
  playersAt(now: number): InterpolatedPlayer[] {
    if (!this.next) return [];
    if (!this.prev) return this.next.players.map(clone);

    const span = this.nextReceivedAt - this.prevReceivedAt;
    const alpha = span <= 0 ? 1 : Math.min(1, (now - this.nextReceivedAt) / span);
    const prevById = new Map(this.prev.players.map((p) => [p.id, p]));

    return this.next.players.map((p) => {
      const before = prevById.get(p.id);
      if (!before) return clone(p); // newly appeared: snap, no lerp from nowhere
      return {
        id: p.id,
        name: p.name,
        x: before.x + (p.x - before.x) * alpha,
        y: before.y + (p.y - before.y) * alpha,
      };
    });
  }
}

const clone = (p: PlayerSnapshot): InterpolatedPlayer => ({
  id: p.id,
  name: p.name,
  x: p.x,
  y: p.y,
});
