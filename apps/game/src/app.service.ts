import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit {
  private roundSeq = 1;
  private betSeq = 1;
  private currentRound: GameRound | null = null;
  private bets: Bet[] = [];
  private roundHistory: GameRound[] = [];
  private results: RoundResult[] = [];
  private tickHandle?: NodeJS.Timeout;

  private readonly waitingDurationMs = 5000;
  private readonly resultsDurationMs = 3000;
  private readonly tickMs = 200;
  private readonly growthRatePerSecond = 0.15;

  onModuleInit() {
    this.startWaitingRound();
    this.tickHandle = setInterval(() => this.tick(), this.tickMs);
  }

  getState() {
    if (!this.currentRound) {
      this.startWaitingRound();
    }
    return this.snapshotRound();
  }

  getHistory() {
    return [...this.roundHistory].slice(-50).reverse();
  }

  placeBet(userId: number, amount: number) {
    if (!this.currentRound) {
      this.startWaitingRound();
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive.');
    }
    if (this.currentRound?.status !== 'waiting') {
      throw new BadRequestException('Betting is closed for this round.');
    }
    const bet: Bet = {
      id: this.betSeq++,
      userId,
      roundId: this.currentRound!.id,
      amount,
      placedAt: new Date(),
      status: 'active',
    };
    this.bets.push(bet);
    return bet;
  }

  cashout(betId: number) {
    const bet = this.bets.find((b) => b.id === betId);
    if (!bet) {
      throw new BadRequestException('Bet not found.');
    }
    if (!this.currentRound || bet.roundId !== this.currentRound.id) {
      throw new BadRequestException('Bet is not in the current round.');
    }
    if (bet.status !== 'active') {
      throw new BadRequestException('Bet is not active.');
    }
    if (this.currentRound.status !== 'running') {
      throw new BadRequestException('Cashout is not available.');
    }
    const multiplier = this.getCurrentMultiplier();
    bet.cashoutMultiplier = multiplier;
    bet.winnings = Number((bet.amount * multiplier).toFixed(4));
    bet.status = 'cashed_out';
    this.results.push({
      userId: bet.userId,
      roundId: bet.roundId,
      finalMultiplier: multiplier,
      resultType: 'win',
      winnings: bet.winnings,
    });
    return {
      cashoutMultiplier: bet.cashoutMultiplier,
      winnings: bet.winnings,
    };
  }

  private startWaitingRound() {
    const now = new Date();
    this.currentRound = {
      id: this.roundSeq++,
      crashPoint: this.generateCrashPoint(),
      serverSeed: this.generateSeed(),
      clientSeed: this.generateSeed(),
      nonce: Math.floor(Math.random() * 1_000_000),
      status: 'waiting',
      phaseStartedAt: now,
      startedAt: null,
      endedAt: null,
    };
  }

  private tick() {
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
      }
      return;
    }

    if (this.currentRound.status === 'running') {
      const multiplier = this.getCurrentMultiplier();
      if (multiplier >= this.currentRound.crashPoint) {
        this.currentRound.status = 'crashed';
        this.currentRound.endedAt = new Date();
        this.settleLosses();
        this.currentRound.phaseStartedAt = new Date();
      }
      return;
    }

    if (this.currentRound.status === 'crashed') {
      if (elapsed >= this.resultsDurationMs) {
        this.currentRound.status = 'results';
        this.currentRound.phaseStartedAt = new Date();
      }
      return;
    }

    if (this.currentRound.status === 'results') {
      if (elapsed >= this.resultsDurationMs) {
        this.roundHistory.push(this.snapshotRound());
        this.startWaitingRound();
      }
    }
  }

  private settleLosses() {
    const roundId = this.currentRound?.id;
    if (!roundId) {
      return;
    }
    this.bets
      .filter((bet) => bet.roundId === roundId && bet.status === 'active')
      .forEach((bet) => {
        bet.status = 'lost';
        bet.winnings = 0;
        this.results.push({
          userId: bet.userId,
          roundId: bet.roundId,
          finalMultiplier: this.currentRound!.crashPoint,
          resultType: 'loss',
          winnings: 0,
        });
      });
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

interface Bet {
  id: number;
  userId: number;
  roundId: number;
  amount: number;
  placedAt: Date;
  cashoutMultiplier?: number;
  winnings?: number;
  status: 'active' | 'cashed_out' | 'lost';
}

interface RoundResult {
  userId: number;
  roundId: number;
  finalMultiplier: number;
  resultType: 'win' | 'loss';
  winnings: number;
}
