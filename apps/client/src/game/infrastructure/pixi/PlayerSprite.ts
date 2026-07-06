import { GAME_CONSTANTS } from '@mmo/shared';
import { Container, Graphics, Text } from 'pixi.js';
import type { Player } from '../../domain/player';

const HP_BAR_WIDTH = 50;
const HP_BAR_HEIGHT = 5;

/**
 * One player's avatar: body, name label, hp bar. Owns its look only —
 * lifecycle (create/destroy) and click wiring belong to PlayerLayer.
 */
export class PlayerSprite extends Container {
  private readonly hpFill: Graphics;
  private lastHpPct = -1;

  constructor(name: string, isSelf: boolean) {
    super();

    const body = new Graphics()
      .circle(0, 0, 16)
      .fill(isSelf ? 0x4a8cff : 0x8fd14f)
      .stroke({ width: isSelf ? 3 : 1, color: 0xffffff, alpha: 0.8 });

    const nameLabel = new Text({
      text: name,
      style: { fontSize: 12, fill: 0xffffff, fontWeight: 'bold' },
    });
    nameLabel.anchor.set(0.5);
    nameLabel.y = -38;

    const hpBar = new Container();
    this.hpFill = new Graphics();
    hpBar.addChild(
      new Graphics().roundRect(0, 0, HP_BAR_WIDTH, HP_BAR_HEIGHT, 1).fill(0xffffff),
      this.hpFill,
    );
    hpBar.pivot.set(HP_BAR_WIDTH / 2, 0);
    hpBar.y = -28;

    this.addChild(body, nameLabel, hpBar);
  }

  /** Sync visuals to the latest player state; called every frame. */
  update(p: Player): void {
    this.position.set(p.x, p.y);
    this.setHpPct(Math.min(1, Math.max(0, p.hp / GAME_CONSTANTS.MAX_HP)));
  }

  private setHpPct(pct: number): void {
    if (pct === this.lastHpPct) return; // Graphics redraw re-tessellates; skip when unchanged
    this.lastHpPct = pct;
    this.hpFill.clear();
    if (pct > 0) {
      this.hpFill.roundRect(0, 0, HP_BAR_WIDTH * pct, HP_BAR_HEIGHT, 1).fill(0xff0000);
    }
  }
}
