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
  user_id         BIGINT NOT NULL,
  round_id        BIGINT NOT NULL REFERENCES game_rounds(id),
  amount          NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  placed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cashout_multiplier NUMERIC(10, 4),
  winnings        NUMERIC(18, 4),
  status          TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE round_results (
  user_id         BIGINT NOT NULL,
  round_id        BIGINT NOT NULL REFERENCES game_rounds(id),
  final_multiplier NUMERIC(10, 4) NOT NULL,
  result_type     TEXT NOT NULL,
  winnings        NUMERIC(18, 4) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, round_id)
);

CREATE INDEX idx_game_rounds_status ON game_rounds(status, started_at DESC);
CREATE INDEX idx_bets_round_user ON bets(round_id, user_id);
