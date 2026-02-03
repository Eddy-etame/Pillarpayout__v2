import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CryptoService } from './crypto.service';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, CryptoService]
})
export class AuthModule {}
