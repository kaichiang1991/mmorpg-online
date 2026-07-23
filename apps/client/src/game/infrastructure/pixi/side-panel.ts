import gsap from 'gsap';
import { Container, Graphics, Point, Text } from 'pixi.js';
import type { PanelWidget } from './panels/panel-widget';

const PANEL_WIDTH = 108;
const PANEL_HEIGHT = 260;
const PANEL_RADIUS = 8;
const TAB_WIDTH = 22;
const TAB_HEIGHT = 56;
const PADDING = 12;
const ICON_GAP = 8;
const COLLAPSE_DURATION = 0.25;

/**
 * Collapsible icon strip anchored to the right screen edge: one trigger icon
 * per panel widget, flex-centered vertically inside a fixed-height body; the
 * popup bodies live elsewhere. A tab sticks out on its left side; clicking
 * it slides the strip on/off screen. The tab itself always stays visible.
 */
export default class SidePanel extends Container {
  private readonly icons = new Container();
  private readonly tab = new Container();
  private readonly tabArrow: Text;
  private collapsed = false;
  private screenWidth = 0;

  constructor() {
    super();
    const body = new Container();
    // swallow clicks so the panel doesn't trigger world walk targets
    body.interactive = true;
    body.on('pointerdown', (e) => e.stopPropagation());

    const bg = new Graphics()
      .roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS)
      .fill({ color: 0x000000, alpha: 0.6 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });

    // yoga flex column: icons stack top-down, centered in the fixed height
    this.icons.layout = {
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: ICON_GAP,
      padding: PADDING,
    };

    body.position.set(TAB_WIDTH, 0);
    body.addChild(bg, this.icons);

    this.tab.interactive = true;
    this.tab.cursor = 'pointer';
    const tabBg = new Graphics()
      .roundRect(0, 0, TAB_WIDTH + PANEL_RADIUS, TAB_HEIGHT, PANEL_RADIUS)
      .fill({ color: 0x000000, alpha: 0.6 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });
    this.tabArrow = new Text({
      text: '▶',
      anchor: new Point(0, 0.5),
      style: { fontSize: 12, fill: 0xffffff },
    });
    this.tabArrow.position.set(TAB_WIDTH / 2, TAB_HEIGHT / 2);
    this.tab.addChild(tabBg, this.tabArrow);
    this.tab.on('pointerdown', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.tab.position.set(0, (PANEL_HEIGHT - TAB_HEIGHT) / 2);
    // tab last so its rounded overlap sits above the body edge
    this.addChild(body, this.tab);
  }

  /** Kills in-flight collapse tweens; the display tree is torn down by Pixi's destroy(). */
  dispose(): void {
    gsap.killTweensOf(this);
  }

  /**
   * Mounts widget trigger icons into the strip, top-to-bottom in call order;
   * popup bodies go to popupLayer. Yoga lays the icons out — each child only
   * needs its leaf size declared.
   */
  mountWidgets(panels: PanelWidget[], popupLayer: Container): void {
    panels.forEach((panel) => panel.mount(this.icons, popupLayer));
    const text = new Text({
      text: 'T',
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
      layout: { width: 32, height: 32 },

      label: 'TT',
    });
    this.icons.addChild(text);
  }

  /** Anchors the strip to the right edge, vertically centered; call on init and every resize. */
  resize(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth;
    gsap.killTweensOf(this);
    this.position.set(this.targetX(), (screenHeight - PANEL_HEIGHT) / 2);
  }

  private toggle(): void {
    this.collapsed = !this.collapsed;
    this.tabArrow.text = this.collapsed ? '◀' : '▶';
    gsap.to(this, {
      x: this.targetX(),
      duration: COLLAPSE_DURATION,
      ease: 'power2.out',
    });
  }

  private targetX(): number {
    return this.collapsed
      ? this.screenWidth - TAB_WIDTH
      : this.screenWidth - TAB_WIDTH - PANEL_WIDTH;
  }
}
