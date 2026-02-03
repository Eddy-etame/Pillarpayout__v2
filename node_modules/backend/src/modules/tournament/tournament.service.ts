import { Injectable, OnModuleInit } from '@nestjs/common';
import { db } from '../../db';
import { AdminAnalyticsService } from '../admin/admin-analytics.service';

@Injectable()
export class TournamentService implements OnModuleInit {
  constructor(private readonly adminAnalytics: AdminAnalyticsService) {}
  private readonly weekMs = 7 * 24 * 60 * 60 * 1000;
  private readonly tickMs = 60 * 1000;

  async onModuleInit() {
    await this.ensureDefaultSeason();
    await this.ensureWeeklyTournament();
    setInterval(() => void this.tick(), this.tickMs);
  }

  async getActiveSeason() {
    const result = await db.query(
      `SELECT id, name, theme_key, starts_at, ends_at, is_active
       FROM seasons
       WHERE is_active = true
       ORDER BY starts_at DESC
       LIMIT 1`,
    );
    return result.rows[0] ?? null;
  }

  async getCurrentTournament() {
    const result = await db.query(
      `SELECT id, season_id, type, starts_at, ends_at, entry_fee, prize_pool, house_cut, status
       FROM tournaments
       WHERE status = 'running'
       ORDER BY starts_at DESC
       LIMIT 1`,
    );
    return result.rows[0] ?? null;
  }

  async getLeaderboard(tournamentId: number) {
    const result = await db.query(
      `SELECT id, tournament_id, user_id, score, joined_at
       FROM tournament_participation
       WHERE tournament_id = $1
       ORDER BY score DESC
       LIMIT 50`,
      [tournamentId],
    );
    return result.rows;
  }

  async recordScore(tournamentId: number, userId: number, delta: number) {
    if (delta > 0) {
      await this.adminAnalytics.recordTournamentEntry(delta, 'XAF');
    }
    const update = await db.query(
      `UPDATE tournament_participation
       SET score = score + $1
       WHERE tournament_id = $2 AND user_id = $3
       RETURNING id, tournament_id, user_id, score, joined_at`,
      [delta, tournamentId, userId],
    );
    if (update.rows[0]) {
      return update.rows[0];
    }
    const insert = await db.query(
      `INSERT INTO tournament_participation (tournament_id, user_id, score)
       VALUES ($1, $2, $3)
       RETURNING id, tournament_id, user_id, score, joined_at`,
      [tournamentId, userId, delta],
    );
    return insert.rows[0];
  }

  async getUserPerks(userId: number) {
    const result = await db.query(
      `SELECT id, user_id, perk_type, perk_value, starts_at, ends_at, source
       FROM user_perks
       WHERE user_id = $1
       ORDER BY starts_at DESC`,
      [userId],
    );
    return result.rows;
  }

  private async tick() {
    const current = await this.getCurrentTournament();
    if (!current) {
      await this.ensureWeeklyTournament();
      return;
    }
    if (new Date(current.ends_at).getTime() <= Date.now()) {
      await this.closeTournament(current.id);
      await this.ensureWeeklyTournament();
    }
  }

  private async ensureDefaultSeason() {
    const existing = await this.getActiveSeason();
    if (existing) {
      return;
    }
    const now = new Date();
    await db.query(
      `INSERT INTO seasons (name, theme_key, starts_at, ends_at, is_active)
       VALUES ($1, $2, $3, $4, true)`,
      ['Season 1', 'default', now, new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)],
    );
  }

  private async ensureWeeklyTournament() {
    const activeSeason = await this.getActiveSeason();
    if (!activeSeason) {
      return;
    }
    const running = await this.getCurrentTournament();
    if (running) {
      return;
    }
    const now = new Date();
    await db.query(
      `INSERT INTO tournaments (season_id, type, starts_at, ends_at, entry_fee, prize_pool, house_cut, status)
       VALUES ($1, 'weekly', $2, $3, 0, 0, 0, 'running')`,
      [activeSeason.id, now, new Date(now.getTime() + this.weekMs)],
    );
  }

  private async closeTournament(tournamentId: number) {
    await db.query(`UPDATE tournaments SET status = 'closed' WHERE id = $1`, [tournamentId]);
    const leaderboard = await db.query(
      `SELECT user_id, score
       FROM tournament_participation
       WHERE tournament_id = $1
       ORDER BY score DESC
       LIMIT 3`,
      [tournamentId],
    );
    const now = new Date();
    for (let index = 0; index < leaderboard.rows.length; index += 1) {
      const participant = leaderboard.rows[index];
      await this.adminAnalytics.recordTournamentPrize(0, 'XAF');
      await db.query(
        `INSERT INTO user_perks (user_id, perk_type, perk_value, starts_at, ends_at, source)
         VALUES ($1, 'weekly_top_three', $2, $3, $4, $5)`,
        [
          participant.user_id,
          `rank_${index + 1}`,
          now,
          new Date(now.getTime() + this.weekMs),
          `tournament:${tournamentId}`,
        ],
      );
    }
  }
}
