import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('wallet/balance')
  async getBalance(@Query('userId') userId: string, @Query('currency') currency: string) {
    return {
      success: true,
      data: await this.walletService.getBalance(Number(userId), currency),
    };
  }

  @Get('wallet/transactions')
  async getTransactions(
    @Query('userId') userId: string,
    @Query('currency') currency: string,
  ) {
    return {
      success: true,
      data: await this.walletService.getTransactions(Number(userId), currency),
    };
  }

  @Post('wallet/debit')
  async debit(
    @Body()
    body: { userId: number; currency: string; amount: number; reference?: string },
  ) {
    return {
      success: true,
      data: await this.walletService.debit(
        body.userId,
        body.currency,
        body.amount,
        body.reference,
      ),
    };
  }

  @Post('wallet/credit')
  async credit(
    @Body()
    body: { userId: number; currency: string; amount: number; reference?: string },
  ) {
    return {
      success: true,
      data: await this.walletService.credit(
        body.userId,
        body.currency,
        body.amount,
        body.reference,
      ),
    };
  }
}
