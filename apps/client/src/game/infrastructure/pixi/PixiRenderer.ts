import gsap from 'gsap';
import { Application, Container, Graphics } from 'pixi.js';
import type { ActiveAttack } from '../../domain/active-attacks';
import { cameraOffset } from '../../domain/camera';
import type { Player } from '../../domain/player';
import { EffectLayer } from './EffectLayer';
import { PlayerLayer } from './PlayerLayer';
import { preloadPlayerAssets } from './PlayerSprite';
import { PlayerPanel } from '../../domain/player-panel';
import UILayer from './UILayer';

/**
 * Owns everything Pixi: canvas, layer composition, floor, camera.
 * Knows nothing about sockets or interpolation — it just draws the
 * player list it is handed each frame.
 */
export class PixiRenderer {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly players = new PlayerLayer();
  private readonly effects = new EffectLayer();
  private readonly ui = new UILayer();
  private map = { width: 0, height: 0 };
  private destroyed = false;
  private tickHandler: (() => void) | null = null;

  // The whole frame is driven by gsap.ticker (Pixi's own ticker never starts):
  // GSAP updates its tweens first, then this listener runs game updates and
  // renders — guaranteeing tween state is fresh in the same frame.
  private readonly frame = () => {
    this.tickHandler?.();
    this.app.render();
  };

  async init(host: HTMLElement): Promise<void> {
    await Promise.all([
      this.app.init({ resizeTo: window, background: '#1d2b1d', antialias: true, autoStart: false }),
      preloadPlayerAssets(),
    ]);
    if (this.destroyed) return; // destroyed during async init
    host.appendChild(this.app.canvas);
    this.app.stage.addChild(this.world);
    // zIndex keeps effects on top of player sprites
    this.world.sortableChildren = true;
    this.effects.container.zIndex = 100;
    this.world.addChild(this.players.container, this.effects.container);
    // UI is screen-fixed: it lives on the stage, not in the camera-driven world
    this.app.stage.addChild(this.ui.container);
    this.ui.layout(this.app.screen.width, this.app.screen.height);
    this.app.renderer.on('resize', (width, height) => this.ui.layout(width, height));
  }

  destroy(): void {
    this.destroyed = true;
    // Order matters: stop driving frames and kill tweens before the Pixi
    // objects they touch are destroyed.
    gsap.ticker.remove(this.frame);
    this.effects.destroy();
    this.app.destroy(true, { children: true });
  }

  setMap(map: { width: number; height: number }): void {
    this.map = map;
    this.drawFloor();
  }

  setUI(playerPanel: PlayerPanel) {
    this.renderPlayerPanel(playerPanel);
  }

  /** Reports pointer-down positions in world coordinates. */
  onWorldClick(handler: (x: number, y: number) => void): void {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (e) => {
      const p = this.world.toLocal(e.global);
      handler(p.x, p.y);
    });
  }

  onTick(handler: () => void): void {
    this.tickHandler = handler;
    gsap.ticker.add(this.frame);
  }

  /** Reports clicks on other players' sprites; self is not clickable. */
  onPlayerClick(handler: (targetId: string) => void): void {
    this.players.onPlayerClick(handler);
  }

  onSkillSelect(handler: (index: number) => void): void {
    this.ui.onSkillSelect(handler);
  }

  renderDebug(values: Record<string, unknown>): void {
    this.ui.renderDebug(values);
  }

  render(players: Player[], attacks: ActiveAttack[], selfId: string | null): void {
    this.players.render(players, selfId);

    const self = players.find((p) => p.id === selfId);
    if (self) this.followCamera(self.x, self.y);

    const byId = new Map(players.map((p) => [p.id, p]));
    this.effects.render(attacks, byId, performance.now());
  }

  /* ------------------------------------------------------------ internal */

  private drawFloor(): void {
    const grid = 80;
    const g = new Graphics();
    for (let x = 0; x <= this.map.width; x += grid) {
      g.moveTo(x, 0).lineTo(x, this.map.height);
    }
    for (let y = 0; y <= this.map.height; y += grid) {
      g.moveTo(0, y).lineTo(this.map.width, y);
    }
    g.stroke({ width: 1, color: 0xffffff, alpha: 0.07 });
    g.rect(0, 0, this.map.width, this.map.height).stroke({ width: 2, color: 0xffffff, alpha: 0.2 });
    this.world.addChildAt(g, 0);
  }

  private followCamera(x: number, y: number): void {
    const offset = cameraOffset(this.app.screen, this.map, x, y);
    this.world.position.set(offset.x, offset.y);
  }

  private renderPlayerPanel(playerPanel: PlayerPanel) {
    this.ui.initPlayerPanel(playerPanel.skillBar);
  }
}
