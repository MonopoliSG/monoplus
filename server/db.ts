import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with SSL support for production/external databases
const isProduction = process.env.NODE_ENV === 'production';
const isExternalDb = process.env.DATABASE_URL.includes('supabase') || 
                     process.env.DATABASE_URL.includes('render') ||
                     process.env.DATABASE_URL.includes('pooler') ||
                     process.env.USE_SSL === 'true';

const sslConfig = (isProduction || isExternalDb) ? { rejectUnauthorized: false } : undefined;

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
