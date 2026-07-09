import { Container, Graphics, Text } from 'pixi.js';
import { SkillVo } from '../../domain/value-objects/skill-bar.vo';

export const SLOT_SIZE = 48;
const SLOT_RADIUS = 6;

// todo: load skill texture
export default class SkillSprite extends Container {
  constructor(hotKey: string, skill: SkillVo) {
    super();

    const background = new Graphics()
      .roundRect(0, 0, SLOT_SIZE, SLOT_SIZE, SLOT_RADIUS)
      .fill({ color: 0x000000, alpha: 0.45 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });
    this.addChild(background);

    const hotKeyText = new Text({
      text: hotKey,
      style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
    });
    hotKeyText.alpha = 0.6;
    hotKeyText.position.set(4, 3);
    this.addChild(hotKeyText);

    if (!skill.isEmpty) {
      // todo: 目前先用name代替, 之後換圖 (skill.imageUrl)
      const name = new Text({
        text: skill.name,
        style: { fontSize: 11, fill: 0xffffff },
      });
      name.anchor.set(0.5);
      name.position.set(SLOT_SIZE / 2, SLOT_SIZE / 2);
      this.addChild(name);
    }
  }

  setInteractive(interactive: boolean) {
    this.interactive = interactive;
  }

  selected() {}
}
