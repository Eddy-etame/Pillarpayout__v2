import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiConfig } from '../config/api-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = apiConfig.authUrl;

  constructor(private http: HttpClient) {}

  register(email: string, password: string) {
    return this.http.post(`${this.baseUrl}/auth/register`, { email, password });
  }

  login(email: string, password: string) {
    return this.http.post(`${this.baseUrl}/auth/login`, { email, password });
  }

  logout(sessionId: string) {
    return this.http.post(`${this.baseUrl}/auth/logout`, { sessionId });
  }

  getSession(sessionId: string) {
    return this.http.get(`${this.baseUrl}/auth/session`, {
      params: { sessionId }
    });
  }

  requestPasswordReset(email: string) {
    return this.http.post(`${this.baseUrl}/auth/password/reset/request`, { email });
  }

  verifyReset(token: string) {
    return this.http.post(`${this.baseUrl}/auth/password/reset/verify`, { token });
  }

  confirmReset(token: string, newPassword: string) {
    return this.http.post(`${this.baseUrl}/auth/password/reset/confirm`, {
      token,
      newPassword
    });
  }
}
