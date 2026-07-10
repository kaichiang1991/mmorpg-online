import fireballPng from '../../../../assets/fireball/spritesheet.png';
import fireballJson from '../../../../assets/fireball/spritesheet.json';
import { Assets, Spritesheet, Texture } from 'pixi.js';

export interface SKILL_EFFECT {
  spriteSheet: Spritesheet;
  frames: Texture[];
  icon: Texture;
}

const FIREBALL: Promise<SKILL_EFFECT> = (async () => {
  const texture = await Assets.load<Texture>(fireballPng);
  const fireballSheet = new Spritesheet(texture, fireballJson);
  await fireballSheet.parse();

  const frames = Object.values(fireballSheet.textures);

  return {
    spriteSheet: fireballSheet,
    frames,
    icon: frames[0], // todo: 單獨icon
  };
})();

export { FIREBALL };
