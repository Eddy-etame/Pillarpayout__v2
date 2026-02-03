import { Body, Controller, Get, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('game/state')
  async getState() {
    return { success: true, data: await this.gameService.getState() };
  }

  @Get('game/history')
  async getHistory() {
    return { success: true, data: await this.gameService.getHistory() };
  }

  @Post('game/bet')
  async placeBet(@Body() body: { userId: number; amount: number }) {
    return { success: true, data: await this.gameService.placeBet(body.userId, body.amount) };
  }

  @Post('game/cashout')
  async cashout(@Body() body: { betId: number }) {
    return { success: true, data: await this.gameService.cashout(body.betId) };
  }
}
