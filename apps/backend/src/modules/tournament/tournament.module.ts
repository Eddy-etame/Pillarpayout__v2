import { Module } from '@nestjs/common';
import { AdminAnalyticsModule } from '../admin/admin-analytics.module';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';

@Module({
  imports: [AdminAnalyticsModule],
  controllers: [TournamentController],
  providers: [TournamentService]
})
export class TournamentModule {}
