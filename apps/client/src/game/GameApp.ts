import type { WelcomePayload } from '@mmo/shared';
import { Interpolator } from './interpolator';
import { connect, GameSocket } from './network';
import { PixiRenderer } from './PixiRenderer';

/**
 * Orchestrates the game session: wires the socket to the interpolator
 * and feeds interpolated state to the renderer each frame.
 * React only mounts/unmounts this class.
 */
export class GameApp {
  private readonly renderer = new PixiRenderer();
  private readonly interpolator = new Interpolator();
  private socket: GameSocket | null = null;
  private selfId: string | null = null;
  private destroyed = false;

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

    this.renderer.onWorldClick((x, y) => this.socket?.emit('move', { x, y }));
    this.renderer.onTick(() =>
      this.renderer.render(this.interpolator.playersAt(performance.now()), this.selfId),
    );
  }

  destroy(): void {
    this.destroyed = true;
    this.socket?.disconnect();
    this.renderer.destroy();
  }
}
