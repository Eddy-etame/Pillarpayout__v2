import { Injectable } from '@nestjs/common';
import { db } from '../../db';

@Injectable()
export class UserService {
  async createUser(input: CreateUserInput) {
    const result = await db.query(
      `INSERT INTO users_base (email, password_hash, salt, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, status, created_at, updated_at`,
      [input.email, input.passwordHash, input.salt, input.status ?? 'active'],
    );
    return result.rows[0];
  }

  async getUserByEmail(email: string) {
    const result = await db.query(
      `SELECT id, email, password_hash, salt, status, created_at, updated_at
       FROM users_base
       WHERE email = $1`,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async getUserById(id: number) {
    const result = await db.query(
      `SELECT id, email, password_hash, salt, status, created_at, updated_at
       FROM users_base
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async updateUserPassword(id: number, passwordHash: string, salt: string) {
    const result = await db.query(
      `UPDATE users_base
       SET password_hash = $1, salt = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, status, created_at, updated_at`,
      [passwordHash, salt, id],
    );
    return result.rows[0] ?? null;
  }
}

interface CreateUserInput {
  email: string;
  passwordHash: string;
  salt: string;
  status?: string;
}
