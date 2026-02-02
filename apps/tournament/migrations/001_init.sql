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
  user_id         BIGINT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'player',
  score           NUMERIC(18, 4) NOT NULL DEFAULT 0,
  rank            INTEGER,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  user_id         BIGINT NOT NULL,
  perk_type       TEXT NOT NULL,
  perk_value      TEXT NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  source          TEXT NOT NULL
);

CREATE INDEX idx_tournaments_season ON tournaments(season_id);
CREATE INDEX idx_tournament_participation_tournament ON tournament_participation(tournament_id, score DESC);
CREATE INDEX idx_user_perks_user ON user_perks(user_id, starts_at DESC);
