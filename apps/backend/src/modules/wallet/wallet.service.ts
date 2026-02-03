import { BadRequestException, Injectable } from '@nestjs/common';
import { db } from '../../db';

@Injectable()
export class WalletService {
  async getBalance(userId: number, currency: string): Promise<Wallet> {
    return this.getOrCreateWallet(userId, currency);
  }

  async getTransactions(userId: number, currency: string): Promise<WalletTransaction[]> {
    const wallet = await this.getOrCreateWallet(userId, currency);
    const result = await db.query(
      `SELECT id, wallet_id, type, amount, reference, status, created_at
       FROM wallet_transactions
       WHERE wallet_id = $1
       ORDER BY created_at DESC`,
      [wallet.id],
    );
    return result.rows.map((row) => ({
      id: row.id,
      walletId: row.wallet_id,
      type: row.type,
      amount: Number(row.amount),
      reference: row.reference ?? undefined,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async debit(
    userId: number,
    currency: string,
    amount: number,
    reference?: string,
  ): Promise<WalletTransaction> {
    const wallet = await this.getOrCreateWallet(userId, currency);
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive.');
    }
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const balanceResult = await client.query(
        `SELECT balance FROM wallets WHERE id = $1 FOR UPDATE`,
        [wallet.id],
      );
      const balance = Number(balanceResult.rows[0].balance);
      if (balance < amount) {
        throw new BadRequestException('Insufficient balance.');
      }
      await client.query(
        `UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2`,
        [amount, wallet.id],
      );
      const txResult = await client.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, reference, status)
         VALUES ($1, $2, $3, $4, 'completed')
         RETURNING id, wallet_id, type, amount, reference, status, created_at`,
        [wallet.id, 'debit', amount, reference ?? null],
      );
      const tx = txResult.rows[0];
      await this.insertLedgerEntries(client, tx.id, wallet, currency, amount, 'debit');
      await client.query('COMMIT');
      return {
        id: tx.id,
        walletId: tx.wallet_id,
        type: tx.type,
        amount: Number(tx.amount),
        reference: tx.reference ?? undefined,
        status: tx.status,
        createdAt: tx.created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async credit(
    userId: number,
    currency: string,
    amount: number,
    reference?: string,
  ): Promise<WalletTransaction> {
    const wallet = await this.getOrCreateWallet(userId, currency);
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive.');
    }
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
        [amount, wallet.id],
      );
      const txResult = await client.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, reference, status)
         VALUES ($1, $2, $3, $4, 'completed')
         RETURNING id, wallet_id, type, amount, reference, status, created_at`,
        [wallet.id, 'credit', amount, reference ?? null],
      );
      const tx = txResult.rows[0];
      await this.insertLedgerEntries(client, tx.id, wallet, currency, amount, 'credit');
      await client.query('COMMIT');
      return {
        id: tx.id,
        walletId: tx.wallet_id,
        type: tx.type,
        amount: Number(tx.amount),
        reference: tx.reference ?? undefined,
        status: tx.status,
        createdAt: tx.created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async getOrCreateWallet(userId: number, currency: string): Promise<Wallet> {
    const existing = await db.query(
      `SELECT id, user_id, currency, balance, status, created_at, updated_at
       FROM wallets
       WHERE user_id = $1 AND currency = $2`,
      [userId, currency],
    );
    if (existing.rows[0]) {
      const row = existing.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        currency: row.currency,
        balance: Number(row.balance),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
    const result = await db.query(
      `INSERT INTO wallets (user_id, currency, balance, status)
       VALUES ($1, $2, 0, 'active')
       RETURNING id, user_id, currency, balance, status, created_at, updated_at`,
      [userId, currency],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      currency: row.currency,
      balance: Number(row.balance),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async insertLedgerEntries(
    client: { query: (sql: string, params?: any[]) => Promise<any> },
    transactionId: number,
    wallet: Wallet,
    currency: string,
    amount: number,
    type: 'debit' | 'credit',
  ) {
    const walletAccount = `wallet:${wallet.userId}:${currency}`;
    const houseAccount = `house:${currency}`;
    const debitAccount = type === 'debit' ? walletAccount : houseAccount;
    const creditAccount = type === 'debit' ? houseAccount : walletAccount;
    await client.query(
      `INSERT INTO ledger_entries (transaction_id, account, debit, credit)
       VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
      [transactionId, debitAccount, amount, 0, creditAccount, 0, amount],
    );
  }
}

interface Wallet {
  id: number;
  userId: number;
  currency: string;
  balance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WalletTransaction {
  id: number;
  walletId: number;
  type: string;
  amount: number;
  reference?: string;
  status: string;
  createdAt: Date;
}
