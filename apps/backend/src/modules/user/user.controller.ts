import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('users')
  async createUser(
    @Body()
    body: { email: string; passwordHash: string; salt: string; status?: string },
  ) {
    const user = await this.userService.createUser(body);
    return { success: true, data: user };
  }

  @Get('users/by-email')
  async getByEmail(@Query('email') email: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Not found', code: 'NOT_FOUND' };
    }
    return { success: true, data: user };
  }

  @Get('users/:id')
  async getById(@Param('id') id: string) {
    const user = await this.userService.getUserById(Number(id));
    if (!user) {
      return { success: false, error: 'Not found', code: 'NOT_FOUND' };
    }
    return { success: true, data: user };
  }

  @Post('users/:id/password')
  async updatePassword(
    @Param('id') id: string,
    @Body() body: { passwordHash: string; salt: string },
  ) {
    const user = await this.userService.updateUserPassword(
      Number(id),
      body.passwordHash,
      body.salt,
    );
    if (!user) {
      return { success: false, error: 'Not found', code: 'NOT_FOUND' };
    }
    return { success: true, data: user };
  }
}
