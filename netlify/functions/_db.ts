import { neon, neonConfig } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Trim and remove any spaces from the DATABASE_URL
const databaseUrl = process.env.DATABASE_URL.trim().replace(/\s+/g, '');
console.log('Database URL configured (first 50 chars):', databaseUrl.substring(0, 50) + '...');

neonConfig.fetchConnectionCache = true;
export const sql = neon(databaseUrl);