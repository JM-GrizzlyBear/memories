-- migrate:up
-- Settings → Privacy → "Who can message me?"
ALTER TABLE users
  ADD COLUMN message_privacy TEXT NOT NULL DEFAULT 'friends'
  CHECK (message_privacy IN ('friends', 'anyone'));

-- migrate:down
ALTER TABLE users DROP COLUMN IF EXISTS message_privacy;
