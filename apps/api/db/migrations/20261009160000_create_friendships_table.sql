-- migrate:up
CREATE TABLE friendships (
  requester_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  addressee_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at  TIMESTAMPTZ,
  PRIMARY KEY (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

-- One row per pair of people, whoever asked first (A→B and B→A can't both exist)
CREATE UNIQUE INDEX uniq_friendships_pair
  ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

-- "Requests sent to me" and "my friends" lookups
CREATE INDEX idx_friendships_addressee ON friendships (addressee_id, status);

-- migrate:down
DROP TABLE IF EXISTS friendships;
