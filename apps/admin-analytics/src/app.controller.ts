import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService, ProfitEvent } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('admin/overview')
  getOverview() {
    return { success: true, data: this.appService.getOverview() };
  }

  @Post('admin/profitability/event')
  recordEvent(@Body() body: ProfitEvent) {
    this.appService.recordEvent({
      ...body,
      occurredAt: new Date(body.occurredAt)
    });
    return { success: true };
  }
}
