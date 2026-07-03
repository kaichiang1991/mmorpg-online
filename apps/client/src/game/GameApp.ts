import { Application, Container, Graphics, Text } from 'pixi.js';
import type { WelcomePayload } from '@mmo/shared';
import { Interpolator } from './interpolator';
import { connect, GameSocket } from './network';

interface PlayerSprite {
  root: Container;
  label: Text;
}

/**
 * All rendering and game-loop logic lives here in Pixi land.
 * React only mounts/unmounts this class.
 */
export class GameApp {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly sprites = new Map<string, PlayerSprite>();
  private readonly interpolator = new Interpolator();
  private socket: GameSocket | null = null;
  private selfId: string | null = null;
  private map = { width: 0, height: 0 };
  private destroyed = false;

  async mount(host: HTMLElement, token: string): Promise<void> {
    await this.app.init({ resizeTo: window, background: '#1d2b1d', antialias: true });
    if (this.destroyed) return; // unmounted during async init
    host.appendChild(this.app.canvas);
    this.app.stage.addChild(this.world);

    this.socket = connect(token);
    this.socket.on('welcome', (payload: WelcomePayload) => {
      this.selfId = payload.selfId;
      this.map = payload.map;
      this.drawFloor();
    });
    this.socket.on('snapshot', (snapshot) => {
      this.interpolator.push(snapshot, performance.now());
    });

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (e) => {
      const p = this.world.toLocal(e.global);
      this.socket?.emit('move', { x: p.x, y: p.y });
    });

    this.app.ticker.add(() => this.render());
  }

  destroy(): void {
    this.destroyed = true;
    this.socket?.disconnect();
    this.app.destroy(true, { children: true });
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

  private spriteFor(id: string, name: string, isSelf: boolean): PlayerSprite {
    let sprite = this.sprites.get(id);
    if (sprite) return sprite;

    const root = new Container();
    const body = new Graphics()
      .circle(0, 0, 16)
      .fill(isSelf ? 0x4a8cff : 0x8fd14f)
      .stroke({ width: isSelf ? 3 : 1, color: 0xffffff, alpha: 0.8 });
    const label = new Text({
      text: name,
      style: { fontSize: 12, fill: 0xffffff, fontWeight: 'bold' },
    });
    label.anchor.set(0.5);
    label.y = -30;
    root.addChild(body, label);
    this.world.addChild(root);

    sprite = { root, label };
    this.sprites.set(id, sprite);
    return sprite;
  }

  private render(): void {
    const players = this.interpolator.playersAt(performance.now());
    const seen = new Set<string>();

    for (const p of players) {
      seen.add(p.id);
      const sprite = this.spriteFor(p.id, p.name, p.id === this.selfId);
      sprite.root.position.set(p.x, p.y);
      if (p.id === this.selfId) this.followCamera(p.x, p.y);
    }

    // remove sprites for players no longer in the world
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.root.destroy({ children: true });
        this.sprites.delete(id);
      }
    }
  }

  private followCamera(x: number, y: number): void {
    const { width, height } = this.app.screen;
    this.world.position.set(
      Math.min(0, Math.max(width - this.map.width, width / 2 - x)),
      Math.min(0, Math.max(height - this.map.height, height / 2 - y)),
    );
  }
}
