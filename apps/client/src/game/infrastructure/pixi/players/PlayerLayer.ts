import { Container } from 'pixi.js';
import type { PlayerView } from '../../../domain/player-view';
import { PlayerSprite } from './PlayerSprite';

/**
 * Draws player avatars. Stateful: keeps one sprite per player id and
 * reconciles the map against the view list each frame — creating
 * sprites for newcomers and destroying those who left the world.
 */
export class PlayerLayer {
  readonly container = new Container();
  private readonly sprites = new Map<string, PlayerSprite>();

  render(views: PlayerView[]): void {
    const seen = new Set<string>();

    for (const view of views) {
      seen.add(view.id);
      const sprite = this.sprites.get(view.id) ?? this.createSprite(view);
      sprite.update(view);
    }

    // remove sprites for players no longer in the world
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.destroy({ children: true });
        this.sprites.delete(id);
      }
    }
  }

  private createSprite(view: PlayerView): PlayerSprite {
    const sprite = new PlayerSprite(view.name, view.isSelf);
    if (!view.isSelf) {
      // hover affordance only — clicks bubble to the stage and are dispatched
      // by hitTestWorld in the application layer
      sprite.eventMode = 'static';
      sprite.cursor = 'pointer';
    }
    this.container.addChild(sprite);
    this.sprites.set(view.id, sprite);
    return sprite;
  }
}
