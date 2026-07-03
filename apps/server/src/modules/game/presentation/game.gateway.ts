import { Inject } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  GAME_CONSTANTS,
  MovePayload,
  ServerToClientEvents,
} from '@mmo/shared';
import { TOKEN_SERVICE, TokenService } from '../../auth/domain/ports/token.service';
import { GameService } from '../application/game.service';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

@WebSocketGateway({ cors: { origin: true } })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: GameServer;

  private snapshotTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly game: GameService,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  afterInit(): void {
    this.snapshotTimer = setInterval(() => {
      this.server.emit('snapshot', this.game.snapshot());
    }, 1000 / GAME_CONSTANTS.SNAPSHOT_RATE);
    // Nest has no gateway destroy hook symmetric to afterInit; the interval
    // lives as long as the process, which is fine for a game server.
    void this.snapshotTimer;
  }

  handleConnection(socket: GameSocket): void {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? this.tokens.verify(token) : null;
    if (!payload) {
      socket.disconnect(true);
      return;
    }
    this.game.join(socket.id, payload.username);
    socket.emit('welcome', { selfId: socket.id, map: this.game.mapSize });
  }

  handleDisconnect(socket: GameSocket): void {
    this.game.leave(socket.id);
  }

  @SubscribeMessage('move')
  onMove(socket: GameSocket, payload: MovePayload): void {
    if (
      typeof payload?.x !== 'number' ||
      typeof payload?.y !== 'number' ||
      !Number.isFinite(payload.x) ||
      !Number.isFinite(payload.y)
    ) {
      return;
    }
    this.game.setMoveTarget(socket.id, payload.x, payload.y);
  }
}
