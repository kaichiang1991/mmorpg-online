/**
 * Client-side view of a player in the game world.
 * A projection of server state — the server is authoritative, so this
 * carries no invariants, only the data the client renders and reasons about.
 */
export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  mp: number;
}
