import { Injectable } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';

@Injectable()
export class CryptoService {
  hashPassword(plaintext: string, salt: string, pepper1: string): string {
    const pepper2 = this.getPepper2();
    const combined = `${plaintext}:${salt}:${pepper1}:${pepper2}`;
    return createHash('sha256').update(combined).digest('hex');
  }

  verifyPassword(
    plaintext: string,
    salt: string,
    pepper1: string,
    hash: string,
  ): boolean {
    const computed = this.hashPassword(plaintext, salt, pepper1);
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }

  private getPepper2(): string {
    return process.env.PEPPER2 ?? 'dev-pepper2';
  }
}
