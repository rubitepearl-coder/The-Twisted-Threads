import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

// Use local file-based SQLite for development
// This creates a local database file that persists
const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const token = process.env.TURSO_AUTH_TOKEN || undefined;

// Lazy initialization
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDbInternal() {
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
