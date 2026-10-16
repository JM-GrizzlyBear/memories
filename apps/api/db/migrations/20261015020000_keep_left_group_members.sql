-- migrate:up
-- Leaving a group (or being removed) keeps you in it as "left" / "removed", like Messenger:
-- the chat stays in your list with everything up to the moment you left
ALTER TABLE conversation_members DROP CONSTRAINT conversation_members_status_check;
ALTER TABLE conversation_members ADD CONSTRAINT conversation_members_status_check
  CHECK (status IN ('accepted', 'request', 'declined', 'left', 'removed'));
ALTER TABLE conversation_members ADD COLUMN left_at TIMESTAMPTZ;

-- migrate:down
DELETE FROM conversation_members WHERE status IN ('left', 'removed');
ALTER TABLE conversation_members DROP COLUMN IF EXISTS left_at;
ALTER TABLE conversation_members DROP CONSTRAINT conversation_members_status_check;
ALTER TABLE conversation_members ADD CONSTRAINT conversation_members_status_check
  CHECK (status IN ('accepted', 'request', 'declined'));
