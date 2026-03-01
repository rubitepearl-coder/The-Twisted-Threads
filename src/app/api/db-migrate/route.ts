import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

// This endpoint manually runs the missing migrations
// It's a fallback in case the automatic migrations on startup don't work

export async function GET(request: NextRequest) {
  // Debug endpoint to check current schema
  try {
    const db = getDb();
    const client = db.$client;
    
    const tableInfo = await client.execute("PRAGMA table_info(orders)");
    const columns = tableInfo.rows.map((row: any) => row.name);
    
    return NextResponse.json({
      endpoint: "db-migrate",
      method: "GET",
      ordersColumns: columns,
      hasFacebookName: columns.includes("facebook_name"),
      message: "Use POST to run migrations"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Check failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const client = db.$client;
    
    // First, check current schema
    const tableInfo = await client.execute("PRAGMA table_info(orders)");
    const columns = tableInfo.rows.map((row: any) => row.name);
    
    const migrations: string[] = [];
    
    // Run each migration if the column doesn't exist
    if (!columns.includes("facebook_name")) {
      try {
        await client.execute("ALTER TABLE orders ADD COLUMN facebook_name TEXT;");
        migrations.push("Added facebook_name column");
      } catch (e: any) {
        // Column might already exist (race condition)
        if (!e.message?.includes("duplicate column")) {
          console.error("Migration facebook_name failed:", e);
        }
      }
    }
    
    if (!columns.includes("stock_quantity")) {
      try {
        await client.execute("ALTER TABLE products ADD COLUMN stock_quantity INTEGER;");
        migrations.push("Added stock_quantity column to products");
      } catch (e: any) {
        if (!e.message?.includes("duplicate column")) {
          console.error("Migration stock_quantity failed:", e);
        }
      }
    }
    
    // Re-check schema after migrations
    const newTableInfo = await client.execute("PRAGMA table_info(orders)");
    const newColumns = newTableInfo.rows.map((row: any) => row.name);
    
    return NextResponse.json({
      success: true,
      migrations,
      columns: newColumns,
      message: migrations.length > 0 
        ? `Ran ${migrations.length} migration(s)` 
        : "Database already up to date"
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}
