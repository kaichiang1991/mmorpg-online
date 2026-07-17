import { AnimatedSprite, Assets, Container, Graphics, Spritesheet, Text, Texture } from 'pixi.js';
import type { Facing8, PlayerAnimation, PlayerView } from '../../../domain/player-view';
import {
  ANIMATION_SHEET_FRAMES_PER_ROW,
  ANIMATION_SPEED,
  ATTACK_SHEET,
  BAR_HEIGHT,
  BAR_WIDTH,
  BODY_HEIGHT,
  type CharacterSheet,
  HURT_SHEET,
  IDLE_SHEET,
  SHEET_ROW_ORDER,
  WALK_SHEET,
} from './PlayerConfig';

type DirectionalTextures = Map<Facing8, Texture[]>;

/** frame_000 sorted by name; each row of SHEET_FRAMES_PER_ROW is one facing. */
const loadDirectionalSheet = async (
  sheet: CharacterSheet,
  animation: PlayerAnimation,
): Promise<DirectionalTextures> => {
  const texture = await Assets.load<Texture>(sheet.url);
  const parsed = new Spritesheet(texture, sheet.data);
  await parsed.parse();

  const frames = Object.keys(parsed.textures)
    .sort()
    .map((name) => parsed.textures[name]);
  const byFacing: DirectionalTextures = new Map();
  SHEET_ROW_ORDER.forEach((facing, row) => {
    byFacing.set(
      facing,
      frames.slice(
        row * ANIMATION_SHEET_FRAMES_PER_ROW[animation],
        (row + 1) * ANIMATION_SHEET_FRAMES_PER_ROW[animation],
      ),
    );
  });
  return byFacing;
};

/** Populated once by preloadPlayerAssets; sprites only read from it. */
const textures = new Map<PlayerAnimation, DirectionalTextures>();

export const preloadPlayerAssets = async (): Promise<void> => {
  const [idle, walk, attack] = await Promise.all([
    loadDirectionalSheet(IDLE_SHEET, 'idle'),
    loadDirectionalSheet(WALK_SHEET, 'walk'),
    loadDirectionalSheet(ATTACK_SHEET, 'attack'),
    loadDirectionalSheet(HURT_SHEET, 'hurt'),
  ]);
  textures.set('idle', idle);
  textures.set('walk', walk);
  textures.set('attack', attack);
  textures.set('hurt', attack);
};

const texturesFor = (animation: PlayerAnimation, facing: Facing8): Texture[] =>
  textures.get(animation)?.get(facing) ?? [Texture.EMPTY];

/** One horizontal stat bar: white track, colored fill sized by percentage. */
class StatBar extends Container {
  private readonly fill = new Graphics();
  private lastPercentage = -1;
  private readonly valueDisplay = new Text({
    text: '',
    position: { x: BAR_WIDTH / 2, y: 0 },
    anchor: { x: 0.5, y: 0 },
    style: {
      fontSize: BAR_HEIGHT,
      fill: 0xffffff,
      align: 'center',
    },
  });

  constructor(
    private readonly color: number,
    private isReversed: boolean = false,
  ) {
    super();

    const defaultColor = { r: 1, g: 1, b: 1, a: isReversed ? 0 : 1 };
    this.addChild(
      new Graphics().roundRect(0, 0, BAR_WIDTH, BAR_HEIGHT, 1).fill(defaultColor),
      this.fill,
      this.valueDisplay,
    );
    this.pivot.set(BAR_WIDTH / 2, 0);
  }

  setPercentage(percentage: number): void {
    // todo: remain hp display
    percentage = Math.min(1, Math.max(0, percentage));

    if (percentage === this.lastPercentage) return; // Graphics redraw re-tessellates; skip when unchanged
    this.lastPercentage = percentage;
    this.fill.clear();
    if (percentage > 0) {
      const width = this.isReversed ? BAR_WIDTH * (1 - percentage) : BAR_WIDTH * percentage;
      this.fill.roundRect(0, 0, width, BAR_HEIGHT, 1).fill(this.color);
    }
  }
}

/**
 * One player's avatar: body, name label, hp/mp bars. Owns its look only —
 * what to show (facing, animation, percentages) arrives precomputed in the
 * PlayerView; lifecycle (create/destroy) and click wiring belong to PlayerLayer.
 */
export class PlayerSprite extends Container {
  private readonly body: AnimatedSprite;
  private animation: PlayerAnimation = 'idle';
  private facing: Facing8 = 'down';
  private readonly hpBar = new StatBar(0xff0000);
  private readonly mpBar = new StatBar(0x3b82f6);
  private readonly castingBar = new StatBar(0x00ff00, true);

  constructor(name: string, isSelf: boolean) {
    super();

    this.body = new AnimatedSprite(texturesFor(this.animation, this.facing));
    this.body.anchor.set(0.5);
    this.body.animationSpeed = ANIMATION_SPEED['idle'];
    this.fitBody();
    this.body.play();

    if (isSelf) {
      this.zIndex = 100;
    }

    // gold name marks your own character
    const nameLabel = new Text({
      text: name,
      style: { fontSize: 12, fill: isSelf ? 0xffd700 : 0xffffff, fontWeight: 'bold' },
    });
    nameLabel.anchor.set(0.5);
    nameLabel.y = -45;

    this.hpBar.y = BODY_HEIGHT / 2;
    this.mpBar.y = BODY_HEIGHT / 2 + BAR_HEIGHT;

    this.castingBar.y = -BODY_HEIGHT + 10;

    this.addChild(this.body, nameLabel, this.hpBar, this.mpBar, this.castingBar);
  }

  /** Sync visuals to the latest view; called every frame. */
  update(view: PlayerView): void {
    this.setPose(view.animation, view.facing);
    this.position.set(view.x, view.y);
    this.hpBar.setPercentage(view.hpPct);
    this.mpBar.setPercentage(view.mpPct);
    this.castingBar.setPercentage(view.castPct);
  }

  private setPose(animation: PlayerAnimation, facing: Facing8): void {
    if (animation === this.animation && facing === this.facing) return;
    this.animation = animation;
    this.facing = facing;

    this.body.textures = texturesFor(animation, facing);
    this.body.animationSpeed = ANIMATION_SPEED[this.animation];
    this.body.loop = this.animation !== 'attack' && this.animation !== 'hurt';
    this.fitBody();
    this.body.play(); // assigning textures stops the sprite
  }

  /** Sheets may differ in resolution; keep BODY_HEIGHT on screen. */
  private fitBody(): void {
    this.body.scale.set(BODY_HEIGHT / this.body.texture.height);
  }
}
