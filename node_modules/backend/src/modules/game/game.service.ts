import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { db } from '../../db';
import { AdminAnalyticsService } from '../admin/admin-analytics.service';

@Injectable()
export class GameService implements OnModuleInit {
  constructor(private readonly adminAnalytics: AdminAnalyticsService) {}
  private currentRound: GameRound | null = null;
  private tickHandle?: NodeJS.Timeout;

  private readonly waitingDurationMs = 5000;
  private readonly resultsDurationMs = 3000;
  private readonly tickMs = 200;
  private readonly growthRatePerSecond = 0.15;

  async onModuleInit() {
    await this.startWaitingRound();
    this.tickHandle = setInterval(() => {
      void this.tick();
    }, this.tickMs);
  }

  async getState() {
    if (!this.currentRound) {
      await this.startWaitingRound();
    }
    return this.snapshotRound();
  }

  async getHistory() {
    const result = await db.query(
      `SELECT id, crash_point, started_at, ended_at, status
       FROM game_rounds
       ORDER BY id DESC
       LIMIT 50`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      crashPoint: Number(row.crash_point),
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
    }));
  }

  async placeBet(userId: number, amount: number) {
    if (!this.currentRound) {
      await this.startWaitingRound();
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive.');
    }
    if (this.currentRound?.status !== 'waiting') {
      throw new BadRequestException('Betting is closed for this round.');
    }
    const result = await db.query(
      `INSERT INTO bets (user_id, round_id, amount, placed_at, status)
       VALUES ($1, $2, $3, NOW(), 'active')
       RETURNING id, user_id, round_id, amount, placed_at, status`,
      [userId, this.currentRound!.id, amount],
    );
    await this.adminAnalytics.recordBet(amount, 'XAF');
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      roundId: row.round_id,
      amount: Number(row.amount),
      placedAt: row.placed_at,
      status: row.status,
    };
  }

  async cashout(betId: number) {
    const result = await db.query(
      `SELECT id, user_id, round_id, amount, status
       FROM bets
       WHERE id = $1`,
      [betId],
    );
    const bet = result.rows[0];
    if (!bet) {
      throw new BadRequestException('Bet not found.');
    }
    if (!this.currentRound || bet.round_id !== this.currentRound.id) {
      throw new BadRequestException('Bet is not in the current round.');
    }
    if (bet.status !== 'active') {
      throw new BadRequestException('Bet is not active.');
    }
    if (this.currentRound.status !== 'running') {
      throw new BadRequestException('Cashout is not available.');
    }
    const multiplier = this.getCurrentMultiplier();
    const winnings = Number((Number(bet.amount) * multiplier).toFixed(4));
    await db.query(
      `UPDATE bets
       SET cashout_multiplier = $1, winnings = $2, status = 'cashed_out'
       WHERE id = $3`,
      [multiplier, winnings, bet.id],
    );
    await this.adminAnalytics.recordCashout(winnings, 'XAF');
    await db.query(
      `INSERT INTO round_results (user_id, round_id, final_multiplier, result_type, winnings)
       VALUES ($1, $2, $3, 'win', $4)
       ON CONFLICT (user_id, round_id) DO NOTHING`,
      [bet.user_id, bet.round_id, multiplier, winnings],
    );
    return {
      cashoutMultiplier: multiplier,
      winnings,
    };
  }

  private async startWaitingRound() {
    const now = new Date();
    this.currentRound = {
      id: 0,
      crashPoint: this.generateCrashPoint(),
      serverSeed: this.generateSeed(),
      clientSeed: this.generateSeed(),
      nonce: Math.floor(Math.random() * 1_000_000),
      status: 'waiting',
      phaseStartedAt: now,
      startedAt: null,
      endedAt: null,
    };
    const result = await db.query(
      `INSERT INTO game_rounds (crash_point, server_seed, client_seed, nonce, status)
       VALUES ($1, $2, $3, $4, 'waiting')
       RETURNING id`,
      [
        this.currentRound.crashPoint,
        this.currentRound.serverSeed,
        this.currentRound.clientSeed,
        this.currentRound.nonce,
      ],
    );
    this.currentRound.id = result.rows[0].id;
  }

  private async tick() {
    if (!this.currentRound) {
      return;
    }
    const now = Date.now();
    const phaseStart = this.currentRound.phaseStartedAt.getTime();
    const elapsed = now - phaseStart;

    if (this.currentRound.status === 'waiting') {
      if (elapsed >= this.waitingDurationMs) {
        this.currentRound.status = 'running';
        this.currentRound.startedAt = new Date();
        this.currentRound.phaseStartedAt = new Date();
        await db.query(
          `UPDATE game_rounds SET status = 'running', started_at = NOW() WHERE id = $1`,
          [this.currentRound.id],
        );
      }
      return;
    }

    if (this.currentRound.status === 'running') {
      const multiplier = this.getCurrentMultiplier();
      if (multiplier >= this.currentRound.crashPoint) {
        this.currentRound.status = 'crashed';
        this.currentRound.endedAt = new Date();
        await db.query(
          `UPDATE game_rounds SET status = 'crashed', ended_at = NOW() WHERE id = $1`,
          [this.currentRound.id],
        );
        await this.settleLosses();
        this.currentRound.phaseStartedAt = new Date();
      }
      return;
    }

    if (this.currentRound.status === 'crashed') {
      if (elapsed >= this.resultsDurationMs) {
        this.currentRound.status = 'results';
        this.currentRound.phaseStartedAt = new Date();
        await db.query(
          `UPDATE game_rounds SET status = 'results' WHERE id = $1`,
          [this.currentRound.id],
        );
      }
      return;
    }

    if (this.currentRound.status === 'results') {
      if (elapsed >= this.resultsDurationMs) {
        await this.startWaitingRound();
      }
    }
  }

  private async settleLosses() {
    const roundId = this.currentRound?.id;
    if (!roundId) {
      return;
    }
    const result = await db.query(
      `SELECT id, user_id, round_id
       FROM bets
       WHERE round_id = $1 AND status = 'active'`,
      [roundId],
    );
    for (const row of result.rows) {
      await db.query(
        `UPDATE bets SET status = 'lost', winnings = 0 WHERE id = $1`,
        [row.id],
      );
      await db.query(
        `INSERT INTO round_results (user_id, round_id, final_multiplier, result_type, winnings)
         VALUES ($1, $2, $3, 'loss', 0)
         ON CONFLICT (user_id, round_id) DO NOTHING`,
        [row.user_id, row.round_id, this.currentRound!.crashPoint],
      );
    }
  }

  private getCurrentMultiplier(): number {
    if (!this.currentRound || !this.currentRound.startedAt) {
      return 1;
    }
    const elapsedSeconds =
      (Date.now() - this.currentRound.startedAt.getTime()) / 1000;
    const multiplier = 1 + elapsedSeconds * this.growthRatePerSecond;
    return Number(multiplier.toFixed(4));
  }

  private snapshotRound(): GameRound {
    if (!this.currentRound) {
      throw new BadRequestException('Round not initialized.');
    }
    return {
      ...this.currentRound,
    };
  }

  private generateSeed(): string {
    return Math.random().toString(36).slice(2);
  }

  private generateCrashPoint(): number {
    const base = 1 + Math.random() * 10;
    return Number(base.toFixed(4));
  }
}

type RoundStatus = 'waiting' | 'running' | 'crashed' | 'results';

interface GameRound {
  id: number;
  crashPoint: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  status: RoundStatus;
  phaseStartedAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
}
