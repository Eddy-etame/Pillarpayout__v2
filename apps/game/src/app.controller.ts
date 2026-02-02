import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('game/state')
  getState() {
    return { success: true, data: this.appService.getState() };
  }

  @Get('game/history')
  getHistory() {
    return { success: true, data: this.appService.getHistory() };
  }

  @Post('game/bet')
  placeBet(@Body() body: { userId: number; amount: number }) {
    return { success: true, data: this.appService.placeBet(body.userId, body.amount) };
  }

  @Post('game/cashout')
  cashout(@Body() body: { betId: number }) {
    return { success: true, data: this.appService.cashout(body.betId) };
  }
}
