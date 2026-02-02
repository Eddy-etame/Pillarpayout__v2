import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('seasons/active')
  getActiveSeason() {
    return { success: true, data: this.appService.getActiveSeason() };
  }

  @Get('tournaments/current')
  getCurrentTournament() {
    return { success: true, data: this.appService.getCurrentTournament() };
  }

  @Get('tournaments/leaderboard')
  getLeaderboard(@Query('tournamentId') tournamentId: string) {
    return {
      success: true,
      data: this.appService.getLeaderboard(Number(tournamentId)),
    };
  }

  @Post('tournaments/score')
  recordScore(
    @Body() body: { tournamentId: number; userId: number; delta: number },
  ) {
    return {
      success: true,
      data: this.appService.recordScore(body.tournamentId, body.userId, body.delta),
    };
  }

  @Get('users/perks')
  getUserPerks(@Query('userId') userId: string) {
    return { success: true, data: this.appService.getUserPerks(Number(userId)) };
  }
}
