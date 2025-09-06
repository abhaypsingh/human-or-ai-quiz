const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkConstraints() {
  const databaseUrl = process.env.DATABASE_URL.trim().replace(/\s+/g, '');
  const sql = neon(databaseUrl);

  try {
    // Check table constraints
    const constraints = await sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'passages'::regclass
    `;
    
    console.log('Passages table constraints:');
    constraints.forEach(c => {
      console.log(`- ${c.constraint_name}: ${c.constraint_definition}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkConstraints();