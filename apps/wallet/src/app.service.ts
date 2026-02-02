import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private walletSeq = 1;
  private transactionSeq = 1;
  private ledgerSeq = 1;
  private wallets = new Map<string, Wallet>();
  private transactions: WalletTransaction[] = [];
  private ledgerEntries: LedgerEntry[] = [];
  private houseBalances = new Map<string, number>();

  getBalance(userId: number, currency: string): Wallet {
    return this.getOrCreateWallet(userId, currency);
  }

  getTransactions(userId: number, currency: string): WalletTransaction[] {
    const wallet = this.getOrCreateWallet(userId, currency);
    return this.transactions.filter((tx) => tx.walletId === wallet.id);
  }

  debit(
    userId: number,
    currency: string,
    amount: number,
    reference?: string,
  ): WalletTransaction {
    const wallet = this.getOrCreateWallet(userId, currency);
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive.');
    }
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance.');
    }
    wallet.balance -= amount;
    this.adjustHouseBalance(currency, amount);
    const tx = this.createTransaction(
      wallet.id,
      'debit',
      amount,
      reference,
      `wallet:${wallet.userId}:${currency}`,
      `house:${currency}`,
    );
    return tx;
  }

  credit(
    userId: number,
    currency: string,
    amount: number,
    reference?: string,
  ): WalletTransaction {
    const wallet = this.getOrCreateWallet(userId, currency);
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive.');
    }
    wallet.balance += amount;
    this.adjustHouseBalance(currency, -amount);
    const tx = this.createTransaction(
      wallet.id,
      'credit',
      amount,
      reference,
      `house:${currency}`,
      `wallet:${wallet.userId}:${currency}`,
    );
    return tx;
  }

  private getOrCreateWallet(userId: number, currency: string): Wallet {
    const key = `${userId}:${currency}`;
    const existing = this.wallets.get(key);
    if (existing) {
      return existing;
    }
    const wallet: Wallet = {
      id: this.walletSeq++,
      userId,
      currency,
      balance: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.wallets.set(key, wallet);
    return wallet;
  }

  private adjustHouseBalance(currency: string, delta: number): void {
    const current = this.houseBalances.get(currency) ?? 0;
    this.houseBalances.set(currency, current + delta);
  }

  private createTransaction(
    walletId: number,
    type: 'debit' | 'credit',
    amount: number,
    reference: string | undefined,
    debitAccount: string,
    creditAccount: string,
  ): WalletTransaction {
    const tx: WalletTransaction = {
      id: this.transactionSeq++,
      walletId,
      type,
      amount,
      reference,
      status: 'completed',
      createdAt: new Date(),
    };
    this.transactions.push(tx);
    this.ledgerEntries.push(
      {
        id: this.ledgerSeq++,
        transactionId: tx.id,
        account: debitAccount,
        debit: amount,
        credit: 0,
        createdAt: new Date(),
      },
      {
        id: this.ledgerSeq++,
        transactionId: tx.id,
        account: creditAccount,
        debit: 0,
        credit: amount,
        createdAt: new Date(),
      },
    );
    return tx;
  }
}

interface Wallet {
  id: number;
  userId: number;
  currency: string;
  balance: number;
  status: 'active' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

interface WalletTransaction {
  id: number;
  walletId: number;
  type: 'debit' | 'credit';
  amount: number;
  reference?: string;
  status: 'completed' | 'failed' | 'pending';
  createdAt: Date;
}

interface LedgerEntry {
  id: number;
  transactionId: number;
  account: string;
  debit: number;
  credit: number;
  createdAt: Date;
}
