import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TournamentService } from './tournament.service';

@Controller()
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get('seasons/active')
  async getActiveSeason() {
    return { success: true, data: await this.tournamentService.getActiveSeason() };
  }

  @Get('tournaments/current')
  async getCurrentTournament() {
    return { success: true, data: await this.tournamentService.getCurrentTournament() };
  }

  @Get('tournaments/leaderboard')
  async getLeaderboard(@Query('tournamentId') tournamentId: string) {
    return {
      success: true,
      data: await this.tournamentService.getLeaderboard(Number(tournamentId)),
    };
  }

  @Post('tournaments/score')
  async recordScore(
    @Body() body: { tournamentId: number; userId: number; delta: number },
  ) {
    return {
      success: true,
      data: await this.tournamentService.recordScore(
        body.tournamentId,
        body.userId,
        body.delta,
      ),
    };
  }

  @Get('users/perks')
  async getUserPerks(@Query('userId') userId: string) {
    return { success: true, data: await this.tournamentService.getUserPerks(Number(userId)) };
  }
}
