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

CREATE TABLE players (
  CHECK (status IN ('active', 'blocked', 'suspended'))
) INHERITS (users_base);

CREATE TABLE admins (
  CHECK (status IN ('active', 'disabled'))
) INHERITS (users_base);

CREATE TABLE roles (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT UNIQUE NOT NULL
);

CREATE TABLE permissions (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT UNIQUE NOT NULL
);

CREATE TABLE user_roles (
  user_id         BIGINT NOT NULL,
  role_id         BIGINT NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id         BIGINT NOT NULL REFERENCES roles(id),
  permission_id   BIGINT NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_users_email ON users_base(email);
