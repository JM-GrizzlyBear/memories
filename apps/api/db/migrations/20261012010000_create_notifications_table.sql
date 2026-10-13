-- migrate:up
CREATE TABLE notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  actor_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type         TEXT        NOT NULL
               CHECK (type IN ('friend_request', 'friend_accepted', 'memory_liked', 'memory_commented')),
  -- Kept (as NULL) when the memory or comment is deleted, so the notification
  -- can say "this isn't available anymore" instead of disappearing
  memory_id    UUID        REFERENCES memories (id) ON DELETE SET NULL,
  comment_id   UUID        REFERENCES memory_comments (id) ON DELETE SET NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (recipient_id <> actor_id)
);

-- One notification per person and thing: liking twice, or asking again after cancelling,
-- brings the same notification back to the top instead of adding another one.
-- (Comments are not in this list: every comment is its own notification.)
CREATE UNIQUE INDEX uniq_notifications_grouped
  ON notifications (recipient_id, actor_id, type, memory_id) NULLS NOT DISTINCT
  WHERE type IN ('friend_request', 'friend_accepted', 'memory_liked');

-- "My notifications, newest first" and "how many are unread"
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, created_at DESC, id DESC);
CREATE INDEX idx_notifications_unread ON notifications (recipient_id) WHERE read_at IS NULL;

-- migrate:down
DROP TABLE IF EXISTS notifications;
