import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private api: ApiConfigService) {}

  register(email: string, password: string) {
    return this.http.post(`${this.api.baseUrl}/auth/register`, { email, password });
  }

  login(email: string, password: string) {
    return this.http.post(`${this.api.baseUrl}/auth/login`, { email, password });
  }

  logout(sessionId?: string) {
    return this.http.post(`${this.api.baseUrl}/auth/logout`, { sessionId });
  }

  getSession(sessionId?: string) {
    return this.http.get(`${this.api.baseUrl}/auth/session`, {
      params: sessionId ? { sessionId } : {}
    });
  }
}
