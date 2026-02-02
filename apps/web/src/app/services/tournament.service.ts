import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiConfig } from '../config/api-config';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private baseUrl = apiConfig.tournamentUrl;

  constructor(private http: HttpClient) {}

  getActiveSeason() {
    return this.http.get(`${this.baseUrl}/seasons/active`);
  }

  getCurrentTournament() {
    return this.http.get(`${this.baseUrl}/tournaments/current`);
  }

  getLeaderboard(tournamentId: number) {
    return this.http.get(`${this.baseUrl}/tournaments/leaderboard`, {
      params: { tournamentId }
    });
  }

  recordScore(tournamentId: number, userId: number, delta: number) {
    return this.http.post(`${this.baseUrl}/tournaments/score`, {
      tournamentId,
      userId,
      delta
    });
  }

  getUserPerks(userId: number) {
    return this.http.get(`${this.baseUrl}/users/perks`, {
      params: { userId }
    });
  }
}
