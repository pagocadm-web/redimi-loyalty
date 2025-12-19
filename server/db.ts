import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("sslmode=require") 
    ? { rejectUnauthorized: false } 
    : undefined,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for direct access if needed
export { pool };

