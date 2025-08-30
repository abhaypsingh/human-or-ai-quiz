-- Add password_hash column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add name column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update existing users to have a default password (they'll need to reset)
-- This is only for migration purposes
UPDATE users 
SET password_hash = '$2a$10$YourDefaultHashHere' 
WHERE password_hash IS NULL;