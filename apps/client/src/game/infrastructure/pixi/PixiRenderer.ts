import { Application, Container, Graphics, Text } from 'pixi.js';
import type { ActiveAttack } from '../../domain/active-attacks';
import { cameraOffset } from '../../domain/camera';
import type { Player } from '../../domain/player';
import { EffectLayer } from './EffectLayer';

interface PlayerSprite {
  root: Container;
  label: Text;
}

/**
 * Owns everything Pixi: canvas, sprite lifecycle, floor, camera.
 * Knows nothing about sockets or interpolation — it just draws the
 * player list it is handed each frame.
 */
export class PixiRenderer {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly sprites = new Map<string, PlayerSprite>();
  private readonly effects = new EffectLayer();
  private map = { width: 0, height: 0 };
  private destroyed = false;
  private playerClickHandler: ((targetId: string) => void) | null = null;

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({ resizeTo: window, background: '#1d2b1d', antialias: true });
    if (this.destroyed) return; // destroyed during async init
    host.appendChild(this.app.canvas);
    this.app.stage.addChild(this.world);
    // player sprites are appended to `world` later; zIndex keeps effects on top
    this.world.sortableChildren = true;
    this.effects.container.zIndex = 100;
    this.world.addChild(this.effects.container);
  }

  destroy(): void {
    this.destroyed = true;
    this.app.destroy(true, { children: true });
  }

  setMap(map: { width: number; height: number }): void {
    this.map = map;
    this.drawFloor();
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
    this.app.ticker.add(handler);
  }

  /** Reports clicks on other players' sprites; self is not clickable. */
  onPlayerClick(handler: (targetId: string) => void): void {
    this.playerClickHandler = handler;
  }

  render(players: Player[], attacks: ActiveAttack[], selfId: string | null): void {
    const seen = new Set<string>();
    const byId = new Map(players.map((p) => [p.id, p]));

    for (const p of players) {
      seen.add(p.id);
      const sprite = this.spriteFor(p.id, p.name, p.id === selfId);
      sprite.root.position.set(p.x, p.y);
      if (p.id === selfId) this.followCamera(p.x, p.y);
    }

    // remove sprites for players no longer in the world
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.root.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

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
    if (!isSelf) {
      root.eventMode = 'static';
      root.cursor = 'pointer';
      root.on('pointerdown', (e) => {
        e.stopPropagation(); // don't also fire the stage's move-to click
        this.playerClickHandler?.(id);
      });
    }
    this.world.addChild(root);

    sprite = { root, label };
    this.sprites.set(id, sprite);
    return sprite;
  }

  private followCamera(x: number, y: number): void {
    const offset = cameraOffset(this.app.screen, this.map, x, y);
    this.world.position.set(offset.x, offset.y);
  }
}
