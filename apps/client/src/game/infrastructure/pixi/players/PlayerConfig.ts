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

export const BAR_WIDTH = 50;
export const BAR_HEIGHT = 5;
export const BODY_HEIGHT = 78; // on-screen size; source texture is 49x78

export const IDLE_ANIMATION_SPEED = 0.05;
// walk reuses the idle frames until dedicated walk assets land; the faster
// cycle keeps the state switch visible in the meantime
export const WALK_ANIMATION_SPEED = 0.15;
