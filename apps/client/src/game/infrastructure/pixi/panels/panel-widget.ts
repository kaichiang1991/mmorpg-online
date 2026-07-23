import type { Container } from 'pixi.js';

/**
 * A sidebar-triggered popup widget: a small trigger icon living in the
 * sidebar and a popup body living on the top UI layer. Consumers depend on
 * this contract only; `BasePanel` is a convenience skeleton, not a requirement.
 */
export interface PanelWidget {
  /** Icon and popup attach to different parents — the two-layer reality is explicit. */
  mount(iconParent: Container, popupParent: Container): void;
  toggle(): void;
  /** Repositions the popup for the current screen size; call on init and every resize. */
  layout(screenWidth: number, screenHeight: number): void;
  destroy(): void;
}
