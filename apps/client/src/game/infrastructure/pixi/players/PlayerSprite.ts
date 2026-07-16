import { AnimatedSprite, Assets, Container, Graphics, Text, Texture } from 'pixi.js';
import type { PlayerAnimation, PlayerView } from '../../../domain/player-view';
import {
  BAR_HEIGHT,
  BAR_WIDTH,
  BODY_HEIGHT,
  IDLE_ANIMATION_SPEED,
  WALK_ANIMATION_SPEED,
  WARRIOR_MAP,
} from './PlayerConfig';

export const preloadPlayerAssets = async (): Promise<void> => {
  const allTextures = [...WARRIOR_MAP.entries()];
  await Assets.load(allTextures.map(([alias, url]) => ({ alias, src: url })));
};

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
  private readonly texturesByAnimation: Record<PlayerAnimation, Texture[]>;
  private readonly bodyScale: number;
  private animation: PlayerAnimation = 'idle';
  private readonly hpBar = new StatBar(0xff0000);
  private readonly mpBar = new StatBar(0x3b82f6);
  private readonly castingBar = new StatBar(0x00ff00, true);

  constructor(name: string, isSelf: boolean) {
    super();

    const idle = texturesMatching(/idle/);
    // no dedicated walk assets yet — reuse idle so the state machine is ready
    const walk = texturesMatching(/walk/);
    this.texturesByAnimation = { idle, walk: walk.length > 0 ? walk : idle };

    this.body = new AnimatedSprite(idle);
    this.body.anchor.set(0.5);
    this.bodyScale = BODY_HEIGHT / this.body.texture.height;
    this.body.scale.set(this.bodyScale);
    this.body.animationSpeed = IDLE_ANIMATION_SPEED;
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
    this.body.scale.x = view.facing * this.bodyScale;
    this.setAnimation(view.animation);
    this.position.set(view.x, view.y);
    this.hpBar.setPercentage(view.hpPct);
    this.mpBar.setPercentage(view.mpPct);
    this.castingBar.setPercentage(view.castPct);
  }

  private setAnimation(animation: PlayerAnimation): void {
    if (animation === this.animation) return;
    this.animation = animation;
    this.body.textures = this.texturesByAnimation[animation];
    this.body.animationSpeed = animation === 'walk' ? WALK_ANIMATION_SPEED : IDLE_ANIMATION_SPEED;
    this.body.play(); // assigning textures stops the sprite
  }
}

const texturesMatching = (pattern: RegExp): Texture[] => {
  const textures: Texture[] = [];
  for (const key of WARRIOR_MAP.keys()) {
    if (pattern.test(key)) textures.push(Texture.from(key));
  }
  return textures;
};
