import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

// Server-side only: Access environment variables
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

// Lazy initialization - only runs on server
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDbInternal() {
  if (!_db) {
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
export const db = getDbInternal();

// Re-export schema helpers
export { eq, schema };