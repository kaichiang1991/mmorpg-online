/**
 * A client-side fact: "this attack is happening right now."
 * Data only — how it looks (trajectory, colors, fade) lives in the renderer.
 *
 * ActiveAttackTracker (push/activeAt, same pattern as Interpolator) will be
 * added here once the `attack` event lands in the shared protocol.
 */
export interface ActiveAttack {
  attackerId: string;
  targetId: string;
  damage: number;
  /** local clock (same as interpolator's receivedAt / performance.now()) */
  startedAt: number;
}
