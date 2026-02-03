import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AdminAnalyticsModule } from './modules/admin/admin-analytics.module';
import { GameModule } from './modules/game/game.module';
import { UserModule } from './modules/user/user.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TournamentModule } from './modules/tournament/tournament.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    WalletModule,
    GameModule,
    TournamentModule,
    AdminAnalyticsModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
