import { Assets, Spritesheet, Texture } from 'pixi.js';
import type { CharacterSheet } from './PlayerConfig';

/** Vite keeps png/json as separate imports; this pairs them back into name-ordered frames. */
export const loadSheetFrames = async ({ url, data }: CharacterSheet): Promise<Texture[]> => {
  const texture = await Assets.load<Texture>(url);
  const sheet = new Spritesheet(texture, data);
  await sheet.parse();
  return Object.keys(sheet.textures)
    .sort()
    .map((name) => sheet.textures[name]);
};
