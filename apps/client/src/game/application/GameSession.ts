import type { AttackResultPayload, WelcomePayload } from '@mmo/shared';
import { Interpolator } from '../domain/interpolator';
import { connect, GameSocket } from '../infrastructure/network';
import { PixiRenderer } from '../infrastructure/pixi/PixiRenderer';
import { ActiveAttackTracker } from '../domain/active-attacks';
import { PlayerPanel } from '../domain/player-panel';
import { SkillBarVo } from '../domain/value-objects/skill-bar.vo';

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

  private playerPanel: PlayerPanel | null = null;

  async mount(host: HTMLElement, token: string): Promise<void> {
    await this.renderer.init(host);
    if (this.destroyed) return; // unmounted during async init

    this.socket = connect(token);
    this.socket.on('welcome', (payload: WelcomePayload) => {
      this.selfId = payload.selfId;
      this.renderer.setMap(payload.map);
      this.playerPanel = new PlayerPanel({ skillBar: SkillBarVo.from(payload.player.skillIds) });
      this.renderer.setUI(this.playerPanel);
    });

    this.socket.on('snapshot', (snapshot) => {
      this.interpolator.push(snapshot, performance.now());
    });

    this.socket.on('attack', (event: AttackResultPayload) => {
      this.attackers.push(event, performance.now());
    });

    this.renderer.onWorldClick((x, y) => this.socket?.emit('move', { x, y }));

    this.renderer.onSkillSelect((index: number) => {
      if (index === this.playerPanel?.selectSkillIndex)
        return this.playerPanel.cancelSkillAt(index);

      this.playerPanel?.selectSkillAt(index);
    });

    this.renderer.onPlayerClick((targetId) =>
      this.socket?.emit('attack', { targetId, skillId: 'basic' }),
    );
    this.renderer.onTick(() => {
      const now = performance.now();
      this.renderer.render(
        this.interpolator.playersAt(now),
        this.attackers.activeAt(now),
        this.selfId,
      );
      this.renderer.renderDebug({ selectSkillIndex: this.playerPanel?.selectSkillIndex });
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.socket?.disconnect();
    this.renderer.destroy();
  }
}
