import { Routes } from '@angular/router';
import { AdminPageComponent } from './features/admin/admin-page.component';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { GamePageComponent } from './features/game/game-page.component';
import { ProfilePageComponent } from './features/profile/profile-page.component';
import { SupportPageComponent } from './features/support/support-page.component';
import { TournamentPageComponent } from './features/tournament/tournament-page.component';
import { WalletPageComponent } from './features/wallet/wallet-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'game' },
  { path: 'auth', component: AuthPageComponent },
  { path: 'game', component: GamePageComponent },
  { path: 'wallet', component: WalletPageComponent },
  { path: 'tournaments', component: TournamentPageComponent },
  { path: 'admin', component: AdminPageComponent },
  { path: 'profile', component: ProfilePageComponent },
  { path: 'support', component: SupportPageComponent }
];
