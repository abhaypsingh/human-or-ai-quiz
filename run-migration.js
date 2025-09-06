const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting migration runner...');
  
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set DATABASE_URL in your .env file or environment');
    process.exit(1);
  }

  // Clean up the DATABASE_URL (remove any spaces)
  const databaseUrl = process.env.DATABASE_URL.trim().replace(/\s+/g, '');
  console.log('📊 Connecting to database...');
  console.log('   URL preview:', databaseUrl.substring(0, 50) + '...');

  const sql = neon(databaseUrl);

  try {
    console.log('\n🔄 Making user_id nullable in game_sessions table...');
    await sql`ALTER TABLE game_sessions ALTER COLUMN user_id DROP NOT NULL`;
    console.log('   ✅ game_sessions.user_id is now nullable');

    console.log('\n🔄 Making user_id nullable in guesses table...');
    await sql`ALTER TABLE guesses ALTER COLUMN user_id DROP NOT NULL`;
    console.log('   ✅ guesses.user_id is now nullable');

    console.log('\n🔄 Creating index for anonymous sessions...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_sessions_id_status 
      ON game_sessions(id, status) 
      WHERE user_id IS NULL
    `;
    console.log('   ✅ Index idx_game_sessions_id_status created');

    console.log('\n🔄 Creating index for guesses by session_id...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_guesses_session_id 
      ON guesses(session_id)
    `;
    console.log('   ✅ Index idx_guesses_session_id created');

    console.log('\n🔄 Adding column comments...');
    await sql`
      COMMENT ON COLUMN game_sessions.user_id IS 'User ID for authenticated sessions, NULL for anonymous sessions'
    `;
    await sql`
      COMMENT ON COLUMN guesses.user_id IS 'User ID for authenticated guesses, NULL for anonymous sessions'
    `;
    console.log('   ✅ Comments added');

    console.log('\n🔍 Verifying migration...');
    
    // Verify the changes for game_sessions
    const verifyGameSessions = await sql`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'game_sessions' 
      AND column_name = 'user_id'
    `;

    // Verify the changes for guesses
    const verifyGuesses = await sql`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'guesses' 
      AND column_name = 'user_id'
    `;

    let success = true;
    
    if (verifyGameSessions.length > 0) {
      const isNullable = verifyGameSessions[0].is_nullable;
      if (isNullable === 'YES') {
        console.log('   ✅ game_sessions.user_id is nullable');
      } else {
        console.log('   ❌ game_sessions.user_id is still NOT NULL');
        success = false;
      }
    }

    if (verifyGuesses.length > 0) {
      const isNullable = verifyGuesses[0].is_nullable;
      if (isNullable === 'YES') {
        console.log('   ✅ guesses.user_id is nullable');
      } else {
        console.log('   ❌ guesses.user_id is still NOT NULL');
        success = false;
      }
    }

    // Check indexes
    const indexResult = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('game_sessions', 'guesses')
      AND indexname IN ('idx_game_sessions_id_status', 'idx_guesses_session_id')
    `;

    console.log(`   ✅ Found ${indexResult.length} indexes:`);
    indexResult.forEach(idx => {
      console.log(`      - ${idx.indexname}`);
    });

    if (success) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('The database now supports anonymous sessions.');
    } else {
      console.log('\n⚠️ Migration completed with warnings. Please check the output above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    
    // If it's a "column is already nullable" error, that's okay
    if (error.message && error.message.includes('already')) {
      console.log('\n✅ It looks like the migration may have already been applied.');
    }
    
    process.exit(1);
  }

  process.exit(0);
}

// Run the migration
runMigration();