import { Assets, Spritesheet, Texture } from 'pixi.js';
import type { SkillId } from '@mmo/shared';

import attackIconPng from '../../../../assets/icons/attack.png';
import fireballPng from '../../../../assets/fireball/spritesheet.png';
import fireballJson from '../../../../assets/fireball/spritesheet.json';
import fireballIconPng from '../../../../assets/fireball/icon.png';

export interface SKILL_EFFECT {
  spriteSheet?: Spritesheet;
  frames?: Texture[];
  icon: Texture;
}

const ATTACK: Promise<SKILL_EFFECT> = (async () => {
  const icon = await Assets.load<Texture>(attackIconPng);
  return { icon };
})();

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

/** Effect assets keyed by skill id; Partial because not every skill has assets yet. */
export const SKILL_EFFECTS: Partial<Record<SkillId, Promise<SKILL_EFFECT>>> = {
  basic: ATTACK,
  fireball: FIREBALL,
};
