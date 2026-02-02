CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE sessions (
  session_id      UUID PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  ip_address      INET,
  user_agent      TEXT
);

CREATE TABLE login_attempts (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT,
  email_used      CITEXT,
  ip_address      INET,
  success         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE verification_codes (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  code_hash       TEXT NOT NULL,
  purpose         TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ
);

CREATE TABLE password_reset_requests (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL,
  code_hash       TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_expires ON sessions(user_id, expires_at);
CREATE INDEX idx_login_attempts_email ON login_attempts(email_used, created_at DESC);
CREATE INDEX idx_verification_user_expires ON verification_codes(user_id, expires_at);
CREATE INDEX idx_password_reset_user_expires ON password_reset_requests(user_id, expires_at);
