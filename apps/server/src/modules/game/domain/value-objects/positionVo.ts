/** An immutable 2D map coordinate. */
export class PositionVo {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  distanceTo(other: PositionVo): number {
    return Math.hypot(other.x - this.x, other.y - this.y);
  }

  /** Step toward the target by `step`; returns the target itself on arrival. */
  moveToward(target: PositionVo, step: number): PositionVo {
    const distance = this.distanceTo(target);
    if (distance <= step) return target;
    const ratio = step / distance;
    return new PositionVo(this.x + (target.x - this.x) * ratio, this.y + (target.y - this.y) * ratio);
  }

  /** Clamp into the map rectangle [0, width] x [0, height]. */
  clampTo(width: number, height: number): PositionVo {
    const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v));
    return new PositionVo(clamp(this.x, width), clamp(this.y, height));
  }

  equals(other: PositionVo): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
