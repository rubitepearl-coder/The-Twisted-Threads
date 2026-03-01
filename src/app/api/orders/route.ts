import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { orders, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { sendOrderToGoogleSheets, isGoogleSheetsConfigured } from "@/lib/googleSheets";
import { isAdminAuthenticated } from "@/lib/auth";

// Raw SQL insert helper to only insert SPECIFIC columns
// Maps camelCase JavaScript keys to snake_case SQL column names
const COLUMN_NAME_MAP: Record<string, string> = {
  customerName: "customer_name",
  facebookName: "facebook_name",
  customerEmail: "customer_email",
  customerAddress: "customer_address",
  deliveryType: "delivery_type",
  deliveryLocation: "delivery_location",
  deliveryFee: "delivery_fee",
  orderType: "order_type",
  bouquetItems: "bouquet_items",
  miniPotItems: "mini_pot_items",
  shopItems: "shop_items",
  potId: "pot_id",
  potName: "pot_name",
  potImageUrl: "pot_image_url",
  wrapperColorId: "wrapper_color_id",
  wrapperColorName: "wrapper_color_name",
  wrapperColorHex: "wrapper_color_hex",
  wrapperColorImageUrl: "wrapper_color_image_url",
  totalPrice: "total_price",
  createdAt: "created_at",
  updatedAt: "updated_at"
};

function buildInsertSQL(data: Record<string, any>): { sql: string; values: any[] } {
  const columns: string[] = [];
  const placeholders: string[] = [];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      // Convert camelCase to snake_case for SQL column name
      const sqlColumn = COLUMN_NAME_MAP[key] || key;
      columns.push(sqlColumn);
      placeholders.push("?");
      values.push(value);
    }
  }
  
  // Always include created_at
  columns.push("created_at");
  placeholders.push("?");
  values.push(Date.now()); // Unix timestamp in milliseconds
  
  return {
    sql: `INSERT INTO orders (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    values
  };
}

export async function GET(request: NextRequest) {
  try {
    // Only allow admin to fetch all orders
    const isAdmin = await isAdminAuthenticated();
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const db = getDb();
    
    // Admin: fetch all orders sorted by date (newest first)
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
    return NextResponse.json(allOrders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    // Debug: Log the incoming request body
    console.log("[Orders API] Received body:", JSON.stringify(body));
    
    const {
      // Note: userId and facebookId are NOT used - orders can be placed without login
      customerName,
      facebookName,
      customerEmail,
      customerAddress,
      deliveryType,
      deliveryLocation,
      orderType,
      bouquetItems,
      miniPotItems,
      shopItems,
      potId,
      potName,
      potImageUrl,
      // wrapperColor fields are no longer used in new orders
      totalPrice,
    } = body;

    // Validate required fields
    // customerName (Full Name) is required for shipping records
    console.log("[Orders API] Validation check:", { customerName, facebookName, customerEmail, deliveryType, deliveryLocation });
    if (!customerName) {
      console.log("[Orders API] Validation FAILED: No full name");
      return NextResponse.json(
        { error: "Full name is required to place an order." },
        { status: 400 }
      );
    }
    // Facebook name is required for contact via Messenger
    if (!facebookName) {
      console.log("[Orders API] Validation FAILED: No Facebook name");
      return NextResponse.json(
        { error: "Facebook name is required for contact." },
        { status: 400 }
      );
    }
    // Delivery location is required if delivery is selected
    if (deliveryType === "home" && !deliveryLocation) {
      console.log("[Orders API] Validation FAILED: No delivery location for home delivery");
      return NextResponse.json(
        { error: "Delivery location is required for home delivery." },
        { status: 400 }
      );
    }
    console.log("[Orders API] Validation PASSED");

    // Determine delivery type - default to pickup
    const finalDeliveryType = (deliveryType === "pickup" || deliveryType === "home") ? deliveryType : "pickup";
    
    // Calculate delivery fee and location based on delivery type
    let finalDeliveryFee = 0;
    let finalDeliveryLocation: string | undefined = undefined;
    
    if (finalDeliveryType === "home" && deliveryLocation) {
      // Calculate delivery fee for home delivery
      const locationLower = deliveryLocation.toLowerCase();
      if (locationLower.includes("aniniy") || locationLower.includes("anini-y")) {
        // Anini-y area: ₱10 delivery fee
        finalDeliveryFee = 10;
      } else if (
        locationLower.includes("san francisco") ||
        locationLower.includes("sths") ||
        locationLower.includes("sfes")
      ) {
        // San Francisco area (STHS, SFES, nearby): FREE delivery
        finalDeliveryFee = 0;
      } else {
        // Other locations: ₱10 delivery fee
        finalDeliveryFee = 10;
      }
      finalDeliveryLocation = deliveryLocation.toString().trim();
    }
    // For pickup: no delivery fee, no location needed
    
    // Calculate final total with delivery fee
    const finalTotal = totalPrice + finalDeliveryFee;
    
    // Debug: Log the validated and processed values
    console.log("[Orders API] Validated values:", {
      customerName,
      customerEmail,
      customerAddress: customerAddress ?? "",
      deliveryType: finalDeliveryType,
      deliveryLocation: finalDeliveryLocation,
      deliveryFee: finalDeliveryFee,
      orderType,
      totalPrice,
      finalTotal
    });

    // Start - use raw SQL for insert to control exact columns
    // Stock updates still use Drizzle ORM
    
    // Check and decrement stock for bouquet items
    if (bouquetItems && bouquetItems.length > 0) {
      for (const item of bouquetItems) {
        const productId = item.productId;
        const quantity = item.quantity;

        // Get current product stock
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${item.name}`);
        }

        // Stock check: Only block if stockQuantity is explicitly set AND insufficient
        // If stockQuantity is NULL, allow checkout (unlimited/not tracked)
        const currentStock = product.stockQuantity;
        
        if (currentStock !== null && currentStock < quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Only decrement stock if it's explicitly set
        if (currentStock !== null) {
          const newStock = currentStock - quantity;
          await db
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productId));
        }
      }
    }

    // Check and decrement stock for mini pot items
    if (miniPotItems && miniPotItems.length > 0) {
      for (const item of miniPotItems) {
        const productId = item.productId;
        const quantity = item.quantity;

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${item.name}`);
        }

        // Stock check: Only block if stockQuantity is explicitly set AND insufficient
        const currentStock = product.stockQuantity;
        
        if (currentStock !== null && currentStock < quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Only decrement stock if it's explicitly set
        if (currentStock !== null) {
          const newStock = currentStock - quantity;
          await db
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productId));
        }
      }
    }

    // Check and decrement stock for shop items (finished goods)
    if (shopItems && shopItems.length > 0) {
      for (const item of shopItems) {
        const productId = item.productId;
        const quantity = item.quantity;

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${item.name}`);
        }

        // Stock check: Only block if stockQuantity is explicitly set AND insufficient
        const currentStock = product.stockQuantity;
        
        if (currentStock !== null && currentStock < quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Only decrement stock if it's explicitly set
        if (currentStock !== null) {
          const newStock = currentStock - quantity;
          await db
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productId));
        }
      }
    }

      // Build order data with EXPLICIT column specification only
      // Only include fields that are actually provided - no undefined/null values
      const orderData: any = {
        // Required fields - always included
        customerName: customerName?.toString().trim() || "Unknown",
        deliveryType: finalDeliveryType,
        totalPrice: finalTotal,
        status: "pending",
        orderType: orderType || "bouquet",
      };

      // Facebook name - required for contact
      if (facebookName && facebookName.toString().trim()) {
        orderData.facebookName = facebookName.toString().trim();
      }

      // Customer email - optional
      if (customerEmail && customerEmail.toString().trim()) {
        orderData.customerEmail = customerEmail.toString().trim();
      }

      // Customer address - optional (for reference, not used for delivery)
      if (customerAddress && customerAddress.toString().trim()) {
        orderData.customerAddress = customerAddress.toString().trim();
      }

      // Delivery location - only for home delivery
      if (finalDeliveryLocation) {
        orderData.deliveryLocation = finalDeliveryLocation;
      }

      // Delivery fee - only if > 0
      if (finalDeliveryFee > 0) {
        orderData.deliveryFee = finalDeliveryFee;
      }

      // Items - only include if provided
      if (bouquetItems && bouquetItems.length > 0) {
        orderData.bouquetItems = typeof bouquetItems === 'string' ? bouquetItems : JSON.stringify(bouquetItems);
      }
      if (miniPotItems && miniPotItems.length > 0) {
        orderData.miniPotItems = typeof miniPotItems === 'string' ? miniPotItems : JSON.stringify(miniPotItems);
      }
      if (shopItems && shopItems.length > 0) {
        orderData.shopItems = typeof shopItems === 'string' ? shopItems : JSON.stringify(shopItems);
      }

      // Pot info - only include if provided
      if (potId) {
        orderData.potId = potId;
      }
      if (potName) {
        orderData.potName = potName;
      }
      if (potImageUrl) {
        orderData.potImageUrl = potImageUrl;
      }

      // NOTE: wrapperColor fields are NO LONGER INSERTED
      // They are kept in schema for backward compatibility but not used in new orders
      // Also NOT inserting: userId, facebookId, customerAddress
      
      console.log("[Orders API] Final order data keys:", Object.keys(orderData));
      console.log("[Orders API] Final order data:", JSON.stringify(orderData));
      
      // Use raw SQL to insert ONLY the columns we specify
      const { sql, values } = buildInsertSQL(orderData);
      console.log("[Orders API] Raw SQL:", sql);
      console.log("[Orders API] Values:", values);
      
      // Use the underlying libsql client to run raw SQL
      await db.$client.execute(sql, values);
      
      // Get the last inserted order ID
      const [latestOrder] = await db
        .select({ id: orders.id })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(1);

      const orderId = latestOrder?.id ?? 0;

      // Send order to Google Sheets if configured
      if (isGoogleSheetsConfigured()) {
        const sheetResult = await sendOrderToGoogleSheets({
          customerName,
          customerEmail: customerEmail ?? "",
          customerAddress: customerAddress ?? "",
          orderType: orderType ?? "bouquet",
          bouquetItems: JSON.stringify(bouquetItems ?? []),
          miniPotItems: JSON.stringify(miniPotItems ?? []),
          potId: potId ?? null,
          potName: potName ?? null,
          // wrapperColor fields removed - no longer used
          totalPrice: finalTotal,
          status: "pending",
        });
        
        if (!sheetResult.success) {
          console.error("Google Sheets sync failed:", sheetResult.error);
        } else {
          console.log("Order synced to Google Sheets:", sheetResult.orderId);
        }
      }

      // Return the order ID in a consistent format
      return NextResponse.json({ orderId: orderId });
    } catch (error) {
      console.error("Failed to create order:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create order";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
