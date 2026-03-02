import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { orders, products, wrapperColors, adminSessions } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Get table info to check current schema
    const tableInfo = await db.$client.execute("PRAGMA table_info(orders)");
    const columns = tableInfo.rows.map((row: any) => ({
      name: row.name,
      notnull: row.notnull,
      type: row.type
    }));
    
    // Check if facebook_name column exists
    const hasFacebookName = columns.some((c: any) => c.name === "facebook_name");
    const hasStockQuantity = columns.some((c: any) => c.name === "stock_quantity");
    
    // Check customer_email NOT NULL status
    const emailColumn = columns.find((c: any) => c.name === "customer_email");
    const emailNotNull = emailColumn?.notnull === 1;
    
    return NextResponse.json({
      success: true,
      table: "orders",
      columns,
      hasFacebookName,
      hasStockQuantity,
      emailNotNull,
      message: hasFacebookName 
        ? "Database schema is up to date" 
        : "Missing facebook_name column - migrations may not have run"
    });
  } catch (error) {
    console.error("Schema check failed:", error);
    return NextResponse.json(
      { error: "Failed to check schema", details: String(error) },
      { status: 500 }
    );
  }
}
