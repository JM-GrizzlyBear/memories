-- migrate:up
CREATE TABLE memory_likes (
  memory_id  UUID        NOT NULL REFERENCES memories (id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (memory_id, user_id) -- one like per person per memory
);

-- "Memories I liked" lookups
CREATE INDEX idx_memory_likes_user ON memory_likes (user_id);

-- migrate:down
DROP TABLE IF EXISTS memory_likes;
