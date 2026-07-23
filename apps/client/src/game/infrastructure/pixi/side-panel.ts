import gsap from 'gsap';
import { Container, Graphics, Point, Text } from 'pixi.js';
import type { PanelWidget } from './panels/panel-widget';

const PANEL_WIDTH = 56;
const PANEL_RADIUS = 8;
const TAB_WIDTH = 22;
const TAB_HEIGHT = 56;
const PADDING = 12;
/** Must match the trigger-icon size the panels build (see panels/skill-panel.ts). */
const ICON_SIZE = 32;
const ICON_SPACING = ICON_SIZE + 8;
const COLLAPSE_DURATION = 0.25;

/**
 * Collapsible icon strip anchored to the right screen edge: one trigger icon
 * per panel widget, stacked vertically; the popup bodies live elsewhere. A
 * tab sticks out on its left side; clicking it slides the strip on/off
 * screen. The tab itself always stays visible.
 */
export default class SidePanel extends Container {
  private readonly bg = new Graphics();
  private readonly icons = new Container();
  private readonly tab = new Container();
  private readonly tabArrow: Text;
  private collapsed = false;
  private screenWidth = 0;
  private screenHeight = 0;
  private panelHeight = PADDING * 2 + ICON_SIZE;

  constructor() {
    super();
    const body = new Container();
    // swallow clicks so the panel doesn't trigger world walk targets
    body.interactive = true;
    body.on('pointerdown', (e) => e.stopPropagation());

    this.icons.position.set(PADDING, PADDING);
    body.position.set(TAB_WIDTH, 0);
    body.addChild(this.bg, this.icons);

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

    // tab last so its rounded overlap sits above the body edge
    this.addChild(body, this.tab);
    this.redraw();
  }

  /** Kills in-flight collapse tweens; the display tree is torn down by Pixi's destroy(). */
  dispose(): void {
    gsap.killTweensOf(this);
  }

  /**
   * Mounts widget trigger icons into the strip, top-to-bottom in call order;
   * popup bodies go to popupLayer. The strip resizes to fit.
   */
  mountWidgets(panels: PanelWidget[], popupLayer: Container): void {
    panels.forEach((panel) => panel.mount(this.icons, popupLayer));
    this.icons.children.forEach((icon, index) => {
      icon.position.set(0, index * ICON_SPACING);
    });
    const count = Math.max(this.icons.children.length, 1);
    this.panelHeight = PADDING * 2 + count * ICON_SPACING - (ICON_SPACING - ICON_SIZE);
    this.redraw();
    this.applyPosition();
  }

  /** Anchors the strip to the right edge, vertically centered; call on init and every resize. */
  layout(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    gsap.killTweensOf(this);
    this.applyPosition();
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

  private redraw(): void {
    this.bg
      .clear()
      .roundRect(0, 0, PANEL_WIDTH, this.panelHeight, PANEL_RADIUS)
      .fill({ color: 0x000000, alpha: 0.6 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });
    this.tab.position.set(0, (this.panelHeight - TAB_HEIGHT) / 2);
  }

  /** No-op until layout() provides screen dimensions. */
  private applyPosition(): void {
    if (!this.screenWidth) return;
    this.position.set(this.targetX(), (this.screenHeight - this.panelHeight) / 2);
  }

  private targetX(): number {
    return this.collapsed
      ? this.screenWidth - TAB_WIDTH
      : this.screenWidth - TAB_WIDTH - PANEL_WIDTH;
  }
}
