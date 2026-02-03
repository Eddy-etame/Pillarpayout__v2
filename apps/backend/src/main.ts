import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.use((req, res, next) => {
    const method = req.method.toUpperCase();
    const path = req.path ?? req.url ?? '';
    const isAuthRoute = path.startsWith('/auth');
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (isStateChanging && !isAuthRoute) {
      const cookies = parseCookies(req.headers.cookie ?? '');
      const csrfHeader = req.headers['x-csrf-token'];
      if (!cookies.csrf_token || !csrfHeader || csrfHeader !== cookies.csrf_token) {
        res.status(403).json({ success: false, error: 'Invalid CSRF token' });
        return;
      }
    }
    next();
  });

  const authRateLimit = createRateLimiter(10, 60_000);
  app.use((req, res, next) => {
    const path = req.path ?? req.url ?? '';
    if (path.startsWith('/auth/login') || path.startsWith('/auth/password/reset/request')) {
      const key = req.ip ?? 'unknown';
      if (!authRateLimit(key)) {
        res.status(429).json({ success: false, error: 'Too many requests' });
        return;
      }
    }
    next();
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

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

function createRateLimiter(maxRequests: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string) => {
    const now = Date.now();
    const existing = hits.get(key);
    if (!existing || existing.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (existing.count >= maxRequests) {
      return false;
    }
    existing.count += 1;
    return true;
  };
}
