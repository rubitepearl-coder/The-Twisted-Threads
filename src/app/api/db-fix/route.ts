import { NextResponse } from "next/server";
import { getDb } from "@/db";

// This endpoint fixes the production database schema if migrations didn't run properly
export async function GET() {
  try {
    const db = getDb();
    const client = db.$client;

    // Fix customer_email NOT NULL constraint
    try {
      await client.execute("ALTER TABLE orders ALTER COLUMN customer_email DROP NOT NULL");
      console.log("[db-fix] Fixed customer_email NOT NULL constraint");
    } catch (e: any) {
      // Ignore if already nullable or column doesn't exist
      console.log("[db-fix] customer_email:", e.message);
    }

    // Fix other optional fields that might have NOT NULL constraints
    const optionalColumns = [
      "facebook_name",
      "customer_address", 
      "wrapper_color_id",
      "wrapper_color_name",
      "wrapper_color_hex",
      "wrapper_color_image_url",
      "pot_id",
      "pot_name",
      "pot_image_url",
      "bouquet_items",
      "mini_pot_items",
      "shop_items",
      "delivery_fee",
      "notes"
    ];

    for (const col of optionalColumns) {
      try {
        await client.execute(`ALTER TABLE orders ALTER COLUMN ${col} DROP NOT NULL`);
        console.log(`[db-fix] Fixed ${col} NOT NULL constraint`);
      } catch (e: any) {
        console.log(`[db-fix] ${col}:`, e.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database schema fixed" 
    });
  } catch (error) {
    console.error("[db-fix] Failed to fix database:", error);
    return NextResponse.json(
      { error: "Failed to fix database schema" },
      { status: 500 }
    );
  }
}
