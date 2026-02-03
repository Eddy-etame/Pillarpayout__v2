import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient, private api: ApiConfigService) {}

  getOverview() {
    return this.http.get(`${this.api.baseUrl}/admin/overview`);
  }

  recordEvent(event: {
    type: string;
    amount: number;
    currency: string;
    source: string;
    occurredAt: string;
  }) {
    return this.http.post(`${this.api.baseUrl}/admin/profitability/event`, event);
  }
}
