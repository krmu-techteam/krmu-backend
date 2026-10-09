import 'dotenv/config';
import { Pool } from 'pg';

const requiredEnv = [
  'PG_HOST',
  'PG_USERNAME',
  'POSTGRES_PASSWORD',
  'PG_DATABASE',
] as const;

// Validate required environment variables
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required PostgreSQL environment variable: ${key}`);
  }
}

// PostgreSQL connection pool
export const postgresDb = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.PG_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.PG_DATABASE,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Connection established
postgresDb.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

// Pool errors
postgresDb.on('error', (error) => {
  console.error('❌ PostgreSQL pool error:', error);
});
