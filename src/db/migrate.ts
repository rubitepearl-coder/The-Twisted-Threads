import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const sqlite = new Database("petals.db");
const db = drizzle(sqlite, { schema });

await migrate(db, { migrationsFolder: "./src/db/migrations" });
console.log("✅ Migrations completed");
