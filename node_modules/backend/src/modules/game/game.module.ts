import { Module } from '@nestjs/common';
import { AdminAnalyticsModule } from '../admin/admin-analytics.module';
import { GameController } from './game.controller';
import { GameService } from './game.service';

@Module({
  imports: [AdminAnalyticsModule],
  controllers: [GameController],
  providers: [GameService]
})
export class GameModule {}
