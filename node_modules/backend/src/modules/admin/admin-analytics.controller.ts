import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdminAnalyticsService, ProfitEvent } from './admin-analytics.service';

@Controller()
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('admin/overview')
  async getOverview() {
    return { success: true, data: await this.adminAnalyticsService.getOverview() };
  }

  @Post('admin/profitability/event')
  async recordEvent(@Body() body: ProfitEvent) {
    await this.adminAnalyticsService.recordEvent({
      ...body,
      occurredAt: new Date(body.occurredAt)
    });
    return { success: true };
  }
}
