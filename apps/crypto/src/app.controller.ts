import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('crypto/hash')
  hash(@Body() body: { plaintext: string; salt: string; pepper1: string }) {
    return {
      success: true,
      data: { hash: this.appService.hashPassword(body.plaintext, body.salt, body.pepper1) },
    };
  }

  @Post('crypto/verify')
  verify(
    @Body() body: { plaintext: string; salt: string; pepper1: string; hash: string },
  ) {
    return {
      success: true,
      data: {
        valid: this.appService.verifyPassword(
          body.plaintext,
          body.salt,
          body.pepper1,
          body.hash,
        ),
      },
    };
  }
}
