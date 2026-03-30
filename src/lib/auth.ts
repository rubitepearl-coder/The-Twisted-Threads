import { getDb } from "@/db";
import { adminSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) return false;

    let db;
    try {
      db = getDb();
    } catch (dbError) {
      console.error("[Auth] Database initialization failed:", dbError);
      return false;
    }

    const session = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.token, token))
      .limit(1);

    if (session.length === 0) return false;

    // Check if session is still valid
    const now = new Date();
    if (session[0].expiresAt < now) return false;

    return true;
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<boolean> {
  return isAdminAuthenticated();
}
