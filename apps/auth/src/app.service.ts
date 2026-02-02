import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class AppService {
  private userSeq = 1;
  private users = new Map<string, UserRecord>();
  private sessions = new Map<string, SessionRecord>();
  private resetTokens = new Map<string, ResetRecord>();

  async register(email: string, password: string) {
    if (this.users.has(email)) {
      return;
    }
    const salt = this.generateSalt();
    const hash = await this.cryptoHash(password, salt);
    const user: UserRecord = {
      id: this.userSeq++,
      email,
      passwordHash: hash,
      salt,
      status: 'active',
      createdAt: new Date(),
    };
    this.users.set(email, user);
  }

  async login(email: string, password: string) {
    const user = this.users.get(email);
    if (!user) {
      throw new BadRequestException('Invalid credentials.');
    }
    const valid = await this.cryptoVerify(password, user.salt, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Invalid credentials.');
    }
    const sessionId = randomUUID();
    const session: SessionRecord = {
      sessionId,
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  logout(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  getSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    if (session.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  async requestPasswordReset(email: string) {
    const user = this.users.get(email);
    const token = this.generateToken();
    const record: ResetRecord = {
      userId: user?.id ?? null,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      consumedAt: null,
    };
    this.resetTokens.set(record.tokenHash, record);
    return token;
  }

  verifyResetToken(token: string) {
    const record = this.resetTokens.get(this.hashToken(token));
    if (!record || record.consumedAt || record.expiresAt.getTime() < Date.now()) {
      return false;
    }
    return true;
  }

  async confirmReset(token: string, newPassword: string) {
    const record = this.resetTokens.get(this.hashToken(token));
    if (!record || record.consumedAt || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired request.');
    }
    if (record.userId) {
      const user = Array.from(this.users.values()).find(
        (item) => item.id === record.userId,
      );
      if (user) {
        const salt = this.generateSalt();
        const hash = await this.cryptoHash(newPassword, salt);
        user.salt = salt;
        user.passwordHash = hash;
      }
    }
    record.consumedAt = new Date();
  }

  private generateSalt(): string {
    return createHash('sha256').update(randomUUID()).digest('hex');
  }

  private generateToken(): string {
    return randomUUID().replace(/-/g, '');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async cryptoHash(plaintext: string, salt: string): Promise<string> {
    const response = await fetch(`${this.cryptoBaseUrl()}/crypto/hash`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        plaintext,
        salt,
        pepper1: this.getPepper1(),
      }),
    });
    const json = (await response.json()) as {
      success: boolean;
      data?: { hash: string };
    };
    if (!json.success || !json.data) {
      throw new BadRequestException('Hashing failed.');
    }
    return json.data.hash;
  }

  private async cryptoVerify(
    plaintext: string,
    salt: string,
    hash: string,
  ): Promise<boolean> {
    const response = await fetch(`${this.cryptoBaseUrl()}/crypto/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        plaintext,
        salt,
        pepper1: this.getPepper1(),
        hash,
      }),
    });
    const json = (await response.json()) as {
      success: boolean;
      data?: { valid: boolean };
    };
    if (!json.success || !json.data) {
      return false;
    }
    return json.data.valid;
  }

  private cryptoBaseUrl(): string {
    return process.env.CRYPTO_SERVICE_URL ?? 'http://localhost:3002';
  }

  private getPepper1(): string {
    return process.env.PEPPER1 ?? 'dev-pepper1';
  }
}

interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  salt: string;
  status: 'active' | 'blocked' | 'suspended';
  createdAt: Date;
}

interface SessionRecord {
  sessionId: string;
  userId: number;
  createdAt: Date;
  expiresAt: Date;
}

interface ResetRecord {
  userId: number | null;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
}
