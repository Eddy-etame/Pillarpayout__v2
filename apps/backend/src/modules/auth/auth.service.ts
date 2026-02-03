import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { db } from '../../db';
import { UserService } from '../user/user.service';
import { CryptoService } from './crypto.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly cryptoService: CryptoService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.userService.getUserByEmail(email);
    if (existing) {
      return;
    }
    const salt = this.generateSalt();
    const hash = this.cryptoService.hashPassword(password, salt, this.getPepper1());
    await this.userService.createUser({ email, passwordHash: hash, salt });
  }

  async login(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid credentials.');
    }
    const valid = this.cryptoService.verifyPassword(
      password,
      user.salt,
      this.getPepper1(),
      user.password_hash,
    );
    if (!valid) {
      throw new BadRequestException('Invalid credentials.');
    }
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);
    const result = await db.query(
      `INSERT INTO sessions (session_id, user_id, created_at, expires_at)
       VALUES ($1, $2, NOW(), $3)
       RETURNING session_id, user_id, created_at, expires_at`,
      [sessionId, user.id, expiresAt],
    );
    return result.rows[0];
  }

  async logout(sessionId: string) {
    await db.query(`DELETE FROM sessions WHERE session_id = $1`, [sessionId]);
  }

  async getSession(sessionId: string) {
    if (!sessionId) {
      return null;
    }
    const result = await db.query(
      `SELECT session_id, user_id, created_at, expires_at
       FROM sessions
       WHERE session_id = $1`,
      [sessionId],
    );
    const session = result.rows[0];
    if (!session) {
      return null;
    }
    if (new Date(session.expires_at).getTime() < Date.now()) {
      await db.query(`DELETE FROM sessions WHERE session_id = $1`, [sessionId]);
      return null;
    }
    return {
      sessionId: session.session_id,
      userId: session.user_id,
      createdAt: new Date(session.created_at),
      expiresAt: new Date(session.expires_at),
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.userService.getUserByEmail(email);
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await db.query(
      `INSERT INTO password_reset_requests (user_id, code_hash, expires_at, consumed_at)
       VALUES ($1, $2, $3, NULL)`,
      [user?.id ?? null, this.hashToken(token), expiresAt],
    );
    return token;
  }

  async verifyResetToken(token: string) {
    const result = await db.query(
      `SELECT id, consumed_at, expires_at
       FROM password_reset_requests
       WHERE code_hash = $1`,
      [this.hashToken(token)],
    );
    const record = result.rows[0];
    if (!record) {
      return false;
    }
    if (record.consumed_at) {
      return false;
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return false;
    }
    return true;
  }

  async confirmReset(token: string, newPassword: string) {
    const result = await db.query(
      `SELECT id, user_id, consumed_at, expires_at
       FROM password_reset_requests
       WHERE code_hash = $1`,
      [this.hashToken(token)],
    );
    const record = result.rows[0];
    if (!record || record.consumed_at || new Date(record.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired request.');
    }
    if (record.user_id) {
      const salt = this.generateSalt();
      const hash = this.cryptoService.hashPassword(newPassword, salt, this.getPepper1());
      await this.userService.updateUserPassword(record.user_id, hash, salt);
    }
    await db.query(`UPDATE password_reset_requests SET consumed_at = NOW() WHERE id = $1`, [
      record.id
    ]);
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

  private getPepper1(): string {
    return process.env.PEPPER1 ?? 'dev-pepper1';
  }
}
