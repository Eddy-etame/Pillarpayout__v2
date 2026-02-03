import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'gateway' };
  }

  @Get('ready')
  ready() {
    return { status: 'ok', service: 'gateway' };
  }
}
