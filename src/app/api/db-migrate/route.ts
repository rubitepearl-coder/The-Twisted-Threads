import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";

// This endpoint creates tables if they don't exist and runs missing migrations

export async function GET(request: NextRequest) {
  // This endpoint runs migrations and returns schema info
  console.log("[db-migrate] GET request received - running migrations");
  
  let db;
  try {
    db = getDb();
  } catch (dbError) {
    console.error("[db-migrate] Database initialization failed:", dbError);
    return NextResponse.json({
      error: "Database not available",
      tursoConfigured: !!process.env.TURSO_DATABASE_URL
    }, { status: 500 });
  }
  
  try {
    const client = db.$client;
    const migrations: string[] = [];
    
    // Check all tables
    const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tablesResult.rows.map((row: any) => row.name);
    console.log("[db-migrate] Existing tables:", tableNames);
    
    // Create admin_sessions table if it doesn't exist
    if (!tableNames.includes("admin_sessions")) {
      try {
        await client.execute(`
          CREATE TABLE admin_sessions (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            token text NOT NULL,
            created_at integer,
            expires_at integer NOT NULL
          )
        `);
        await client.execute(`CREATE UNIQUE INDEX admin_sessions_token_unique ON admin_sessions (token)`);
        migrations.push("Created admin_sessions table");
        console.log("[db-migrate] Created admin_sessions table");
      } catch (e: any) {
        console.error("[db-migrate] Failed to create admin_sessions:", e);
      }
    }
    
    // Create addons table if it doesn't exist
    if (!tableNames.includes("addons")) {
      try {
        await client.execute(`
          CREATE TABLE addons (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            name text NOT NULL,
            description text DEFAULT '' NOT NULL,
            type text DEFAULT 'addon' NOT NULL,
            price real NOT NULL,
            image_url text DEFAULT '',
            in_stock integer DEFAULT 1 NOT NULL,
            available_for text DEFAULT 'both' NOT NULL,
            created_at integer,
            updated_at integer
          )
        `);
        migrations.push("Created addons table");
        console.log("[db-migrate] Created addons table");
      } catch (e: any) {
        console.error("[db-migrate] Failed to create addons:", e);
      }
    } else {
      // Table exists - check and fix column names
      const addonTableInfo = await client.execute("PRAGMA table_info(addons)");
      const addonColumns = addonTableInfo.rows.map((row: any) => row.name);
      
      // Check if columns are wrong (camelCase instead of snake_case)
      const hasWrongColumns = addonColumns.includes("imageUrl") || addonColumns.includes("inStock");
      
      if (hasWrongColumns) {
        try {
          // Drop the table and recreate with correct snake_case columns
          await client.execute("DROP TABLE addons");
          await client.execute(`
            CREATE TABLE addons (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              name text NOT NULL,
              description text DEFAULT '' NOT NULL,
              type text DEFAULT 'addon' NOT NULL,
              price real NOT NULL,
              image_url text DEFAULT '',
              in_stock integer DEFAULT 1 NOT NULL,
              stock_quantity integer,
              available_for text DEFAULT 'both' NOT NULL,
              created_at integer,
              updated_at integer
            )
          `);
          migrations.push("Recreated addons table with correct columns");
          console.log("[db-migrate] Recreated addons table");
        } catch (e: any) {
          console.error("[db-migrate] Failed to recreate addons:", e);
        }
      } else {
        // Table has correct columns but might be missing stock_quantity
        if (!addonColumns.includes("stock_quantity")) {
          try {
            await client.execute("ALTER TABLE addons ADD COLUMN stock_quantity integer");
            migrations.push("Added stock_quantity column to addons");
          } catch (e: any) {
            console.error("[db-migrate] Failed to add stock_quantity:", e);
          }
        }
        if (!addonColumns.includes("available_for")) {
          try {
            await client.execute("ALTER TABLE addons ADD COLUMN available_for text DEFAULT 'both'");
            migrations.push("Added available_for column to addons");
          } catch (e: any) {
            console.error("[db-migrate] Failed to add available_for:", e);
          }
        }
      }
    }
    
    // Create orders table if it doesn't exist
    if (!tableNames.includes("orders")) {
      try {
        await client.execute(`
          CREATE TABLE orders (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id text,
            facebook_id text,
            customer_name text NOT NULL,
            facebook_name text,
            customer_email text,
            customer_address text,
            delivery_type text DEFAULT 'pickup' NOT NULL,
            delivery_location text,
            delivery_fee real DEFAULT 0,
            order_type text DEFAULT 'bouquet' NOT NULL,
            bouquet_items text DEFAULT '[]',
            mini_pot_items text DEFAULT '[]',
            shop_items text DEFAULT '[]',
            pot_id integer,
            pot_name text,
            pot_image_url text,
            wrapper_color_id integer,
            wrapper_color_name text,
            wrapper_color_hex text,
            wrapper_color_image_url text,
            total_price real NOT NULL,
            status text DEFAULT 'pending' NOT NULL,
            notes text DEFAULT '',
            created_at integer
          )
        `);
        migrations.push("Created orders table");
        console.log("[db-migrate] Created orders table");
      } catch (e: any) {
        console.error("[db-migrate] Failed to create orders:", e);
      }
    } else {
      const tableInfo = await client.execute("PRAGMA table_info(orders)");
      const columns = tableInfo.rows.map((row: any) => row.name);
      
      const missingColumns = [
        { name: "facebook_name", type: "text" },
        { name: "delivery_type", type: "text DEFAULT 'pickup'" },
        { name: "delivery_location", type: "text" },
        { name: "delivery_fee", type: "real DEFAULT 0" },
        { name: "mini_pot_items", type: "text DEFAULT '[]'" },
        { name: "shop_items", type: "text DEFAULT '[]'" },
        { name: "pot_id", type: "integer" },
        { name: "pot_name", type: "text" },
        { name: "pot_image_url", type: "text" },
        { name: "wrapper_color_id", type: "integer" },
        { name: "wrapper_color_name", type: "text" },
        { name: "wrapper_color_hex", type: "text" },
        { name: "wrapper_color_image_url", type: "text" },
        { name: "addon_items", type: "text DEFAULT '[]'" },
        { name: "addon_message", type: "text DEFAULT ''" },
      ];
      
      for (const col of missingColumns) {
        if (!columns.includes(col.name)) {
          try {
            await client.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type};`);
            migrations.push(`Added ${col.name} column to orders`);
            console.log(`[db-migrate] Added ${col.name} column to orders`);
          } catch (e: any) {
            console.error(`[db-migrate] Failed to add ${col.name}:`, e);
          }
        }
      }
    }
    
    console.log("[db-migrate] Migrations completed:", migrations);
    
    return NextResponse.json({
      success: true,
      migrations,
      message: migrations.length > 0 
        ? `Ran ${migrations.length} migration(s)` 
        : "Database already up to date"
    });
  } catch (error) {
    console.error("[db-migrate] Migration failed:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("[db-migrate] POST request received - starting migrations");
  try {
    const db = getDb();
    const client = db.$client;
    
    const migrations: string[] = [];
    
    // First, check what tables exist
    const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tablesResult.rows.map((row: any) => row.name);
    console.log("[db-migrate] Existing tables:", tableNames);
    
    // Create admin_sessions table if it doesn't exist
    if (!tableNames.includes("admin_sessions")) {
      try {
        await client.execute(`
          CREATE TABLE admin_sessions (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            token text NOT NULL,
            created_at integer,
            expires_at integer NOT NULL
          )
        `);
        await client.execute(`CREATE UNIQUE INDEX admin_sessions_token_unique ON admin_sessions (token)`);
        migrations.push("Created admin_sessions table");
        console.log("[db-migrate] Created admin_sessions table");
      } catch (e: any) {
        console.error("[db-migrate] Failed to create admin_sessions:", e);
      }
    }
    
    // Create products table if it doesn't exist
    if (!tableNames.includes("products")) {
      try {
        await client.execute(`
          CREATE TABLE products (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            name text NOT NULL,
            description text DEFAULT '' NOT NULL,
            category text DEFAULT 'flower' NOT NULL,
            price real NOT NULL,
            sale_price real,
            stock_quantity integer,
            in_stock integer DEFAULT 1 NOT NULL,
            image_emoji text DEFAULT '🌸' NOT NULL,
            image_url text DEFAULT '',
            created_at integer,
            updated_at integer
          )
        `);
        migrations.push("Created products table");
        console.log("[db-migrate] Created products table");
      } catch (e: any) {
        console.error("[db-migrate] Failed to create products:", e);
      }
    } else {
      // Table exists, add missing columns
      const tableInfo = await client.execute("PRAGMA table_info(products)");
      const columns = tableInfo.rows.map((row: any) => row.name);
      
      if (!columns.includes("stock_quantity")) {
        try {
          await client.execute("ALTER TABLE products ADD COLUMN stock_quantity integer;");
          migrations.push("Added stock_quantity column to products");
          console.log("[db-migrate] Added stock_quantity column to products");
        } catch (e: any) {
          console.error("[db-migrate] Failed to add stock_quantity:", e);
        }
      }
      
      if (!columns.includes("sale_price")) {
        try {
          await client.execute("ALTER TABLE products ADD COLUMN sale_price real;");
          migrations.push("Added sale_price column to products");
        } catch (e: any) {
          console.error("[db-migrate] Failed to add sale_price:", e);
        }
      }
      
      if (!columns.includes("image_url")) {
        try {
          await client.execute("ALTER TABLE products ADD COLUMN image_url text DEFAULT '';");
          migrations.push("Added image_url column to products");
        } catch (e: any) {
          console.error("[db-migrate] Failed to add image_url:", e);
        }
      }
    }
    
    // Create wrapper_colors table if it doesn't exist
    if (!tableNames.includes("wrapper_colors")) {
      try {
        await client.execute(`
          CREATE TABLE wrapper_colors (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            name text NOT NULL,
            color_hex text NOT NULL,
            image_url text DEFAULT '',
            price real DEFAULT 0,
            in_stock integer DEFAULT 1 NOT NULL
          )
        `);
        migrations.push("Created wrapper_colors table");
        console.log("[db-migrate] Created wrapper_colors table");
      } catch (e: any) {
        console.error("[db-migrate] Failed to create wrapper_colors:", e);
      }
    } else {
      // Table exists, check for price column
      const wrapperTableInfo = await client.execute("PRAGMA table_info(wrapper_colors)");
      const wrapperColumns = wrapperTableInfo.rows.map((row: any) => row.name);
      
      if (!wrapperColumns.includes("price")) {
        try {
          await client.execute("ALTER TABLE wrapper_colors ADD COLUMN price real DEFAULT 0");
          migrations.push("Added price column to wrapper_colors");
          console.log("[db-migrate] Added price column to wrapper_colors");
        } catch (e: any) {
          console.error("[db-migrate] Failed to add price column:", e);
        }
      }
    }
    
    // Create orders table if it doesn't exist
    if (!tableNames.includes("orders")) {
      try {
        await client.execute(`
          CREATE TABLE orders (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id text,
            facebook_id text,
            customer_name text NOT NULL,
            facebook_name text,
            customer_email text,
            customer_address text,
            delivery_type text DEFAULT 'pickup' NOT NULL,
            delivery_location text,
            delivery_fee real DEFAULT 0,
            order_type text DEFAULT 'bouquet' NOT NULL,
            bouquet_items text DEFAULT '[]',
            mini_pot_items text DEFAULT '[]',
            shop_items text DEFAULT '[]',
            pot_id integer,
            pot_name text,
            pot_image_url text,
            wrapper_color_id integer,
            wrapper_color_name text,
            wrapper_color_hex text,
            wrapper_color_image_url text,
            total_price real NOT NULL,
            status text DEFAULT 'pending' NOT NULL,
            notes text DEFAULT '',
            created_at integer
          )
        `);
        migrations.push("Created orders table");
        console.log("[db-migrate] Created orders table");
      } catch (e: any) {
        console.error("[db-migrate] Failed to create orders:", e);
      }
    } else {
      // Table exists, add missing columns
      const tableInfo = await client.execute("PRAGMA table_info(orders)");
      const columns = tableInfo.rows.map((row: any) => row.name);
      
      const missingColumns = [
        { name: "facebook_name", type: "text" },
        { name: "delivery_type", type: "text DEFAULT 'pickup'" },
        { name: "delivery_location", type: "text" },
        { name: "delivery_fee", type: "real DEFAULT 0" },
        { name: "mini_pot_items", type: "text DEFAULT '[]'" },
        { name: "shop_items", type: "text DEFAULT '[]'" },
        { name: "pot_id", type: "integer" },
        { name: "pot_name", type: "text" },
        { name: "pot_image_url", type: "text" },
        { name: "pot_price", type: "real" },
        { name: "wrapper_color_id", type: "integer" },
        { name: "wrapper_color_name", type: "text" },
        { name: "wrapper_color_hex", type: "text" },
        { name: "wrapper_color_image_url", type: "text" },
        { name: "wrapper_color_price", type: "real" },
        { name: "addon_items", type: "text DEFAULT '[]'" },
        { name: "addon_message", type: "text DEFAULT ''" },
      ];
      
      for (const col of missingColumns) {
        if (!columns.includes(col.name)) {
          try {
            await client.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type};`);
            migrations.push(`Added ${col.name} column to orders`);
            console.log(`[db-migrate] Added ${col.name} column to orders`);
          } catch (e: any) {
            console.error(`[db-migrate] Failed to add ${col.name}:`, e);
          }
        }
      }
    }
    
    console.log("[db-migrate] Migrations completed:", migrations);
    
    return NextResponse.json({
      success: true,
      migrations,
      message: migrations.length > 0 
        ? `Ran ${migrations.length} migration(s)` 
        : "Database already up to date"
    });
  } catch (error) {
    console.error("[db-migrate] Migration failed:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}
