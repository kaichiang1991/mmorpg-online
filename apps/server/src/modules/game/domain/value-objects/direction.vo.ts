import { PositionVo } from './position.vo';

/** An immutable unit direction vector; ZERO means "not moving". */
export class DirectionVo {
  static readonly ZERO = new DirectionVo(0, 0);

  private constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  /** Normalized direction from `from` toward `to`; ZERO when they coincide. */
  static between(from: PositionVo, to: PositionVo): DirectionVo {
    const distance = from.distanceTo(to);
    if (distance === 0) return DirectionVo.ZERO;
    return new DirectionVo((to.x - from.x) / distance, (to.y - from.y) / distance);
  }

  get isZero(): boolean {
    return this.x === 0 && this.y === 0;
  }
}
