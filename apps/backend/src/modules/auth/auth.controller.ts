import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/register')
  async register(@Body() body: { email: string; password: string }) {
    await this.authService.register(body.email, body.password);
    return { success: true };
  }

  @Post('auth/login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(body.email, body.password);
    const csrfToken = randomUUID();
    const isProd = process.env.APP_ENV === 'production';
    res.cookie('session_id', session.sessionId, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
    });
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      sameSite: 'strict',
      secure: isProd,
    });
    return {
      success: true,
      data: { userId: session.userId, sessionId: session.sessionId, csrfToken }
    };
  }

  @Post('auth/logout')
  async logout(
    @Body() body: { sessionId?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = body.sessionId ?? parseCookies(req.headers.cookie ?? '').session_id;
    if (sessionId) {
      await this.authService.logout(sessionId);
    }
    res.clearCookie('session_id');
    res.clearCookie('csrf_token');
    return { success: true };
  }

  @Get('auth/session')
  async getSession(@Query('sessionId') sessionId: string, @Req() req: Request) {
    const cookieSession = parseCookies(req.headers.cookie ?? '').session_id;
    const session = await this.authService.getSession(sessionId || cookieSession || '');
    if (!session) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }
    return {
      success: true,
      data: { userId: session.userId, expiresAt: session.expiresAt }
    };
  }

  @Post('auth/password/reset/request')
  async requestReset(@Body() body: { email: string }) {
    const token = await this.authService.requestPasswordReset(body.email);
    return { success: true, data: { token } };
  }

  @Post('auth/password/reset/verify')
  async verifyReset(@Body() body: { token: string }) {
    const valid = await this.authService.verifyResetToken(body.token);
    if (!valid) {
      return { success: false, error: 'Invalid or expired request.' };
    }
    return { success: true };
  }

  @Post('auth/password/reset/confirm')
  async confirmReset(@Body() body: { token: string; newPassword: string }) {
    await this.authService.confirmReset(body.token, body.newPassword);
    return { success: true };
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...value] = part.trim().split('=');
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(value.join('='));
    return acc;
  }, {} as Record<string, string>);
}
