import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

// Create client using environment variables for Turso
// TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env.local
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.warn("⚠️  Turso credentials not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local");
}

// Lazy initialization
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDbInternal() {
  if (!url || !token) {
    throw new Error("Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local");
  }
  if (!_db) {
    const client = createClient({
      url,
      authToken: token,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export function getDb() {
  return getDbInternal();
}

// Backwards-compatible export (deprecated - use getDb() instead)
export const db = {
  get query() { return getDbInternal().query; },
  get insert() { return getDbInternal().insert; },
  get update() { return getDbInternal().update; },
  get delete() { return getDbInternal().delete; },
  get select() { return getDbInternal().select; },
};

// Re-export schema helpers
export { eq, schema };
