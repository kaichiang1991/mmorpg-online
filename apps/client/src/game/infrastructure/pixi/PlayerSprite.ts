import { GAME_CONSTANTS } from '@mmo/shared';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import characterUrl from '../../../assets/characters/frame_001.png';
import type { Player } from '../../domain/player';

const BAR_WIDTH = 50;
const BAR_HEIGHT = 5;
const BODY_HEIGHT = 48; // on-screen size; source texture is 49x78

/**
 * Loads every texture PlayerSprite draws with into the Assets cache.
 * Must resolve before the first PlayerSprite is constructed —
 * Sprite.from(url) only looks up the cache, it never fetches.
 */
export const preloadPlayerAssets = (): Promise<unknown> => Assets.load(characterUrl);

/** One horizontal stat bar: white track, colored fill sized by percentage. */
class StatBar extends Container {
  private readonly fill = new Graphics();
  private lastPercentage = -1;

  constructor(private readonly color: number) {
    super();
    this.addChild(
      new Graphics().roundRect(0, 0, BAR_WIDTH, BAR_HEIGHT, 1).fill(0xffffff),
      this.fill,
    );
    this.pivot.set(BAR_WIDTH / 2, 0);
  }

  setPercentage(percentage: number): void {
    percentage = Math.min(1, Math.max(0, percentage));
    if (percentage === this.lastPercentage) return; // Graphics redraw re-tessellates; skip when unchanged
    this.lastPercentage = percentage;
    this.fill.clear();
    if (percentage > 0) {
      this.fill.roundRect(0, 0, BAR_WIDTH * percentage, BAR_HEIGHT, 1).fill(this.color);
    }
  }
}

/**
 * One player's avatar: body, name label, hp/mp bars. Owns its look only —
 * lifecycle (create/destroy) and click wiring belong to PlayerLayer.
 */
export class PlayerSprite extends Container {
  private readonly hpBar = new StatBar(0xff0000);
  private readonly mpBar = new StatBar(0x3b82f6);

  constructor(name: string, isSelf: boolean) {
    super();

    const body = Sprite.from(characterUrl);
    body.anchor.set(0.5);
    body.scale.set(BODY_HEIGHT / body.texture.height);

    if (isSelf) {
      // ground ring marking your own character
      const ring = new Graphics()
        .ellipse(0, BODY_HEIGHT / 2, 16, 6)
        .stroke({ width: 2, color: 0x4a8cff, alpha: 0.9 });
      this.addChild(ring);
    }

    const nameLabel = new Text({
      text: name,
      style: { fontSize: 12, fill: 0xffffff, fontWeight: 'bold' },
    });
    nameLabel.anchor.set(0.5);
    nameLabel.y = -45;

    this.hpBar.y = -35;
    this.mpBar.y = -35 + BAR_HEIGHT;

    this.addChild(body, nameLabel, this.hpBar, this.mpBar);
  }

  /** Sync visuals to the latest player state; called every frame. */
  update(p: Player): void {
    this.position.set(p.x, p.y);
    this.hpBar.setPercentage(p.hp / GAME_CONSTANTS.MAX_HP);
    this.mpBar.setPercentage(p.mp / GAME_CONSTANTS.MAX_MP);
  }
}
