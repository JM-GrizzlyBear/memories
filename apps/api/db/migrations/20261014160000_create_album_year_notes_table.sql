-- migrate:up
-- A short line someone writes about one year of their album ("The year we said yes to everything")
CREATE TABLE album_year_notes (
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  year       INT         NOT NULL CHECK (year BETWEEN 1900 AND 2200),
  note       TEXT        NOT NULL CHECK (char_length(note) BETWEEN 1 AND 160),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year)
);

-- migrate:down
DROP TABLE IF EXISTS album_year_notes;
