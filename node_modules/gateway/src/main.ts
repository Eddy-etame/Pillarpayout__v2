import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

  app.use((req, res, next) => {
    const requestId = req.headers['x-correlation-id']?.toString() ?? randomUUID();
    res.setHeader('X-Correlation-Id', requestId);
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      console.log(
        JSON.stringify({
          service: 'gateway',
          method: req.method,
          path: req.url,
          statusCode: res.statusCode,
          durationMs,
          correlationId: requestId
        }),
      );
    });
    next();
  });

  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api': ''
      }
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
