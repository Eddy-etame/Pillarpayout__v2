import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class WalletService {
  constructor(private http: HttpClient, private api: ApiConfigService) {}

  getBalance(userId: number, currency: string) {
    return this.http.get(`${this.api.baseUrl}/wallet/balance`, {
      params: { userId, currency }
    });
  }

  getTransactions(userId: number, currency: string) {
    return this.http.get(`${this.api.baseUrl}/wallet/transactions`, {
      params: { userId, currency }
    });
  }

  debit(userId: number, currency: string, amount: number, reference?: string) {
    return this.http.post(`${this.api.baseUrl}/wallet/debit`, {
      userId,
      currency,
      amount,
      reference
    });
  }

  credit(userId: number, currency: string, amount: number, reference?: string) {
    return this.http.post(`${this.api.baseUrl}/wallet/credit`, {
      userId,
      currency,
      amount,
      reference
    });
  }
}
