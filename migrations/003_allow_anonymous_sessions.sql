-- Migration: Allow anonymous sessions by making user_id nullable
-- Date: 2025-01-14
-- Purpose: Support session-based gameplay without requiring authentication

-- Make user_id nullable in game_sessions table
ALTER TABLE game_sessions 
ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable in guesses table
ALTER TABLE guesses 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for session-based queries without user_id
CREATE INDEX IF NOT EXISTS idx_game_sessions_id_status 
ON game_sessions(id, status) 
WHERE user_id IS NULL;

-- Add index for guesses by session_id
CREATE INDEX IF NOT EXISTS idx_guesses_session_id 
ON guesses(session_id);

-- Update any existing constraints to handle NULL user_id
-- No action needed as foreign key constraints already allow NULL by default

COMMENT ON COLUMN game_sessions.user_id IS 'User ID for authenticated sessions, NULL for anonymous sessions';
COMMENT ON COLUMN guesses.user_id IS 'User ID for authenticated guesses, NULL for anonymous sessions';