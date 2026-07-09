import { Container } from 'pixi.js';
import type { Player } from '../../../domain/player';
import { PlayerSprite } from './PlayerSprite';

/**
 * Draws player avatars. Stateful: keeps one sprite per player id and
 * reconciles the map against the player list each frame — creating
 * sprites for newcomers and destroying those who left the world.
 */
export class PlayerLayer {
  readonly container = new Container();
  private readonly sprites = new Map<string, PlayerSprite>();

  render(players: Player[], selfId: string | null): void {
    const seen = new Set<string>();

    for (const p of players) {
      seen.add(p.id);
      const sprite = this.sprites.get(p.id) ?? this.createSprite(p.id, p.name, p.id === selfId);
      sprite.update(p);
    }

    // remove sprites for players no longer in the world
    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) {
        sprite.destroy({ children: true });
        this.sprites.delete(id);
      }
    }
  }

  private createSprite(id: string, name: string, isSelf: boolean): PlayerSprite {
    const sprite = new PlayerSprite(name, isSelf);
    if (!isSelf) {
      // hover affordance only — clicks bubble to the stage and are dispatched
      // by hitTestWorld in the application layer
      sprite.eventMode = 'static';
      sprite.cursor = 'pointer';
    }
    this.container.addChild(sprite);
    this.sprites.set(id, sprite);
    return sprite;
  }
}
