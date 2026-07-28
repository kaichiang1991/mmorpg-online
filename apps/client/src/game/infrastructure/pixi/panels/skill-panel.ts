import { Assets, Container, Sprite } from 'pixi.js';
import { BasePanel } from './base-panel';
import skillIcon from '../../../../assets/icons/skill.png';

const ICON_SIZE = 32;

export class SkillPanel extends BasePanel {
  constructor() {
    super({ title: 'Skills', width: 800, height: 800 });
  }

  protected buildIcon(icon: Container): void {
    Assets.load(skillIcon).then((r) => {
      const iconSprite = Sprite.from(r);
      iconSprite.width = ICON_SIZE;
      iconSprite.height = ICON_SIZE;
      icon.addChild(iconSprite);
    });
  }

  protected buildContent(_content: Container): void {
    // skill grid goes here
  }
}
