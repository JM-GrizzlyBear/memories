-- migrate:up
-- Match the form limits in @memories/shared (title 350, place 150)
ALTER TABLE memories
  ALTER COLUMN title TYPE VARCHAR(350),
  ALTER COLUMN location TYPE VARCHAR(150);

-- migrate:down
ALTER TABLE memories
  ALTER COLUMN title TYPE VARCHAR(120),
  ALTER COLUMN location TYPE VARCHAR(120);
