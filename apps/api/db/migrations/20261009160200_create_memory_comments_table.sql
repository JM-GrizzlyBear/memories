-- migrate:up
CREATE TABLE memory_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id  UUID        NOT NULL REFERENCES memories (id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body       TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A memory's comments, oldest first
CREATE INDEX idx_memory_comments_memory ON memory_comments (memory_id, created_at);

-- migrate:down
DROP TABLE IF EXISTS memory_comments;
