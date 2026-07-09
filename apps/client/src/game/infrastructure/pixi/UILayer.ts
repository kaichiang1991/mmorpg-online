import { Container, Graphics, Text } from 'pixi.js';
import { SkillBarVo } from '../../domain/value-objects/skill-bar.vo';
import SkillSprite, { SLOT_GAP, SLOT_SIZE } from './SkillSprite';

const BAR_BOTTOM_MARGIN = 16;

export default class UILayer {
  readonly container = new Container();

  private skillBarContainer: Container = new Container();
  private skillSelectHandler?: (index: number) => void;
  private readonly debugBg = new Graphics();
  private readonly debugText = new Text({
    text: '',
    anchor: { x: -0.05, y: 0 },
    style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
  });

  constructor() {
    const debugPanel = new Container();
    debugPanel.position.set(8, 8);
    this.debugText.position.set(6, 4);
    debugPanel.addChild(this.debugBg, this.debugText);
    this.container.addChild(this.skillBarContainer, debugPanel);
  }

  /** Debug panel at top-left: prints each entry as `key: value`, one per line. */
  renderDebug(values: Record<string, unknown>): void {
    const text = Object.entries(values)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('\n');
    if (this.debugText.text === text) return; // unchanged → skip bg redraw

    this.debugText.text = text;
    this.debugBg.clear();
    this.debugBg
      .roundRect(0, 0, this.debugText.width + 30, 80, 4)
      .fill({ color: 0x000000, alpha: 0.75 });
  }

  initPlayerPanel(skillBar: SkillBarVo) {
    this.skillBarContainer.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.skillBarContainer.interactive = true;

    for (let i = 0; i < skillBar.length; i++) {
      this.skillBarContainer.addChild(new SkillSprite(i, skillBar.at(i)));
    }

    // pivot at bar center so layout() positions it by its midpoint
    const barWidth = skillBar.length * SLOT_SIZE + (skillBar.length - 1) * SLOT_GAP;
    this.skillBarContainer.pivot.set(barWidth / 2, 0);

    this.bindSkillSelect();
  }

  /** Anchors the skill bar bottom-center; call on init and every resize. */
  layout(screenWidth: number, screenHeight: number): void {
    this.skillBarContainer.position.set(
      screenWidth / 2,
      screenHeight - SLOT_SIZE - BAR_BOTTOM_MARGIN,
    );
  }

  onSkillSelect(handler: (index: number) => void) {
    this.skillSelectHandler = handler;
    this.bindSkillSelect();
  }

  /** Rebinds onClick on current slots; initPlayerPanel recreates them so listeners are lost. */
  private bindSkillSelect() {
    if (!this.skillSelectHandler) return;
    const handler = this.skillSelectHandler;
    const slots = this.skillBarContainer.getChildrenByLabel('skill') as SkillSprite[];
    slots.forEach((slot, index) => slot.onClick(() => handler(index)));
  }
}
