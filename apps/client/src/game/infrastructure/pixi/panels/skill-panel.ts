import { Container, Graphics, Text } from 'pixi.js';
import { BasePanel } from './base-panel';

const ICON_SIZE = 32;
const POPUP_WIDTH = 200;
const POPUP_HEIGHT = 260;
const POPUP_RADIUS = 8;
const CONTENT_PADDING = 12;

export class SkillPanel extends BasePanel {
  protected buildIcon(icon: Container): void {
    const bg = new Graphics()
      .roundRect(0, 0, ICON_SIZE, ICON_SIZE, 6)
      .fill({ color: 0x000000, alpha: 0.45 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });

    const label = new Text({
      text: 'S',
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
    });
    label.position.set((ICON_SIZE - label.width) / 2, (ICON_SIZE - label.height) / 2);

    icon.addChild(bg, label);
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
    this.popup.position.set(
      (screenWidth - POPUP_WIDTH) / 2,
      (screenHeight - POPUP_HEIGHT) / 2,
    );
  }
}
