export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    
    if (url && token) {
      console.log("✅ Turso database configured");
    } else {
      console.warn("⚠️  Turso credentials not set - database features will not work");
    }
  }
}
