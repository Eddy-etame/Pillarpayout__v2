import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiConfig } from '../config/api-config';

@Injectable({ providedIn: 'root' })
export class GameService {
  private baseUrl = apiConfig.gameUrl;

  constructor(private http: HttpClient) {}

  getState() {
    return this.http.get(`${this.baseUrl}/game/state`);
  }

  getHistory() {
    return this.http.get(`${this.baseUrl}/game/history`);
  }

  placeBet(userId: number, amount: number) {
    return this.http.post(`${this.baseUrl}/game/bet`, { userId, amount });
  }

  cashout(betId: number) {
    return this.http.post(`${this.baseUrl}/game/cashout`, { betId });
  }
}
