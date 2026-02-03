import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private http: HttpClient, private api: ApiConfigService) {}

  getState() {
    return this.http.get(`${this.api.baseUrl}/game/state`);
  }

  getHistory() {
    return this.http.get(`${this.api.baseUrl}/game/history`);
  }

  placeBet(userId: number, amount: number) {
    return this.http.post(`${this.api.baseUrl}/game/bet`, { userId, amount });
  }

  cashout(betId: number) {
    return this.http.post(`${this.api.baseUrl}/game/cashout`, { betId });
  }
}
