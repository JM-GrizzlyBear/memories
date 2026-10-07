-- migrate:up
CREATE TABLE memories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       VARCHAR(120) NOT NULL,
  story       TEXT         NOT NULL,
  memory_date DATE         NOT NULL,
  location    VARCHAR(120),
  visibility  TEXT         NOT NULL DEFAULT 'friends'
              CHECK (visibility IN ('public', 'friends', 'private')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_memories_user_date ON memories (user_id, memory_date DESC);
CREATE INDEX idx_memories_created ON memories (created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS memories;