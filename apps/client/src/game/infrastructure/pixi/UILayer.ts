import { Container, Graphics, Text } from 'pixi.js';
import { SkillBarVo } from '../../domain/value-objects/skill-bar.vo';

const SLOT_SIZE = 48;
const SLOT_GAP = 4;
const SLOT_RADIUS = 6;
const BAR_BOTTOM_MARGIN = 16;

export default class UILayer {
  readonly container = new Container();

  private skillBarContainer: Container = new Container();
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

    const graphics = new Graphics();
    this.skillBarContainer.addChild(graphics);

    for (let i = 0; i < skillBar.length; i++) {
      const x = i * (SLOT_SIZE + SLOT_GAP);
      graphics
        .roundRect(x, 0, SLOT_SIZE, SLOT_SIZE, SLOT_RADIUS)
        .fill({ color: 0x000000, alpha: 0.45 })
        .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });

      // hotkey label: slots 0-8 → keys 1-9, slot 9 → key 0
      const hotkey = new Text({
        text: `${(i + 1) % 10}`,
        style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
      });
      hotkey.alpha = 0.6;
      hotkey.position.set(x + 4, 3);
      this.skillBarContainer.addChild(hotkey);

      const skill = skillBar.at(i);
      if (!skill.isEmpty) {
        // todo: 目前先用name代替, 之後換圖
        const name = new Text({
          text: skill.name,
          style: { fontSize: 11, fill: 0xffffff },
        });
        name.anchor.set(0.5);
        name.position.set(x + SLOT_SIZE / 2, SLOT_SIZE / 2);
        this.skillBarContainer.addChild(name);
      }
    }

    // pivot at bar center so layout() positions it by its midpoint
    const barWidth = skillBar.length * SLOT_SIZE + (skillBar.length - 1) * SLOT_GAP;
    this.skillBarContainer.pivot.set(barWidth / 2, 0);
  }

  /** Anchors the skill bar bottom-center; call on init and every resize. */
  layout(screenWidth: number, screenHeight: number): void {
    this.skillBarContainer.position.set(
      screenWidth / 2,
      screenHeight - SLOT_SIZE - BAR_BOTTOM_MARGIN,
    );
  }

  onSkillSelect(handler: (index: number) => void) {
    this.skillBarContainer.interactive = true;
    this.skillBarContainer.on('pointerdown', (event) => {
      event.stopPropagation();
      // global → bar-local; local space already accounts for position and pivot
      const local = this.skillBarContainer.toLocal(event.global);
      const index = Math.floor(local.x / (SLOT_SIZE + SLOT_GAP));
      handler(index);
    });
  }
}
