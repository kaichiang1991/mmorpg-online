import type { AttackEvent, WelcomePayload } from '@mmo/shared';
import { Interpolator } from '../domain/interpolator';
import { connect, GameSocket } from '../infrastructure/network';
import { PixiRenderer } from '../infrastructure/pixi/PixiRenderer';
import { ActiveAttackTracker } from '../domain/active-attacks';

/**
 * Application layer: orchestrates the game session. Wires the socket to
 * the interpolator and feeds interpolated state to the renderer each frame.
 * React only mounts/unmounts this class.
 */
export class GameSession {
  private readonly renderer = new PixiRenderer();
  private readonly interpolator = new Interpolator();
  private socket: GameSocket | null = null;
  private selfId: string | null = null;
  private destroyed = false;
  private readonly attackers = new ActiveAttackTracker();

  async mount(host: HTMLElement, token: string): Promise<void> {
    await this.renderer.init(host);
    if (this.destroyed) return; // unmounted during async init

    this.socket = connect(token);
    this.socket.on('welcome', (payload: WelcomePayload) => {
      this.selfId = payload.selfId;
      this.renderer.setMap(payload.map);
    });
    this.socket.on('snapshot', (snapshot) => {
      this.interpolator.push(snapshot, performance.now());
    });

    this.socket.on('attack', (event: AttackEvent) => {
      this.attackers.push(event, performance.now());
    });

    this.renderer.onWorldClick((x, y) => this.socket?.emit('move', { x, y }));
    this.renderer.onPlayerClick((targetId) => this.socket?.emit('attack', { targetId }));
    this.renderer.onTick(() => {
      const now = performance.now();
      this.renderer.render(
        this.interpolator.playersAt(now),
        this.attackers.activeAt(now),
        this.selfId,
      );
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.socket?.disconnect();
    this.renderer.destroy();
  }
}
