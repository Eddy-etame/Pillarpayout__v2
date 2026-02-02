import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit {
  private seasonSeq = 1;
  private tournamentSeq = 1;
  private perkSeq = 1;
  private seasons: Season[] = [];
  private tournaments: Tournament[] = [];
  private participants: TournamentParticipant[] = [];
  private userPerks: UserPerk[] = [];

  private readonly weekMs = 7 * 24 * 60 * 60 * 1000;
  private readonly tickMs = 60 * 1000;

  onModuleInit() {
    this.ensureDefaultSeason();
    this.ensureWeeklyTournament();
    setInterval(() => this.tick(), this.tickMs);
  }

  getActiveSeason(): Season | null {
    return this.seasons.find((season) => season.isActive) ?? null;
  }

  getCurrentTournament(): Tournament | null {
    return this.tournaments.find((t) => t.status === 'running') ?? null;
  }

  getLeaderboard(tournamentId: number) {
    return this.participants
      .filter((p) => p.tournamentId === tournamentId)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }

  recordScore(tournamentId: number, userId: number, delta: number) {
    let participant = this.participants.find(
      (p) => p.tournamentId === tournamentId && p.userId === userId,
    );
    if (!participant) {
      participant = {
        id: this.participants.length + 1,
        tournamentId,
        userId,
        score: 0,
        joinedAt: new Date(),
      };
      this.participants.push(participant);
    }
    participant.score += delta;
    return participant;
  }

  getUserPerks(userId: number) {
    return this.userPerks.filter((perk) => perk.userId === userId);
  }

  private tick() {
    const current = this.getCurrentTournament();
    if (!current) {
      this.ensureWeeklyTournament();
      return;
    }
    if (current.endsAt.getTime() <= Date.now()) {
      this.closeTournament(current);
      this.ensureWeeklyTournament();
    }
  }

  private ensureDefaultSeason() {
    if (this.seasons.length > 0) {
      return;
    }
    const now = new Date();
    const season: Season = {
      id: this.seasonSeq++,
      name: 'Season 1',
      themeKey: 'default',
      startsAt: now,
      endsAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    };
    this.seasons.push(season);
  }

  private ensureWeeklyTournament() {
    const activeSeason = this.getActiveSeason();
    if (!activeSeason) {
      return;
    }
    const running = this.getCurrentTournament();
    if (running) {
      return;
    }
    const now = new Date();
    const tournament: Tournament = {
      id: this.tournamentSeq++,
      seasonId: activeSeason.id,
      type: 'weekly',
      startsAt: now,
      endsAt: new Date(now.getTime() + this.weekMs),
      entryFee: 0,
      prizePool: 0,
      houseCut: 0,
      status: 'running',
    };
    this.tournaments.push(tournament);
  }

  private closeTournament(tournament: Tournament) {
    tournament.status = 'closed';
    const leaderboard = this.getLeaderboard(tournament.id);
    const topThree = leaderboard.slice(0, 3);
    topThree.forEach((participant, index) => {
      this.userPerks.push({
        id: this.perkSeq++,
        userId: participant.userId,
        perkType: 'weekly_top_three',
        perkValue: `rank_${index + 1}`,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + this.weekMs),
        source: `tournament:${tournament.id}`,
      });
    });
  }
}

interface Season {
  id: number;
  name: string;
  themeKey: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

interface Tournament {
  id: number;
  seasonId: number;
  type: 'weekly' | 'daily' | 'mini' | 'regular' | 'major';
  startsAt: Date;
  endsAt: Date;
  entryFee: number;
  prizePool: number;
  houseCut: number;
  status: 'scheduled' | 'running' | 'closed';
}

interface TournamentParticipant {
  id: number;
  tournamentId: number;
  userId: number;
  score: number;
  joinedAt: Date;
}

interface UserPerk {
  id: number;
  userId: number;
  perkType: string;
  perkValue: string;
  startsAt: Date;
  endsAt: Date;
  source: string;
}
