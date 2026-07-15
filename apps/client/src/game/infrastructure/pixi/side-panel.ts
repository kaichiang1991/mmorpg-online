import gsap from 'gsap';
import { Container, Graphics, Point, Sprite, Text } from 'pixi.js';
import { SkillId } from '@mmo/shared';
import { SkillVo } from '../../domain/value-objects/skill-bar.vo';
import { getSkillEffect } from './skills/SkillConfig';
import SkillPanel from './skill-panel';

const PANEL_WIDTH = 200;
const PANEL_HEIGHT = 260;
const PANEL_RADIUS = 8;
const TAB_WIDTH = 22;
const TAB_HEIGHT = 56;
const CONTENT_TOP = 40; // below the title
const CONTENT_PADDING = 12;
const ICON_SIZE = 40;
const ENTRY_HEIGHT = 48;
const COLLAPSE_DURATION = 0.25;

/**
 * Collapsible panel anchored to the right screen edge. A tab sticks out on
 * its left side; clicking it slides the body on/off screen. The tab itself
 * always stays visible.
 */
export default class SidePanel extends Container {
  private readonly entries = new Container();
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

    const title = new Text({
      text: 'Skills',
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
    });
    title.position.set(CONTENT_PADDING, 10);

    this.entries.position.set(CONTENT_PADDING, CONTENT_TOP);
    body.position.set(TAB_WIDTH, 0);
    body.addChild(bg, title, this.entries);

    const tab = new Container();
    tab.interactive = true;
    tab.cursor = 'pointer';
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
    tab.addChild(tabBg, this.tabArrow);
    tab.position.set(0, (PANEL_HEIGHT - TAB_HEIGHT) / 2);
    tab.on('pointerdown', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // tab last so its rounded overlap sits above the body edge
    this.addChild(body, tab);
  }

  /** Kills in-flight collapse tweens; the display tree is torn down by Pixi's destroy(). */
  dispose(): void {
    gsap.killTweensOf(this);
  }

  init() {
    new SkillPanel().addTriggerTo(this.entries);
  }

  /** Replaces the listed skills; empty slots are skipped. */
  renderSkills(skills: SkillVo[]): void {
    this.entries.removeChildren().forEach((child) => child.destroy({ children: true }));

    skills
      .filter((skill): skill is SkillVo & { readonly id: SkillId } => skill.hasSkill())
      .forEach((skill, index) => {
        this.entries.addChild(this.createEntry(skill, index));
      });
  }

  /** Anchors the panel to the right edge, vertically centered; call on init and every resize. */
  layout(screenWidth: number, screenHeight: number): void {
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

  private createEntry(skill: SkillVo & { readonly id: SkillId }, index: number): Container {
    const entry = new Container();
    entry.position.set(0, index * ENTRY_HEIGHT);

    const slot = new Graphics()
      .roundRect(0, 0, ICON_SIZE, ICON_SIZE, 6)
      .fill({ color: 0x000000, alpha: 0.45 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });
    entry.addChild(slot);

    const effect = getSkillEffect(skill.id);
    if (effect) {
      const icon = Sprite.from(effect.icon);
      // contain-fit: scale down to fit inside the slot, keep aspect ratio
      const scale = Math.min(ICON_SIZE / icon.texture.width, ICON_SIZE / icon.texture.height);
      icon.scale.set(scale);
      icon.anchor.set(0.5);
      icon.position.set(ICON_SIZE / 2, ICON_SIZE / 2);
      entry.addChild(icon);
    }

    const name = new Text({
      text: skill.name,
      style: { fontSize: 12, fill: 0xffffff },
    });
    name.position.set(ICON_SIZE + 8, (ICON_SIZE - name.height) / 2);
    entry.addChild(name);

    return entry;
  }
}
