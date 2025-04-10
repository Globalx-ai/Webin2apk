import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Supabase PostgreSQL connection string
// Using environment variables for security
const SUPABASE_DB_URL = process.env.DATABASE_URL || "postgresql://postgres:[YOUR-PASSWORD]@db.uneyiahmoeiytepogvpc.supabase.co:5432/postgres";

// Create a connection pool
export const pool = new Pool({ 
  connectionString: SUPABASE_DB_URL,
  max: 20, // Set max pool size
  idleTimeoutMillis: 30000, // Idle timeout
  connectionTimeoutMillis: 5000 // Connection timeout
});

// Initialize Drizzle ORM with our schema
export const db = drizzle({ client: pool, schema });

console.log("Supabase PostgreSQL database connection initialized");
