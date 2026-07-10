import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { SkillEffectKey, SkillVo } from '../../../domain/value-objects/skill-bar.vo';
import { SKILL_EFFECT, SKILL_EFFECTS } from './SkillConfig';

export const SLOT_SIZE = 48;
export const SLOT_GAP = 4;
const SLOT_RADIUS = 6;
const SELECTED_COLOR = 0xffd700;

const LOADED_EFFECTS = new Map<SkillEffectKey, SKILL_EFFECT>();
export const preloadSkillAssets = async (): Promise<void> => {
  await Promise.all(
    (Object.entries(SKILL_EFFECTS) as [SkillEffectKey, Promise<SKILL_EFFECT>][]).map(
      async ([key, effect]) => {
        LOADED_EFFECTS.set(key, await effect);
      },
    ),
  );
};

export default class SkillSprite extends Container {
  private readonly selectedBorder: Graphics;

  constructor(index: number, skill: SkillVo) {
    super();
    this.label = 'skill';
    this.interactive = true;
    this.position.set(index * (SLOT_SIZE + SLOT_GAP), 0);

    const background = new Graphics()
      .roundRect(0, 0, SLOT_SIZE, SLOT_SIZE, SLOT_RADIUS)
      .fill({ color: 0x000000, alpha: 0.45 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });
    this.addChild(background);

    // hotkey label: slots 0-8 → keys 1-9, slot 9 → key 0
    const hotKeyText = new Text({
      text: `${(index + 1) % 10}`,
      style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
    });
    hotKeyText.alpha = 0.6;
    hotKeyText.position.set(4, 3);
    this.addChild(hotKeyText);

    const effect = skill.effectKey ? LOADED_EFFECTS.get(skill.effectKey) : undefined;
    if (effect) {
      const icon = Sprite.from(effect.icon);
      // contain-fit: scale down to fit inside the slot, keep aspect ratio
      const scale = Math.min(SLOT_SIZE / icon.texture.width, SLOT_SIZE / icon.texture.height);
      icon.scale.set(scale);
      icon.anchor.set(0.5);
      icon.position.set(SLOT_SIZE / 2, SLOT_SIZE / 2);
      this.addChild(icon);
    }

    // added last so it draws above the slot content
    this.selectedBorder = new Graphics()
      .roundRect(0, 0, SLOT_SIZE, SLOT_SIZE, SLOT_RADIUS)
      .stroke({ width: 2, color: SELECTED_COLOR });
    this.selectedBorder.visible = false;
    this.addChild(this.selectedBorder);
  }

  onClick(handler: () => void) {
    this.on('pointerdown', (e) => {
      e.stopPropagation();
      handler();
    });
  }

  setSelected(selected: boolean) {
    this.selectedBorder.visible = selected;
  }
}
