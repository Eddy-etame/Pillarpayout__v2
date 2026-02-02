import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private events: ProfitEvent[] = [];

  recordEvent(event: ProfitEvent) {
    this.events.push(event);
  }

  getOverview() {
    const totals = this.calculateTotals(this.events);
    const lastHour = this.filterByWindow(60 * 60 * 1000);
    const lastDay = this.filterByWindow(24 * 60 * 60 * 1000);
    const lastWeek = this.filterByWindow(7 * 24 * 60 * 60 * 1000);

    return {
      totals,
      hourly: this.calculateTotals(lastHour),
      daily: this.calculateTotals(lastDay),
      weekly: this.calculateTotals(lastWeek)
    };
  }

  private filterByWindow(windowMs: number) {
    const cutoff = Date.now() - windowMs;
    return this.events.filter((event) => event.occurredAt.getTime() >= cutoff);
  }

  private calculateTotals(events: ProfitEvent[]) {
    const revenueTypes = new Set(['bet', 'insurance_premium', 'tournament_entry']);
    const payoutTypes = new Set(['cashout', 'insurance_payout', 'tournament_prize']);
    const totalRevenue = events
      .filter((event) => revenueTypes.has(event.type))
      .reduce((sum, event) => sum + event.amount, 0);
    const totalPayouts = events
      .filter((event) => payoutTypes.has(event.type))
      .reduce((sum, event) => sum + event.amount, 0);
    const netProfit = totalRevenue - totalPayouts;
    const profitMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;
    const houseEdge = totalRevenue > 0 ? 1 - totalPayouts / totalRevenue : 0;
    return {
      totalRevenue,
      totalPayouts,
      netProfit,
      profitMargin,
      houseEdge
    };
  }
}

export type ProfitEventType =
  | 'bet'
  | 'cashout'
  | 'insurance_premium'
  | 'insurance_payout'
  | 'tournament_entry'
  | 'tournament_prize';

export interface ProfitEvent {
  type: ProfitEventType;
  amount: number;
  currency: string;
  source: 'game' | 'insurance' | 'tournament';
  occurredAt: Date;
}
