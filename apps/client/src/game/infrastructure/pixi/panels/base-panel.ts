import { Container } from 'pixi.js';
import type { PanelWidget } from './panel-widget';

/**
 * Template-method skeleton for sidebar panels: owns the trigger icon, the
 * popup body and the open/close wiring. Subclasses only fill in content via
 * buildIcon/buildPopup. Content is built in init(), not the constructor —
 * abstract methods called during a base constructor would run before
 * subclass fields initialize.
 */
export abstract class BasePanel implements PanelWidget {
  protected readonly icon = new Container();
  protected readonly popup = new Container();
  private isOpen = false;

  constructor() {
    this.icon.eventMode = 'static';
    this.icon.cursor = 'pointer';
    this.icon.on('pointerdown', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    this.popup.visible = false;
  }

  protected abstract buildIcon(icon: Container): void;
  protected abstract buildPopup(popup: Container): void;

  init(): this {
    this.buildIcon(this.icon);
    this.buildPopup(this.popup);
    return this;
  }

  mount(iconParent: Container, popupParent: Container): void {
    iconParent.addChild(this.icon);
    popupParent.addChild(this.popup);
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.popup.visible = this.isOpen;
  }

  layout(_screenWidth: number, _screenHeight: number): void {}

  destroy(): void {
    this.icon.destroy({ children: true });
    this.popup.destroy({ children: true });
  }
}
