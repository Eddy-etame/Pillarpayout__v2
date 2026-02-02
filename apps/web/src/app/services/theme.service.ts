import { Injectable } from '@angular/core';
import { TournamentService } from './tournament.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor(private tournamentService: TournamentService) {}

  applyActiveSeasonTheme() {
    this.tournamentService.getActiveSeason().subscribe({
      next: (response: any) => {
        const themeKey = response?.data?.themeKey ?? 'default';
        document.documentElement.setAttribute('data-theme', themeKey);
      }
    });
  }
}
