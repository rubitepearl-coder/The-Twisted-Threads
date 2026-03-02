import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { adminSessions } from "@/db/schema";
import { randomBytes } from "crypto";

// In production, use an environment variable for the admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "petalloop2024";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Create a session token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Ensure admin_sessions table exists
    const db = getDb();
    const client = db.$client;
    try {
      const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_sessions'");
      if (tablesResult.rows.length === 0) {
        console.log("[admin/login] Creating admin_sessions table");
        await client.execute(`
          CREATE TABLE admin_sessions (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            token text NOT NULL,
            created_at integer,
            expires_at integer NOT NULL
          )
        `);
        await client.execute(`CREATE UNIQUE INDEX admin_sessions_token_unique ON admin_sessions (token)`);
      }
    } catch (tableError) {
      console.error("[admin/login] Error checking/creating admin_sessions table:", tableError);
    }

    await db.insert(adminSessions).values({
      token,
      expiresAt,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Login failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
