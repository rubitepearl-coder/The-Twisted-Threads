import { migrate } from "drizzle-orm/libsql/migrator";
import { getDb } from "./index";

async function runMigrations() {
  const db = getDb();
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("✅ Migrations completed");
}

runMigrations().catch(console.error);
