import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('wallet/balance')
  getBalance(@Query('userId') userId: string, @Query('currency') currency: string) {
    return {
      success: true,
      data: this.appService.getBalance(Number(userId), currency),
    };
  }

  @Get('wallet/transactions')
  getTransactions(
    @Query('userId') userId: string,
    @Query('currency') currency: string,
  ) {
    return {
      success: true,
      data: this.appService.getTransactions(Number(userId), currency),
    };
  }

  @Post('wallet/debit')
  debit(
    @Body()
    body: { userId: number; currency: string; amount: number; reference?: string },
  ) {
    return {
      success: true,
      data: this.appService.debit(
        body.userId,
        body.currency,
        body.amount,
        body.reference,
      ),
    };
  }

  @Post('wallet/credit')
  credit(
    @Body()
    body: { userId: number; currency: string; amount: number; reference?: string },
  ) {
    return {
      success: true,
      data: this.appService.credit(
        body.userId,
        body.currency,
        body.amount,
        body.reference,
      ),
    };
  }
}
