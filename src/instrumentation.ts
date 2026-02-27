export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run migrations on server startup using libsql client
    const { createClient } = await import("@libsql/client");
    const { drizzle } = await import("drizzle-orm/libsql");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:petals.db",
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    const db = drizzle(libsql);
    
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("✅ Database migrations completed on startup");
  }
}
