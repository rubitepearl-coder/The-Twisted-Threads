import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Use local SQLite file - works in both dev and production
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:petals.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});
export const db = drizzle(libsql, { schema });
