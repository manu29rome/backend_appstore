import { Pool } from 'pg';
import { env } from './env';

let pool: Pool | null = null;

export async function initializePool(): Promise<void> {
  try {
    const base = { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000 };
    pool = process.env.DATABASE_URL
      ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, ...base })
      : new Pool({ host: env.DB_HOST, port: env.DB_PORT, database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD, ...base });
    const client = await pool.connect();
    client.release();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

export function getPool(): Pool {
  if (!pool) throw new Error('Database pool not initialized. Call initializePool() first.');
  return pool;
}
