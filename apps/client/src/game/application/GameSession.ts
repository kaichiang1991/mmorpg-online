import type {
  AttackResultPayload,
  CastBeginPayload,
  CastCancelPayload,
  WelcomePayload,
} from '@mmo/shared';
import { Interpolator } from '../domain/interpolator';
import { connect, GameSocket } from '../infrastructure/network';
import { PixiRenderer } from '../infrastructure/pixi/PixiRenderer';
import { ActiveAttackTracker } from '../domain/active-attacks';
import { PlayerPanel } from '../domain/player-panel';
import { SkillBarVo } from '../domain/value-objects/skill-bar.vo';
import { hitTestWorld, WorldHit } from '../domain/world-hit-test';
import { ActiveCastTracker } from '../domain/active-casts';

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
  private readonly casters = new ActiveCastTracker();

  private playerPanel: PlayerPanel | null = null;

  async mount(host: HTMLElement, token: string): Promise<void> {
    await this.renderer.init(host);
    if (this.destroyed) return; // unmounted during async init

    this.socket = connect(token);
    this.socket.on('welcome', (payload: WelcomePayload) => {
      this.selfId = payload.selfId;
      this.renderer.setMap(payload.map);
      this.playerPanel = PlayerPanel.from({ skillBar: SkillBarVo.from(payload.player.skillIds) });
      this.renderer.setUI(this.playerPanel);
    });

    this.socket.on('snapshot', (snapshot) => {
      this.interpolator.push(snapshot, performance.now());
      const self = snapshot.players.find((player) => player.id === this.selfId);
      if (self) {
        this.playerPanel?.syncMp(self.mp);
      }
    });

    this.socket.on('attack', (event: AttackResultPayload) => {
      this.attackers.push(event, performance.now());
    });

    this.socket.on('castBegin', (event: CastBeginPayload) => {
      this.casters.push(event, performance.now());
    });

    this.socket.on('castCancel', (event: CastCancelPayload) => {
      this.casters.cancel(event.casterId);
    });

    this.renderer.onWorldClick((x, y) => {
      const now = performance.now();
      if (this.casters.isCastingAt(this.selfId!, now)) {
        return this.socket?.emit('move', { x, y });
      }

      const players = this.interpolator.playersAt(now);
      const hit = hitTestWorld(players, x, y);
      switch (hit.kind) {
        case 'ground':
          return this.socket?.emit('move', { x, y });
        case 'player':
          return this.hitPlayerAction(hit);
      }
    });

    this.renderer.onSkillSelect((index: number) => {
      const skill = this.playerPanel?.skillBar.at(index);
      if (!skill?.hasSkill()) return;

      if (skill.id === this.playerPanel?.selectedSkillId) return this.playerPanel.cancelSelect();

      this.playerPanel?.selectSkillAt(index);
    });

    this.renderer.onTick(() => {
      const now = performance.now();
      this.renderer.render(
        this.interpolator.playersAt(now),
        this.attackers.activeAt(now),
        this.casters.activeAt(now),
        this.selfId,
      );
      if (this.playerPanel) {
        this.renderer.renderSelectedSkill(this.playerPanel.selectedSkillId);
        this.renderer.renderSkillProcess(this.playerPanel.skillProcesses(now));
      }
      this.renderer.renderDebug({ selectedSkillId: this.playerPanel?.selectedSkillId });
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.socket?.disconnect();
    this.renderer.destroy();
  }

  private hitPlayerAction(hit: WorldHit) {
    if (hit.kind !== 'player') return;

    // todo: self-cast skill
    if (hit.player.id === this.selfId) return;

    const skill = this.playerPanel?.selectedSkill;
    if (!skill) return;

    // todo: player 沒有需要的mp

    const now = performance.now();
    if (!this.playerPanel?.isSelectedSkillReady(now)) return;

    this.socket?.emit('attack', {
      targetId: hit.player.id,
      skillId: skill.id,
    });

    this.playerPanel?.castSkill(skill.id, now);
  }
}
