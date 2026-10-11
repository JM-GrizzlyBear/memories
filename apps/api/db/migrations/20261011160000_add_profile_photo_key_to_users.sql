-- migrate:up
-- Where the profile photo is stored (Cloudinary id or local file name), so it can be deleted later
ALTER TABLE users ADD COLUMN profile_photo_key TEXT;

-- migrate:down
ALTER TABLE users DROP COLUMN IF EXISTS profile_photo_key;