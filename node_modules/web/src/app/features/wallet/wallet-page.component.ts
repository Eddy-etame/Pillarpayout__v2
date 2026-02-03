import { Component } from '@angular/core';

@Component({
  selector: 'app-wallet-page',
  standalone: true,
  template: `
    <section>
      <h1>Wallet</h1>
      <p>Balances, deposits, and withdrawals will be shown here.</p>
    </section>
  `
})
export class WalletPageComponent {}
