export async function register() {
  // Note: Automatic migrations via drizzle-orm/libsql/migrator don't work in Next.js 
  // production builds because the migrations folder is not included.
  // Instead, use the /api/db-migrate endpoint to run migrations manually.
  
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  
  if (url && token) {
    console.log("✅ Turso database configured");
    console.log("ℹ️  Use /api/db-migrate to run database migrations");
  } else {
    console.warn("⚠️  TURSO_DATABASE_URL not set - database features will not work");
  }
}