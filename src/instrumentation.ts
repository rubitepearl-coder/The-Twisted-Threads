export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    
    if (url && token) {
      console.log("✅ Turso database configured");
      
      // Run migrations on server startup
      try {
        const { migrate } = await import("drizzle-orm/libsql/migrator");
        const { getDb } = await import("@/db");
        const db = getDb();
        await migrate(db, { migrationsFolder: "./src/db/migrations" });
        console.log("✅ Database migrations completed on startup");
      } catch (error) {
        console.error("❌ Migration failed:", error);
      }
    } else {
      console.warn("⚠️  Turso credentials not set - database features will not work");
    }
  }
}
