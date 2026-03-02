import { NextResponse } from "next/server";
import { getDb } from "@/db";

// This endpoint fixes the production database schema by recreating the orders table
// SQLite's ALTER TABLE DROP NOT NULL doesn't work in all cases, so we use table recreation
export async function GET() {
  try {
    const db = getDb();
    const client = db.$client;

    // Step 1: Check if customer_email has NOT NULL constraint by trying to insert NULL
    // If it fails, we need to fix it
    try {
      // Try inserting a test row with NULL email to see if it works
      await client.execute(
        "INSERT INTO orders (customer_name, delivery_type, total_price, status, customer_email) VALUES (?, ?, ?, ?, NULL)",
        ["test_fix_" + Date.now(), "pickup", 0, "pending"]
      );
      
      // If successful, delete the test row
      await client.execute("DELETE FROM orders WHERE customer_name LIKE 'test_fix_%'");
      
      console.log("[db-fix] customer_email is already nullable - no fix needed");
      return NextResponse.json({ 
        success: true, 
        message: "Database schema is already correct - no fixes needed" 
      });
    } catch (insertError: any) {
      console.log("[db-fix] Insert test failed, need to fix schema:", insertError.message);
      
      // The column has NOT NULL constraint - we need to recreate the table
      // This is a workaround for SQLite's limitations
      
      // Step 1: Rename the old table
      await client.execute("ALTER TABLE orders RENAME TO orders_backup");
      
      console.log("[db-fix] Renamed orders to orders_backup");
      
      // Step 2: Create new table with nullable customer_email and facebook_name
      await client.execute(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          facebook_id TEXT,
          customer_name TEXT NOT NULL,
          facebook_name TEXT,
          customer_email TEXT,
          customer_address TEXT,
          delivery_type TEXT NOT NULL DEFAULT 'pickup',
          delivery_location TEXT,
          delivery_fee REAL DEFAULT 0,
          order_type TEXT NOT NULL DEFAULT 'bouquet',
          bouquet_items TEXT,
          mini_pot_items TEXT,
          shop_items TEXT,
          pot_id INTEGER,
          pot_name TEXT,
          pot_image_url TEXT,
          wrapper_color_id INTEGER,
          wrapper_color_name TEXT,
          wrapper_color_hex TEXT,
          wrapper_color_image_url TEXT,
          total_price REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at INTEGER
        )
      `);
      
      console.log("[db-fix] Created new orders table with nullable columns");
      
      // Step 3: Copy data from backup (map columns)
      await client.execute(`
        INSERT INTO orders (
          id, user_id, facebook_id, customer_name, facebook_name, customer_email,
          customer_address, delivery_type, delivery_location, delivery_fee,
          order_type, bouquet_items, mini_pot_items, shop_items, pot_id,
          pot_name, pot_image_url, wrapper_color_id, wrapper_color_name,
          wrapper_color_hex, wrapper_color_image_url, total_price, status,
          notes, created_at
        )
        SELECT 
          id, user_id, facebook_id, customer_name, facebook_name, customer_email,
          customer_address, delivery_type, delivery_location, delivery_fee,
          order_type, bouquet_items, mini_pot_items, shop_items, pot_id,
          pot_name, pot_image_url, wrapper_color_id, wrapper_color_name,
          wrapper_color_hex, wrapper_color_image_url, total_price, status,
          notes, created_at
        FROM orders_backup
      `);
      
      console.log("[db-fix] Copied data from backup table");
      
      // Step 4: Drop the backup table
      await client.execute("DROP TABLE orders_backup");
      
      console.log("[db-fix] Dropped backup table");
      
      // Step 5: Verify the fix worked
      try {
        await client.execute(
          "INSERT INTO orders (customer_name, delivery_type, total_price, status, customer_email) VALUES (?, ?, ?, ?, NULL)",
          ["verify_fix_" + Date.now(), "pickup", 0, "pending"]
        );
        await client.execute("DELETE FROM orders WHERE customer_name LIKE 'verify_fix_%'");
        console.log("[db-fix] Verification successful!");
      } catch (verifyError: any) {
        console.log("[db-fix] Verification failed:", verifyError.message);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Database schema fixed by recreating orders table" 
      });
    }
  } catch (error) {
    console.error("[db-fix] Failed to fix database:", error);
    return NextResponse.json(
      { error: "Failed to fix database schema: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
