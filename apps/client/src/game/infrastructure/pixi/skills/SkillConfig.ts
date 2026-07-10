import fireballPng from '../../../../assets/fireball/spritesheet.png';
import fireballJson from '../../../../assets/fireball/spritesheet.json';
import fireballIconPng from '../../../../assets/fireball/icon.png';
import { Assets, Spritesheet, Texture } from 'pixi.js';

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

export { FIREBALL };
