import gsap from 'gsap';
import { AnimatedSprite, Texture } from 'pixi.js';
import { BODY_HEIGHT, HALO_LOOP_SHEET, HALO_START_SHEET } from './PlayerConfig';
import { loadSheetFrames } from './load-sheet-frames';

type HaloPhase = 'start' | 'loop';

/** Halo frames shared by every player; populated once via preloadHaloAssets. */
const haloTextures = new Map<HaloPhase, Texture[]>();

const texturesFor = (phase: HaloPhase): Texture[] => haloTextures.get(phase) ?? [Texture.EMPTY];

/** Awaited inside preloadPlayerAssets, so frames are ready before any sprite is created. */
export const preloadHaloAssets = async (): Promise<void> => {
  const [start, loop] = await Promise.all([
    loadSheetFrames(HALO_START_SHEET),
    loadSheetFrames(HALO_LOOP_SHEET),
  ]);
  haloTextures.set('start', start);
  haloTextures.set('loop', loop);
};

/**
 * Casting glow around a player: hidden while idle; a cast plays the intro
 * once, chains into a pulsing loop, and hides again when the cast ends.
 * Owns its whole state machine — callers only feed it setCasting() per frame.
 */
export class CastingHalo extends AnimatedSprite {
  private casting = false;

  constructor() {
    super(texturesFor('start'));
    this.anchor.set(0.5);
    this.animationSpeed = 0.1;
    this.blendMode = 'screen';
    this.visible = false;
    this.fit();
  }

  setCasting(casting: boolean): void {
    if (casting === this.casting) return;
    this.casting = casting;

    if (casting) {
      this.textures = texturesFor('start');
      this.loop = false;
      this.onComplete = () => {
        this.textures = texturesFor('loop');
        this.loop = true;
        this.fit();
        this.play();

        this.alpha = 1;
        gsap.to(this, {
          alpha: 0.7,
          duration: 1,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      };
      this.fit();
      this.visible = true;
      this.play();
    } else {
      this.onComplete = undefined;
      this.stop();
      this.visible = false;
      gsap.killTweensOf(this);
      this.alpha = 1;
    }
  }

  private fit(): void {
    this.scale.set(BODY_HEIGHT / this.texture.height);
  }

  /** The pulse tween is infinite; without this, gsap would keep ticking a destroyed sprite. */
  override destroy(options?: Parameters<AnimatedSprite['destroy']>[0]): void {
    gsap.killTweensOf(this);
    super.destroy(options);
  }
}
