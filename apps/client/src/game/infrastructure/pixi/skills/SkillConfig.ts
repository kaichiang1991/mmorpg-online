import { Assets, Spritesheet, Texture } from 'pixi.js';
import type { SkillId } from '@mmo/shared';

import attackIcon from '../../../../assets/icons/attack.png';
// spear
import spearIcon from '../../../../assets/icons/spear.png';
// fireball
import fireballPng from '../../../../assets/fireball/spritesheet.png';
import fireballJson from '../../../../assets/fireball/spritesheet.json';
import fireballIcon from '../../../../assets/fireball/icon.png';

export interface SKILL_EFFECT {
  spriteSheet?: Spritesheet;
  frames?: Texture[];
  icon: Texture;
}

const ATTACK: Promise<SKILL_EFFECT> = (async () => {
  const icon = await Assets.load<Texture>(attackIcon);
  return { icon };
})();

const SPEAR: Promise<SKILL_EFFECT> = (async () => {
  const icon = await Assets.load<Texture>(spearIcon);
  return { icon };
})();

const FIREBALL: Promise<SKILL_EFFECT> = (async () => {
  const [spriteTexture, iconTexture] = await Promise.all([
    Assets.load<Texture>(fireballPng),
    Assets.load<Texture>(fireballIcon),
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
  spear: SPEAR,
  fireball: FIREBALL,
};
