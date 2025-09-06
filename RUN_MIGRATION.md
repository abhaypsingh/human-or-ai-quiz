# Database Migration Required

## Important: Run Migration 003

The application now supports anonymous sessions (no authentication required). To enable this, you need to run the following migration on your Neon database:

### Steps to Run the Migration:

1. **Open Neon Console**
   - Go to your Neon project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy and paste the contents of `migrations/003_allow_anonymous_sessions.sql`
   - Execute the SQL commands

3. **Verify the Migration**
   Run this query to verify the changes:
   ```sql
   SELECT column_name, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'game_sessions' 
   AND column_name = 'user_id';
   ```
   
   The `is_nullable` column should show `YES`.

### What This Migration Does:

- Makes `user_id` nullable in `game_sessions` table
- Makes `user_id` nullable in `guesses` table
- Adds indexes for better performance with anonymous sessions
- Adds documentation comments to the columns

### Alternative: Direct SQL

If you prefer, you can run this SQL directly in the Neon SQL Editor:

```sql
-- Make user_id nullable in game_sessions table
ALTER TABLE game_sessions 
ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable in guesses table
ALTER TABLE guesses 
ALTER COLUMN user_id DROP NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_id_status 
ON game_sessions(id, status) 
WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_guesses_session_id 
ON guesses(session_id);
```

After running this migration, the application will support both:
- Anonymous sessions (no login required)
- Authenticated sessions (if authentication is re-enabled in the future)