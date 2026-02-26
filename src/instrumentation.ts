export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("@kilocode/app-builder-db");
    const { db } = await import("@/db");
    try {
      await runMigrations(db, {}, { migrationsFolder: "./src/db/migrations" });
      console.log("✅ Database migrations completed");
    } catch (err) {
      console.error("❌ Database migration failed:", err);
    }
  }
}
