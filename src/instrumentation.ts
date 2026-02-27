export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run migrations on server startup using @kilocode/app-builder-db
    const { runMigrations } = await import("@kilocode/app-builder-db");
    const { getDb } = await import("@/db");
    
    const db = getDb();
    await runMigrations(db, {}, { migrationsFolder: "./src/db/migrations" });
    console.log("✅ Database migrations completed on startup");
  }
}
