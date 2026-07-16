import type { SpritesheetData } from 'pixi.js';
import type { Facing8 } from '../../../domain/player-view';
import idleSheetData from '../../../../assets/characters/warrior/idle/spritesheet.json';
import idleSheetUrl from '../../../../assets/characters/warrior/idle/spritesheet.png';
import walkSheetData from '../../../../assets/characters/warrior/walking/spritesheet.json';
import walkSheetUrl from '../../../../assets/characters/warrior/walking/spritesheet.png';

export interface CharacterSheet {
  url: string;
  data: SpritesheetData;
}

/** 8-direction cycles, packed as one row per facing, 4 frames each. */
export const IDLE_SHEET: CharacterSheet = {
  url: idleSheetUrl,
  data: idleSheetData as SpritesheetData,
};

export const WALK_SHEET: CharacterSheet = {
  url: walkSheetUrl,
  data: walkSheetData as SpritesheetData,
};

/** Sheet row order, top to bottom: clockwise from north (up-left follows up). */
export const SHEET_ROW_ORDER: readonly Facing8[] = [
  'up',
  'up-left',
  'left',
  'down-left',
  'down',
  'down-right',
  'right',
  'up-right',
];

export const SHEET_FRAMES_PER_ROW = 4;

export const BAR_WIDTH = 50;
export const BAR_HEIGHT = 5;
export const BODY_HEIGHT = 78; // on-screen size; source frames are ~120x160

export const IDLE_ANIMATION_SPEED = 0.05;
export const WALK_ANIMATION_SPEED = 0.15;
