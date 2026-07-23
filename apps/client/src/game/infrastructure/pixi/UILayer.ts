import { Container, Graphics, Text } from 'pixi.js';
import { SkillId } from '@mmo/shared';
import { SkillBarVo } from '../../domain/value-objects/skill-bar.vo';
import SkillBar from './skills/skill-bar';
import { SLOT_SIZE } from './skills/SkillSprite';
import SidePanel from './side-panel';
import { PanelFactory } from './panels/panel-factory';

const BAR_BOTTOM_MARGIN = 16;

export default class UILayer {
  readonly container = new Container();

  private readonly skillBar = new SkillBar();
  private readonly sidePanel = new SidePanel();
  private readonly panels = new PanelFactory();
  private readonly popupLayer = new Container();

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
    this.container.addChild(this.skillBar, this.sidePanel, this.popupLayer, debugPanel);
  }

  destroy(): void {
    this.skillBar.dispose();
    this.sidePanel.dispose();
    this.panels.destroyAll();
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
    this.skillBar.init(skillBar);
    this.sidePanel.mountWidgets([this.panels.create('skills')], this.popupLayer);
  }

  /** Anchors the skill bar bottom-center and the side panel right-center; call on init and every resize. */
  layout(screenWidth: number, screenHeight: number): void {
    this.skillBar.position.set(screenWidth / 2, screenHeight - SLOT_SIZE - BAR_BOTTOM_MARGIN);
    this.sidePanel.layout(screenWidth, screenHeight);
    this.panels.layoutAll(screenWidth, screenHeight);
  }

  onSkillSelect(handler: (index: number) => void) {
    this.skillBar.onSkillSelect(handler);
  }

  renderSelectedSkill(skillId: SkillId | null): void {
    this.skillBar.renderSelectedSkill(skillId);
  }

  renderSkillProcess(processes: number[]) {
    this.skillBar.renderProcess(processes);
  }
}
