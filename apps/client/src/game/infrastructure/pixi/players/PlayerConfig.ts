import type { SpritesheetData } from 'pixi.js';
import type { Facing8 } from '../../../domain/player-view';
import walkSheetData from '../../../../assets/characters/warrior/walking/spritesheet.json';
import walkSheetUrl from '../../../../assets/characters/warrior/walking/spritesheet.png';

const warriorModules = import.meta.glob<{ default: string }>(
  '../../../../assets/characters/warrior_*.png',
  { eager: true },
);

export const WARRIOR_MAP: Map<string, string> = new Map(
  Object.entries(warriorModules).map(([path, module]) => [
    path.split('/').pop() as string,
    module.default,
  ]),
);

/** 8-direction walk cycle, packed as one row per facing, 4 frames each. */
export const WALK_SHEET = {
  url: walkSheetUrl,
  data: walkSheetData as SpritesheetData,
};

/** Sheet row order, top to bottom: clockwise from north (up-left follows up). */
export const WALK_ROW_ORDER: readonly Facing8[] = [
  'up',
  'up-left',
  'left',
  'down-left',
  'down',
  'down-right',
  'right',
  'up-right',
];

export const WALK_FRAMES_PER_ROW = 4;

export const BAR_WIDTH = 50;
export const BAR_HEIGHT = 5;
export const BODY_HEIGHT = 78; // on-screen size; idle source texture is 49x78

export const IDLE_ANIMATION_SPEED = 0.05;
export const WALK_ANIMATION_SPEED = 0.15;
