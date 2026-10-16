import * as dotenv from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { hasSupabaseRuntimeConfig } from '../lib/supabase.ts';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER && process.env.SQL_PASSWORD) {
    if (!global._postgresPool) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });

      global._postgresPool.on('error', (err) => {
        console.error('Unexpected error on idle SQL pool client:', err);
      });
    }
    return global._postgresPool;
  }

  if (global._postgresPool) {
    console.warn('SQL configuration is missing. Clearing stale PostgreSQL pool in offline demo mode.');
    global._postgresPool.end().catch(() => undefined);
    global._postgresPool = undefined;
  }

  if (!hasSupabaseRuntimeConfig()) {
    console.warn('SQL configuration is missing. Starting in offline demo mode.');
  }
  return undefined as unknown as Pool;
};

const pool = createPool();

export const db = pool ? drizzle(pool, { schema }) : null;

export function getDbOrThrow() {
  const resolvedPool = createPool();
  const resolvedDb = resolvedPool ? drizzle(resolvedPool, { schema }) : null;

  if (!resolvedDb) {
    throw new Error(
      'No SQL database is configured. Please add SQL_HOST, SQL_DB_NAME, SQL_USER, and SQL_PASSWORD before writing participant data.'
    );
  }
  return resolvedDb;
}

export function requireSqlDbForWrite(operation: string) {
  const resolvedDb = createPool() ? drizzle(createPool(), { schema }) : null;

  if (!resolvedDb) {
    throw new Error(
      `No SQL database is configured. Please add SQL_HOST, SQL_DB_NAME, SQL_USER, and SQL_PASSWORD before ${operation}.`
    );
  }

  return resolvedDb;
}

export { pool };
