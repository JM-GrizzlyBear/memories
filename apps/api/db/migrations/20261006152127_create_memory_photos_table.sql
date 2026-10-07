-- migrate:up
CREATE TABLE memory_photos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id   UUID        NOT NULL REFERENCES memories (id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  storage_key TEXT        NOT NULL,
  position    SMALLINT    NOT NULL CHECK (position BETWEEN 0 AND 9),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (memory_id, position)
);

-- migrate:down
DROP TABLE IF EXISTS memory_photos;