import fireballPng from '../../../../assets/fireball/spritesheet.png';
import fireballJson from '../../../../assets/fireball/spritesheet.json';
import fireballIconPng from '../../../../assets/fireball/icon.png';
import { Assets, Spritesheet, Texture } from 'pixi.js';
import type { SkillEffectKey } from '../../../domain/value-objects/skill-bar.vo';

export interface SKILL_EFFECT {
  spriteSheet: Spritesheet;
  frames: Texture[];
  icon: Texture;
}

const FIREBALL: Promise<SKILL_EFFECT> = (async () => {
  const [spriteTexture, iconTexture] = await Promise.all([
    Assets.load<Texture>(fireballPng),
    Assets.load<Texture>(fireballIconPng),
  ]);
  const fireballSheet = new Spritesheet(spriteTexture, fireballJson);
  await fireballSheet.parse();

  const frames = Object.values(fireballSheet.textures);

  return {
    spriteSheet: fireballSheet,
    frames,
    icon: iconTexture,
  };
})();

/** Effect assets keyed by SkillVo.effectKey; look up textures here at render time. */
export const SKILL_EFFECTS: Record<SkillEffectKey, Promise<SKILL_EFFECT>> = {
  fireball: FIREBALL,
};
