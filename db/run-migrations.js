const { Client } = require('@neondatabase/serverless');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📦 Running schema migrations...');
    await client.query(schema);
    console.log('✅ Schema created successfully');

    // Run categories seed
    const categoriesPath = path.join(__dirname, 'categories_seed.sql');
    const categories = fs.readFileSync(categoriesPath, 'utf8');
    
    console.log('🌱 Seeding categories...');
    await client.query(categories);
    console.log('✅ Categories seeded successfully');

    // Run sample data seeds
    const humanSeedPath = path.join(__dirname, 'seeds', 'human_passages_sample.sql');
    if (fs.existsSync(humanSeedPath)) {
      const humanSeed = fs.readFileSync(humanSeedPath, 'utf8');
      console.log('📚 Seeding human passages...');
      await client.query(humanSeed);
      console.log('✅ Human passages seeded successfully');
    }

    const aiSeedPath = path.join(__dirname, 'seeds', 'ai_passages_sample.sql');
    if (fs.existsSync(aiSeedPath)) {
      const aiSeed = fs.readFileSync(aiSeedPath, 'utf8');
      console.log('🤖 Seeding AI passages...');
      await client.query(aiSeed);
      console.log('✅ AI passages seeded successfully');
    }

    console.log('\n🎉 All migrations completed successfully!');
    console.log('📊 Database is ready for use');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();