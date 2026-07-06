import { Container, Graphics, Text } from 'pixi.js';
import type { Player } from '../../domain/player';

interface PlayerSprite {
  root: Container;
  label: Text;
}

/**
 * Draws player avatars. Stateful: keeps one sprite per player id and
 * reconciles the map against the player list each frame — creating
 * sprites for newcomers and destroying those who left the world.
 */
export class PlayerLayer {
  readonly container = new Container();
  private readonly sprites = new Map<string, PlayerSprite>();
  private clickHandler: ((targetId: string) => void) | null = null;

  /** Reports clicks on other players' sprites; self is not clickable. */
  onPlayerClick(handler: (targetId: string) => void): void {
    this.clickHandler = handler;
  }

  render(players: Player[], selfId: string | null): void {
    const seen = new Set<string>();

    for (const p of players) {
      seen.add(p.id);
      const sprite = this.spriteFor(p.id, p.name, p.id === selfId);
      sprite.root.position.set(p.x, p.y);
    }

    // remove sprites for players no longer in the world
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.root.destroy({ children: true });
        this.sprites.delete(id);
      }
    }
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
        this.clickHandler?.(id);
      });
    }
    this.container.addChild(root);

    sprite = { root, label };
    this.sprites.set(id, sprite);
    return sprite;
  }
}
