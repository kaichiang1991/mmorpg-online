import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GameService } from './application/game.service';
import { GameGateway } from './presentation/game.gateway';

@Module({
  imports: [AuthModule],
  providers: [GameService, GameGateway],
})
export class GameModule {}
