import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import { BasePanel } from './base-panel';
import skillIcon from '../../../../assets/icons/skill.png';

const ICON_SIZE = 32;
const POPUP_WIDTH = 200;
const POPUP_HEIGHT = 260;
const POPUP_RADIUS = 8;
const CONTENT_PADDING = 12;

export class SkillPanel extends BasePanel {
  protected buildIcon(icon: Container): void {
    Assets.load(skillIcon).then((r) => {
      const iconSprite = Sprite.from(r);
      iconSprite.width = ICON_SIZE;
      iconSprite.height = ICON_SIZE;
      icon.addChild(iconSprite);
    });
  }

  protected buildPopup(popup: Container): void {
    // swallow clicks so the popup doesn't trigger world walk targets
    popup.interactive = true;
    popup.on('pointerdown', (e) => e.stopPropagation());

    const bg = new Graphics()
      .roundRect(0, 0, POPUP_WIDTH, POPUP_HEIGHT, POPUP_RADIUS)
      .fill({ color: 0x000000, alpha: 0.6 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });

    const title = new Text({
      text: 'Skills',
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
    });
    title.position.set(CONTENT_PADDING, 10);

    popup.addChild(bg, title);
  }

  layout(screenWidth: number, screenHeight: number): void {
    this.popup.position.set((screenWidth - POPUP_WIDTH) / 2, (screenHeight - POPUP_HEIGHT) / 2);
  }
}
