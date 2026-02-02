CREATE TABLE wallets (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  currency        TEXT NOT NULL,
  balance         NUMERIC(18, 4) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
  id              BIGSERIAL PRIMARY KEY,
  wallet_id       BIGINT NOT NULL REFERENCES wallets(id),
  type            TEXT NOT NULL,
  amount          NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  reference       TEXT,
  status          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ledger_entries (
  id              BIGSERIAL PRIMARY KEY,
  transaction_id  BIGINT NOT NULL REFERENCES wallet_transactions(id),
  account         TEXT NOT NULL,
  debit           NUMERIC(18, 4) NOT NULL DEFAULT 0,
  credit          NUMERIC(18, 4) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id, created_at DESC);
