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
