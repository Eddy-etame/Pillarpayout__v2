import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  constructor(private http: HttpClient, private api: ApiConfigService) {}

  getActiveSeason() {
    return this.http.get(`${this.api.baseUrl}/seasons/active`);
  }

  getCurrentTournament() {
    return this.http.get(`${this.api.baseUrl}/tournaments/current`);
  }

  getLeaderboard(tournamentId: number) {
    return this.http.get(`${this.api.baseUrl}/tournaments/leaderboard`, {
      params: { tournamentId }
    });
  }

  recordScore(tournamentId: number, userId: number, delta: number) {
    return this.http.post(`${this.api.baseUrl}/tournaments/score`, {
      tournamentId,
      userId,
      delta
    });
  }

  getUserPerks(userId: number) {
    return this.http.get(`${this.api.baseUrl}/users/perks`, {
      params: { userId }
    });
  }
}
