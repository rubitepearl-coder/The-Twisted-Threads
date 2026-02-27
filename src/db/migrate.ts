import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:petals.db",
  authToken: process.env.TURSO_AUTH_TOKEN
});
const db = drizzle(libsql, { schema });

await migrate(db, { migrationsFolder: "./src/db/migrations" });
console.log("✅ Migrations completed");
