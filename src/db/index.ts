import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

// Determine database URL and credentials
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

// Log which database we're using (for debugging)
if (url) {
  console.log("[DB] Using Turso cloud database");
  if (token) {
    console.log("[DB] Turso auth token is set");
  } else {
    console.log("[DB] WARNING: Turso auth token is NOT set!");
  }
} else {
  console.log("[DB] Using local SQLite file (no TURSO_DATABASE_URL set)");
}

// Test the connection
let _client: ReturnType<typeof createClient> | null = null;
let _connectionTested = false;
let _connectionError: string | null = null;

function testConnection() {
  if (_connectionTested) return;
  _connectionTested = true;
  
  try {
    const client = createClient({
      url: url || "file:local.db",
      authToken: token,
    });
    
    // Test the connection
    client.execute("SELECT 1").then(() => {
      console.log("[DB] Connection test successful");
    }).catch((err) => {
      console.error("[DB] Connection test failed:", err.message);
      _connectionError = err.message;
    });
  } catch (err: any) {
    console.error("[DB] Client creation failed:", err.message);
    _connectionError = err.message;
  }
}

// Lazy initialization
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDbInternal() {
  if (!_db) {
    testConnection();
    
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

export function getDbInfo() {
  return {
    url: url || "file:local.db",
    hasUrl: !!url,
    hasToken: !!token,
    error: _connectionError,
  };
}

// Backwards-compatible export - use getDb() in new code
export const db = getDbInternal();

// Re-export schema helpers
export { eq, schema };