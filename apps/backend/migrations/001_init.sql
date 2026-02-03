CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users_base (
  id              BIGSERIAL PRIMARY KEY,
  email           CITEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  salt            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  session_id      UUID PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  ip_address      INET,
  user_agent      TEXT
);

CREATE TABLE roles (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT UNIQUE NOT NULL
);

CREATE TABLE permissions (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT UNIQUE NOT NULL
);

CREATE TABLE user_roles (
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
  role_id         BIGINT NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id         BIGINT NOT NULL REFERENCES roles(id),
  permission_id   BIGINT NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE wallets (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
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

CREATE TABLE game_rounds (
  id              BIGSERIAL PRIMARY KEY,
  crash_point     NUMERIC(10, 4) NOT NULL,
  server_seed     TEXT NOT NULL,
  client_seed     TEXT NOT NULL,
  nonce           BIGINT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'running'
);

CREATE TABLE bets (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
  round_id        BIGINT NOT NULL REFERENCES game_rounds(id),
  amount          NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  placed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cashout_multiplier NUMERIC(10, 4),
  winnings        NUMERIC(18, 4),
  status          TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE round_results (
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
  round_id        BIGINT NOT NULL REFERENCES game_rounds(id),
  final_multiplier NUMERIC(10, 4) NOT NULL,
  result_type     TEXT NOT NULL,
  winnings        NUMERIC(18, 4) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, round_id)
);

CREATE TABLE insurance_products (
  id              BIGSERIAL PRIMARY KEY,
  type            TEXT NOT NULL,
  premium_rate    NUMERIC(5, 4) NOT NULL,
  coverage_rate   NUMERIC(5, 4) NOT NULL,
  min_bet         NUMERIC(18, 4) NOT NULL,
  max_bet         NUMERIC(18, 4) NOT NULL
);

CREATE TABLE insurance_purchases (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
  bet_id          BIGINT NOT NULL REFERENCES bets(id),
  product_id      BIGINT NOT NULL REFERENCES insurance_products(id),
  premium_paid    NUMERIC(18, 4) NOT NULL,
  coverage_amount NUMERIC(18, 4) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at      TIMESTAMPTZ
);

CREATE TABLE login_attempts (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT REFERENCES users_base(id),
  email_used      CITEXT,
  ip_address      INET,
  success         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE verification_codes (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
  code_hash       TEXT NOT NULL,
  purpose         TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ
);

CREATE TABLE password_reset_requests (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT,
  code_hash       TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ
);

CREATE TABLE admin_actions (
  id              BIGSERIAL PRIMARY KEY,
  admin_id        BIGINT NOT NULL REFERENCES users_base(id),
  action_type     TEXT NOT NULL,
  target_type     TEXT NOT NULL,
  target_id       TEXT,
  details         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seasons (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  theme_key       TEXT NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE tournaments (
  id              BIGSERIAL PRIMARY KEY,
  season_id       BIGINT NOT NULL REFERENCES seasons(id),
  type            TEXT NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  entry_fee       NUMERIC(18, 4) NOT NULL DEFAULT 0,
  prize_pool      NUMERIC(18, 4) NOT NULL DEFAULT 0,
  house_cut       NUMERIC(5, 4) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'scheduled'
);

CREATE TABLE tournament_participation (
  id              BIGSERIAL PRIMARY KEY,
  tournament_id   BIGINT NOT NULL REFERENCES tournaments(id),
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
  role            TEXT NOT NULL DEFAULT 'player',
  score           NUMERIC(18, 4) NOT NULL DEFAULT 0,
  rank            INTEGER,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tournament_participation_unique
  ON tournament_participation(tournament_id, user_id);

CREATE TABLE tournament_rewards (
  id              BIGSERIAL PRIMARY KEY,
  tournament_id   BIGINT NOT NULL REFERENCES tournaments(id),
  rank_min        INTEGER NOT NULL,
  rank_max        INTEGER NOT NULL,
  reward_type     TEXT NOT NULL,
  reward_value    TEXT NOT NULL
);

CREATE TABLE user_perks (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users_base(id),
  perk_type       TEXT NOT NULL,
  perk_value      TEXT NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  source          TEXT NOT NULL
);

CREATE TABLE profit_events (
  id          BIGSERIAL PRIMARY KEY,
  type        TEXT NOT NULL,
  amount      NUMERIC(18, 4) NOT NULL,
  currency    TEXT NOT NULL,
  source      TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_user_expires ON sessions(user_id, expires_at);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_game_rounds_status ON game_rounds(status, started_at DESC);
CREATE INDEX idx_bets_round_user ON bets(round_id, user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email_used, created_at DESC);
CREATE INDEX idx_verification_user_expires ON verification_codes(user_id, expires_at);
CREATE INDEX idx_password_reset_user_expires ON password_reset_requests(user_id, expires_at);
CREATE INDEX idx_tournaments_season ON tournaments(season_id);
CREATE INDEX idx_tournament_participation_tournament ON tournament_participation(tournament_id, score DESC);
CREATE INDEX idx_user_perks_user ON user_perks(user_id, starts_at DESC);
CREATE INDEX idx_profit_events_type ON profit_events(type);
CREATE INDEX idx_profit_events_time ON profit_events(occurred_at DESC);
