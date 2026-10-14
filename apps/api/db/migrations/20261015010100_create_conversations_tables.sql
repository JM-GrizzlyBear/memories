-- migrate:up
-- A chat: between two people ("direct") or a group
CREATE TABLE conversations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            TEXT        NOT NULL CHECK (kind IN ('direct', 'group')),
  -- Two people have only one direct chat: "smallerId:largerId"
  direct_key      TEXT        UNIQUE,
  name            VARCHAR(80),
  photo_url       TEXT,
  photo_key       TEXT,
  created_by      UUID        REFERENCES users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- When the last message arrived (null = nothing sent yet, so it's not listed)
  last_message_at TIMESTAMPTZ,
  CHECK ((kind = 'direct') = (direct_key IS NOT NULL))
);

-- Who is in a chat, and how each person sees it
CREATE TABLE conversation_members (
  conversation_id UUID        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- request = waiting for them to accept; declined = they said no (it's in their archive)
  status          TEXT        NOT NULL DEFAULT 'accepted'
                  CHECK (status IN ('accepted', 'request', 'declined')),
  role            TEXT        NOT NULL DEFAULT 'member'
                  CHECK (role IN ('admin', 'moderator', 'member')),
  archived        BOOLEAN     NOT NULL DEFAULT false,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  added_by        UUID        REFERENCES users (id) ON DELETE SET NULL,
  -- Everything up to here has been seen
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conversation_members_user ON conversation_members (user_id);

CREATE TABLE messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id       UUID        REFERENCES users (id) ON DELETE SET NULL,
  kind            TEXT        NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'system')),
  body            TEXT        NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
  -- For system lines: what happened ("added", "left", "renamed"...) and to whom
  event           TEXT,
  target_user_id  UUID        REFERENCES users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  edited_at       TIMESTAMPTZ,
  unsent_at       TIMESTAMPTZ,
  CHECK ((kind = 'system') = (event IS NOT NULL))
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC, id DESC);

CREATE TABLE message_photos (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID     NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  url         TEXT     NOT NULL,
  storage_key TEXT     NOT NULL,
  position    SMALLINT NOT NULL CHECK (position BETWEEN 0 AND 9),
  UNIQUE (message_id, position)
);

-- migrate:down
DROP TABLE IF EXISTS message_photos;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversation_members;
DROP TABLE IF EXISTS conversations;
