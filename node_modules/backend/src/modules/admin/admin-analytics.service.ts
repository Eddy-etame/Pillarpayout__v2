import { Injectable } from '@nestjs/common';
import { db } from '../../db';

@Injectable()
export class AdminAnalyticsService {
  async recordEvent(event: ProfitEvent) {
    await db.query(
      `INSERT INTO profit_events (type, amount, currency, source, occurred_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [event.type, event.amount, event.currency, event.source, event.occurredAt],
    );
  }

  async getOverview() {
    const totals = await this.calculateTotals();
    const hourly = await this.calculateTotals(60 * 60 * 1000);
    const daily = await this.calculateTotals(24 * 60 * 60 * 1000);
    const weekly = await this.calculateTotals(7 * 24 * 60 * 60 * 1000);

    return { totals, hourly, daily, weekly };
  }

  async recordBet(amount: number, currency: string) {
    await this.recordEvent({
      type: 'bet',
      amount,
      currency,
      source: 'game',
      occurredAt: new Date()
    });
  }

  async recordCashout(amount: number, currency: string) {
    await this.recordEvent({
      type: 'cashout',
      amount,
      currency,
      source: 'game',
      occurredAt: new Date()
    });
  }

  async recordTournamentEntry(amount: number, currency: string) {
    await this.recordEvent({
      type: 'tournament_entry',
      amount,
      currency,
      source: 'tournament',
      occurredAt: new Date()
    });
  }

  async recordTournamentPrize(amount: number, currency: string) {
    await this.recordEvent({
      type: 'tournament_prize',
      amount,
      currency,
      source: 'tournament',
      occurredAt: new Date()
    });
  }

  private async calculateTotals(windowMs?: number) {
    const timeClause = windowMs
      ? `WHERE occurred_at >= NOW() - INTERVAL '${Math.floor(windowMs / 1000)} seconds'`
      : '';
    const result = await db.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type IN ('bet','insurance_premium','tournament_entry') THEN amount END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN type IN ('cashout','insurance_payout','tournament_prize') THEN amount END), 0) AS total_payouts
      FROM profit_events
      ${timeClause}
      `,
    );
    const row = result.rows[0];
    const totalRevenue = Number(row.total_revenue);
    const totalPayouts = Number(row.total_payouts);
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
