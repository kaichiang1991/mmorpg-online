/** Pure domain entity: a player pawn in the world. No framework dependencies. */
export class Player {
  private targetX: number | null = null;
  private targetY: number | null = null;

  constructor(
    readonly id: string,
    readonly name: string,
    public x: number,
    public y: number,
    private readonly speed: number,
  ) {}

  get isMoving(): boolean {
    return this.targetX !== null;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /** Advance toward the target by speed * dt seconds. Stops exactly on arrival. */
  advance(dt: number): void {
    if (this.targetX === null || this.targetY === null) return;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (distance <= step) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.targetX = this.targetY = null;
      return;
    }
    this.x += (dx / distance) * step;
    this.y += (dy / distance) * step;
  }
}
