const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkDatabase() {
  console.log('🔍 Checking database content...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL.trim().replace(/\s+/g, '');
  const sql = neon(databaseUrl);

  try {
    // Check passages table
    console.log('📚 Checking passages table...');
    const passageCount = await sql`SELECT COUNT(*) as count FROM passages`;
    console.log(`   Total passages: ${passageCount[0].count}`);
    
    if (passageCount[0].count > 0) {
      const passagesByType = await sql`
        SELECT source_type, COUNT(*) as count 
        FROM passages 
        GROUP BY source_type
      `;
      console.log('   Passages by type:');
      passagesByType.forEach(row => {
        console.log(`     - ${row.source_type}: ${row.count}`);
      });
      
      // Get a sample passage
      const sample = await sql`SELECT id, LEFT(text, 100) as preview FROM passages LIMIT 1`;
      if (sample.length > 0) {
        console.log(`   Sample passage (ID ${sample[0].id}): "${sample[0].preview}..."`);
      }
    } else {
      console.log('   ⚠️ No passages found in the database!');
      console.log('   The database needs to be populated with quiz content.');
    }

    // Check categories table
    console.log('\n📂 Checking categories table...');
    const categories = await sql`SELECT id, name FROM categories`;
    console.log(`   Total categories: ${categories.length}`);
    if (categories.length > 0) {
      console.log('   Categories:');
      categories.forEach(cat => {
        console.log(`     - [${cat.id}] ${cat.name}`);
      });
    } else {
      console.log('   ⚠️ No categories found!');
    }

    // Check game_sessions table
    console.log('\n🎮 Checking game_sessions table...');
    const sessionCount = await sql`SELECT COUNT(*) as count FROM game_sessions`;
    console.log(`   Total sessions: ${sessionCount[0].count}`);
    
    const recentSessions = await sql`
      SELECT id, status, questions_answered, score, created_at 
      FROM game_sessions 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    if (recentSessions.length > 0) {
      console.log('   Recent sessions:');
      recentSessions.forEach(session => {
        console.log(`     - ${session.id.substring(0, 8)}... (${session.status}) - Score: ${session.score}/${session.questions_answered}`);
      });
    }

    // Check guesses table
    console.log('\n✅ Checking guesses table...');
    const guessCount = await sql`SELECT COUNT(*) as count FROM guesses`;
    console.log(`   Total guesses: ${guessCount[0].count}`);
    
    if (guessCount[0].count > 0) {
      const accuracy = await sql`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
        FROM guesses
      `;
      const acc = accuracy[0];
      const percentage = acc.total > 0 ? ((acc.correct / acc.total) * 100).toFixed(1) : 0;
      console.log(`   Overall accuracy: ${acc.correct}/${acc.total} (${percentage}%)`);
    }

    // Summary
    console.log('\n📊 Database Summary:');
    if (passageCount[0].count === 0) {
      console.log('   ❌ Database needs content! No passages found.');
      console.log('   To populate the database, you need to:');
      console.log('   1. Add categories to the categories table');
      console.log('   2. Add passages (both AI and human) to the passages table');
      console.log('   3. Make sure each passage has a source_type ("ai" or "human")');
    } else {
      console.log('   ✅ Database has content and is ready to use!');
    }

  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

checkDatabase();