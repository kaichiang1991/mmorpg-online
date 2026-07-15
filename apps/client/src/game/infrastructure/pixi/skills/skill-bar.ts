import { Container } from 'pixi.js';
import { SkillId } from '@mmo/shared';
import { SkillBarVo } from '../../../domain/value-objects/skill-bar.vo';
import SkillSprite, { SLOT_GAP, SLOT_SIZE } from './SkillSprite';

/** Bottom skill bar: slot sprites, click/hotkey selection, cooldown overlays. */
export default class SkillBar extends Container {
  private skillSelectHandler?: (index: number) => void;

  // hotkey → slot index: keys 1-9 → slots 0-8, key 0 → slot 9 (inverse of the slot label)
  private readonly handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat || !/^[0-9]$/.test(e.key)) return;
    this.skillSelectHandler?.((Number(e.key) + 9) % 10);
  };

  constructor() {
    super();
    this.interactive = true;
    window.addEventListener('keydown', this.handleKeyDown);
  }

  /** Removes the window hotkey listener; the display tree is torn down by Pixi's destroy(). */
  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  init(skillBar: SkillBarVo): void {
    this.removeChildren().forEach((child) => child.destroy({ children: true }));

    for (let i = 0; i < skillBar.length; i++) {
      this.addChild(new SkillSprite(i, skillBar.at(i)));
    }

    // pivot at bar center so the owner positions it by its midpoint
    const barWidth = skillBar.length * SLOT_SIZE + (skillBar.length - 1) * SLOT_GAP;
    this.pivot.set(barWidth / 2, 0);

    this.bindSkillSelect();
  }

  onSkillSelect(handler: (index: number) => void): void {
    this.skillSelectHandler = handler;
    this.bindSkillSelect();
  }

  /** Highlights every slot holding `skillId` (same skill in two slots is one selection); null clears everything. */
  renderSelectedSkill(skillId: SkillId | null): void {
    this.skillSlots.forEach((slot) =>
      slot.setSelected(skillId !== null && slot.skillId === skillId),
    );
  }

  renderProcess(processes: number[]): void {
    this.skillSlots.forEach((slot, index) => slot.renderProcess(processes[index] ?? 1));
  }

  /** Rebinds onClick on current slots; init recreates them so listeners are lost. */
  private bindSkillSelect(): void {
    if (!this.skillSelectHandler) return;
    const handler = this.skillSelectHandler;
    this.skillSlots.forEach((slot, index) => slot.onClick(() => handler(index)));
  }

  private get skillSlots(): SkillSprite[] {
    return this.getChildrenByLabel('skill') as SkillSprite[];
  }
}
