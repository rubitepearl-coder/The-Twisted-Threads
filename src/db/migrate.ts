import { runMigrations } from "@kilocode/app-builder-db";
import { getDb } from "./index";

const db = getDb();
await runMigrations(db, {}, { migrationsFolder: "./src/db/migrations" });
console.log("✅ Migrations completed");
