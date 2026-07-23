import type { PanelWidget } from './panel-widget';
import { BasePanel } from './base-panel';
import { SkillPanel } from './skill-panel';

export type PanelId = 'skills';

const creators: Record<PanelId, () => BasePanel> = {
  skills: () => new SkillPanel(),
};

export class PanelFactory {
  private readonly panels = new Map<PanelId, PanelWidget>();

  create(id: PanelId): PanelWidget {
    const existing = this.panels.get(id);
    if (existing) return existing;

    const panel = creators[id]().init();
    this.panels.set(id, panel);
    return panel;
  }

  get(id: PanelId): PanelWidget | undefined {
    return this.panels.get(id);
  }

  layoutAll(screenWidth: number, screenHeight: number): void {
    for (const panel of this.panels.values()) panel.layout(screenWidth, screenHeight);
  }

  destroyAll(): void {
    for (const panel of this.panels.values()) panel.destroy();
    this.panels.clear();
  }
}
