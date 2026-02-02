import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiConfig } from '../config/api-config';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = apiConfig.adminUrl;

  constructor(private http: HttpClient) {}

  getOverview() {
    return this.http.get(`${this.baseUrl}/admin/overview`);
  }

  blockUser(userId: number) {
    return this.http.post(`${this.baseUrl}/admin/users/${userId}/block`, {});
  }

  resumeGame() {
    return this.http.post(`${this.baseUrl}/admin/game/resume`, {});
  }

  pauseGame() {
    return this.http.post(`${this.baseUrl}/admin/game/pause`, {});
  }
}
