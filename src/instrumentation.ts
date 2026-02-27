export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // For local SQLite, migrations are handled via drizzle-kit CLI
    // The database file is created on first use
    console.log("✅ Database initialized (SQLite local file)");
  }
}
