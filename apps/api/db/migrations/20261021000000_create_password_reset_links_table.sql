-- migrate:up
-- "Forgot password" links. Only a SHA-256 hash of each link's secret is stored.
CREATE TABLE password_reset_links (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_links_user ON password_reset_links (user_id);

-- migrate:down
DROP TABLE password_reset_links;
