import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should hash a password', () => {
    const response = appController.hash({
      plaintext: 'password',
      salt: 'salt',
      pepper1: 'pepper1'
    });
    expect(response.success).toBe(true);
  });
});
