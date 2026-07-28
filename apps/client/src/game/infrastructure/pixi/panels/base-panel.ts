import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { PanelWidget } from './panel-widget';

/** Trigger-icon leaf size for yoga layout in the side-panel icon strip. */
const ICON_SIZE = 32;
const POPUP_RADIUS = 8;
const TITLE_BAR_HEIGHT = 36;
const CONTENT_PADDING = 12;
const CLOSE_HIT_SIZE = 24;

export interface PanelOptions {
  title: string;
  width: number;
  height: number;
}

/**
 * Template-method skeleton for sidebar panels: owns the trigger icon, the
 * popup chrome (background, title bar, close button, centering) and the
 * open/close wiring. Subclasses only fill in content via
 * buildIcon/buildContent. Content is built in init(), not the constructor —
 * abstract methods called during a base constructor would run before
 * subclass fields initialize.
 */
export abstract class BasePanel implements PanelWidget {
  protected readonly icon = new Container();
  protected readonly popup = new Container();
  /** Body area below the title bar; (0,0) is its top-left, already padded. */
  protected readonly content = new Container();
  private isOpen = false;

  protected constructor(private readonly options: PanelOptions) {
    // Without a layout, yoga skips this child entirely and it sticks at (0,0).
    this.icon.layout = { width: ICON_SIZE, height: ICON_SIZE };
    this.icon.eventMode = 'static';
    this.icon.cursor = 'pointer';
    this.icon.on('pointerdown', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    this.popup.visible = false;
  }

  protected abstract buildIcon(icon: Container): void;
  protected abstract buildContent(content: Container): void;

  init(): this {
    this.buildIcon(this.icon);
    this.buildChrome();
    this.buildContent(this.content);
    return this;
  }

  private buildChrome(): void {
    const { title, width, height } = this.options;

    // swallow clicks so the popup doesn't trigger world walk targets
    this.popup.interactive = true;
    this.popup.on('pointerdown', (e) => e.stopPropagation());

    const bg = new Graphics()
      .roundRect(0, 0, width, height, POPUP_RADIUS)
      .fill({ color: 0x000000, alpha: 0.6 })
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });

    const titleText = new Text({
      text: title,
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
    });
    titleText.position.set(CONTENT_PADDING, (TITLE_BAR_HEIGHT - titleText.height) / 2);

    const closeButton = new Text({
      text: '✕',
      style: { fontSize: 14, fill: 0xffffff },
    });
    closeButton.anchor.set(0.5);
    closeButton.position.set(width - CONTENT_PADDING - CLOSE_HIT_SIZE / 2, TITLE_BAR_HEIGHT / 2);
    closeButton.eventMode = 'static';
    closeButton.cursor = 'pointer';
    closeButton.hitArea = new Rectangle(
      -CLOSE_HIT_SIZE / 2,
      -CLOSE_HIT_SIZE / 2,
      CLOSE_HIT_SIZE,
      CLOSE_HIT_SIZE,
    );
    closeButton.on('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
    });

    this.content.position.set(CONTENT_PADDING, TITLE_BAR_HEIGHT);

    this.popup.addChild(bg, titleText, closeButton, this.content);
  }

  mount(iconParent: Container, popupParent: Container): void {
    iconParent.addChild(this.icon);
    popupParent.addChild(this.popup);
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.isOpen = true;
    this.popup.visible = true;
  }

  close(): void {
    this.isOpen = false;
    this.popup.visible = false;
  }

  layout(screenWidth: number, screenHeight: number): void {
    this.popup.position.set(
      (screenWidth - this.options.width) / 2,
      (screenHeight - this.options.height) / 2,
    );
  }

  destroy(): void {
    this.icon.destroy({ children: true });
    this.popup.destroy({ children: true });
  }
}
