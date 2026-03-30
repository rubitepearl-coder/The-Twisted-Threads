import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { orders, products, addons, wrapperColors, adminSessions } from "@/db/schema";

export async function GET() {
  let db;
  try {
    db = getDb();
  } catch (dbError: any) {
    console.error("[db-check] Database initialization failed:", dbError?.message || dbError);
    return NextResponse.json({
      status: "error",
      message: "Database not available",
      error: dbError?.message || String(dbError),
      tursoConfigured: !!process.env.TURSO_DATABASE_URL
    }, { status: 500 });
  }

  try {
    const results: any = {
      status: "ok",
      tursoConfigured: !!process.env.TURSO_DATABASE_URL,
      tables: {}
    };

    // Check each table
    try {
      results.tables.orders = await db.select().from(orders);
      results.tables.products = await db.select().from(products);
      results.tables.addons = await db.select().from(addons);
      results.tables.wrapperColors = await db.select().from(wrapperColors);
      results.tables.adminSessions = await db.select().from(adminSessions);
    } catch (queryError: any) {
      results.queryError = queryError?.message || String(queryError);
    }

    return NextResponse.json({
      status: "success",
      message: "Database connected successfully",
      counts: {
        orders: results.tables.orders?.length || 0,
        products: results.tables.products?.length || 0,
        addons: results.tables.addons?.length || 0,
        wrapperColors: results.tables.wrapperColors?.length || 0,
        adminSessions: results.tables.adminSessions?.length || 0
      }
    });
  } catch (error: any) {
    console.error("[db-check] Error:", error);
    return NextResponse.json({
      status: "error",
      message: "Database query failed",
      error: error?.message || String(error)
    }, { status: 500 });
  }
}