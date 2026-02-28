import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

// Determine database URL and credentials
// In Vercel production: must use TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
// In local development: use local file if env vars not set
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

// Log which database we're using (for debugging)
if (url) {
  console.log("[DB] Using Turso cloud database");
} else {
  console.log("[DB] Using local SQLite file (no TURSO_DATABASE_URL set)");
}

// Lazy initialization
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDbInternal() {
  if (!_db) {
    if (!url) {
      // Fall back to local file for development
      console.log("[DB] Initializing local database: file:local.db");
    }
    const client = createClient({
      url: url || "file:local.db",
      authToken: token,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export function getDb() {
  return getDbInternal();
}

// Backwards-compatible export - use getDb() in new code
// This provides the same interface as the old db export
export const db = getDbInternal();

// Re-export schema helpers
export { eq, schema };
