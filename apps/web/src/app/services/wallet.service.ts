import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiConfig } from '../config/api-config';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private baseUrl = apiConfig.walletUrl;

  constructor(private http: HttpClient) {}

  getBalance(userId: number, currency: string) {
    return this.http.get(`${this.baseUrl}/wallet/balance`, {
      params: { userId, currency }
    });
  }

  getTransactions(userId: number, currency: string) {
    return this.http.get(`${this.baseUrl}/wallet/transactions`, {
      params: { userId, currency }
    });
  }

  debit(userId: number, currency: string, amount: number, reference?: string) {
    return this.http.post(`${this.baseUrl}/wallet/debit`, {
      userId,
      currency,
      amount,
      reference
    });
  }

  credit(userId: number, currency: string, amount: number, reference?: string) {
    return this.http.post(`${this.baseUrl}/wallet/credit`, {
      userId,
      currency,
      amount,
      reference
    });
  }
}
