import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Support both DATABASE_URL and SUPABASE_DATABASE_URL for flexibility
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with SSL support for production/external databases
const isProduction = process.env.NODE_ENV === 'production';
const isExternalDb = databaseUrl.includes('supabase') || 
                     databaseUrl.includes('render') ||
                     databaseUrl.includes('pooler') ||
                     process.env.USE_SSL === 'true';

const sslConfig = (isProduction || isExternalDb) ? { rejectUnauthorized: false } : undefined;

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
