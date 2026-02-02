import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('auth/register')
  async register(@Body() body: { email: string; password: string }) {
    await this.appService.register(body.email, body.password);
    return { success: true };
  }

  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    const session = await this.appService.login(body.email, body.password);
    return { success: true, data: { userId: session.userId, sessionId: session.sessionId } };
  }

  @Post('auth/logout')
  logout(@Body() body: { sessionId: string }) {
    this.appService.logout(body.sessionId);
    return { success: true };
  }

  @Get('auth/session')
  getSession(@Query('sessionId') sessionId: string) {
    const session = this.appService.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }
    return { success: true, data: { userId: session.userId, expiresAt: session.expiresAt } };
  }

  @Post('auth/password/reset/request')
  async requestReset(@Body() body: { email: string }) {
    const token = await this.appService.requestPasswordReset(body.email);
    return { success: true, data: { token } };
  }

  @Post('auth/password/reset/verify')
  verifyReset(@Body() body: { token: string }) {
    const valid = this.appService.verifyResetToken(body.token);
    if (!valid) {
      return { success: false, error: 'Invalid or expired request.' };
    }
    return { success: true };
  }

  @Post('auth/password/reset/confirm')
  async confirmReset(@Body() body: { token: string; newPassword: string }) {
    await this.appService.confirmReset(body.token, body.newPassword);
    return { success: true };
  }
}
