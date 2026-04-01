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
  potPrice: "pot_price",
  wrapperColorId: "wrapper_color_id",
  wrapperColorName: "wrapper_color_name",
  wrapperColorHex: "wrapper_color_hex",
  wrapperColorImageUrl: "wrapper_color_image_url",
  wrapperColorPrice: "wrapper_color_price",
  addonItems: "addon_items",
  addonMessage: "addon_message",
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

    let db;
    try {
      db = getDb();
    } catch (dbError) {
      console.error("[Orders API] Database initialization failed:", dbError);
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    
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
  let db;
  try {
    db = getDb();
  } catch (dbError) {
    console.error("[Orders API] Database initialization failed:", dbError);
    return NextResponse.json({ error: "Database not available" }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    // Debug: Log the incoming request body
    console.log("[Orders API] Received body:", JSON.stringify(body));
    
    const {
      // Note: userId and facebookId are NOT used - orders can be placed without login
      customerName,
      facebookName,
      customerAddress,
      deliveryType,
      deliveryLocation,
      deliveryFee,
      orderType,
      bouquetItems,
      miniPotItems,
      shopItems,
      potId,
      potName,
      potImageUrl,
      potPrice,
      wrapperColorId,
      wrapperColorName,
      wrapperColorHex,
      wrapperColorImageUrl,
      wrapperColorPrice,
      totalPrice,
      addonItems,
      addonMessage,
    } = body;

    console.log("[Orders API] Full request body:", JSON.stringify({ 
      orderType, 
      potId: typeof potId !== 'undefined' ? potId : 'undefined',
      potName,
      miniPotItemsCount: miniPotItems?.length 
    }));

    // Validate required fields
    // customerName (Full Name) is required for shipping records
    console.log("[Orders API] Validation check:", { customerName, facebookName, deliveryType, deliveryLocation });
    if (!customerName) {
      console.log("[Orders API] Validation FAILED: No full name");
      return NextResponse.json(
        { error: "Full name is required to place an order." },
        { status: 400 }
      );
    }
    // Facebook name - required for contact via Messenger
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
    
    // Use delivery fee from client if provided, otherwise calculate
    // Shop page sends deliveryFee, bouquet/mini-pot calculate on client but don't send
    let finalDeliveryFee = deliveryFee ?? 0;
    let finalDeliveryLocation: string | undefined = undefined;
    
    // Only add delivery fee if not already provided by client AND it's home delivery with location
    if (finalDeliveryType === "home" && deliveryLocation && !deliveryFee) {
      finalDeliveryFee = 10;
      finalDeliveryLocation = deliveryLocation.toString().trim();
    } else if (deliveryLocation) {
      finalDeliveryLocation = deliveryLocation.toString().trim();
    }
    // For pickup: no delivery fee, no location needed
    
    // Calculate final total with delivery fee
    const finalTotal = totalPrice + finalDeliveryFee;
    
    // Debug: Log the validated and processed values
    console.log("[Orders API] Validated values:", {
      customerName,
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
    const bouquetItemsArray = typeof bouquetItems === 'string' ? JSON.parse(bouquetItems) : bouquetItems;
    if (bouquetItemsArray && bouquetItemsArray.length > 0) {
      // Group items by productId and sum quantities
      const groupedItems = bouquetItemsArray.reduce((acc: Record<number, {name: string, quantity: number}>, item: any) => {
        if (!acc[item.productId]) {
          acc[item.productId] = { name: item.name || '', quantity: 0 };
        }
        acc[item.productId].quantity += item.quantity;
        return acc;
      }, {} as Record<number, {name: string, quantity: number}>);

      for (const [productId, itemData] of Object.entries(groupedItems) as [string, {name: string, quantity: number}][]) {
        const productIdNum = parseInt(productId);
        const quantity = itemData.quantity;
        const name = itemData.name;

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, productIdNum))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${name}`);
        }

        const currentStock = product.stockQuantity;
        
        // If stockQuantity is NULL, treat as unlimited - don't check stock
        // If stockQuantity is set, must have enough stock
        if (currentStock !== null && currentStock < quantity) {
          console.log(`[Orders API] Stock check FAILED for ${name}: stock=${currentStock}, requested=${quantity}`);
          throw new Error(`Insufficient stock for ${name}. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Decrement stock when order is placed (for tracked items only)
        if (currentStock !== null) {
          // Explicit stock tracking - decrement
          const newStock = currentStock - quantity;
          console.log(`[Orders API] Bouquet flower stock: ${currentStock} -> ${newStock} for ${name} (ID: ${productIdNum})`);
          await db
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productIdNum));
        } else {
          // NULL stockQuantity - set to 0 to start tracking (first order decrements to 0)
          await db
            .update(products)
            .set({ 
              stockQuantity: 0,
              inStock: false,
              updatedAt: new Date()
            })
            .where(eq(products.id, productIdNum));
        }
      }
    }

    // Check and decrement stock for mini pot items
    // Check and decrement stock for mini pot items
    const miniPotItemsArray = typeof miniPotItems === 'string' ? JSON.parse(miniPotItems) : miniPotItems;
    if (miniPotItemsArray && miniPotItemsArray.length > 0) {
      const groupedItems = miniPotItemsArray.reduce((acc: Record<number, {name: string, quantity: number}>, item: any) => {
        if (!acc[item.productId]) {
          acc[item.productId] = { name: item.name || '', quantity: 0 };
        }
        acc[item.productId].quantity += item.quantity;
        return acc;
      }, {} as Record<number, {name: string, quantity: number}>);

      for (const [productId, itemData] of Object.entries(groupedItems) as [string, {name: string, quantity: number}][]) {
        const productIdNum = parseInt(productId);
        const quantity = itemData.quantity;
        const name = itemData.name;

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, productIdNum))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${name}`);
        }

        const currentStock = product.stockQuantity;
        
        // If stockQuantity is NULL, treat as unlimited - don't check stock
        // If stockQuantity is set, check and decrement
        if (currentStock !== null && currentStock < quantity) {
          throw new Error(`Insufficient stock for ${name}. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Always decrement stock when order is placed (even for unlimited/NULL stock)
        if (currentStock !== null) {
          // Explicit stock tracking - decrement
          const newStock = currentStock - quantity;
          console.log(`[Orders API] Mini pot item stock: ${currentStock} -> ${newStock} for ${name} (ID: ${productIdNum})`);
          await db
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productIdNum));
        } else {
          // NULL stockQuantity - set to 0 to start tracking
          await db
            .update(products)
            .set({ 
              stockQuantity: 0,
              inStock: false,
              updatedAt: new Date()
            })
            .where(eq(products.id, productIdNum));
        }
      }
    }

    // Check and decrement stock for pot in mini pot orders
    if (orderType === "mini_pot" && potId) {
      console.log("[Orders API] Processing pot order:", { potId, potIdType: typeof potId, potName });
      const potIdNum = parseInt(potId);
      console.log("[Orders API] Parsed potId:", potIdNum);
      const [potProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, potIdNum))
        .limit(1);

      console.log("[Orders API] Pot product found:", potProduct ? { id: potProduct.id, name: potProduct.name, stock: potProduct.stockQuantity } : "NOT FOUND");

      if (potProduct) {
        const currentStock = potProduct.stockQuantity;
        console.log(`[Orders API] Pot stock check: ${potProduct.name} (ID: ${potIdNum}) has stock: ${currentStock}`);
        // Only block if stock is explicitly 0
        if (currentStock !== null && currentStock < 1) {
          console.log(`[Orders API] Pot stock check FAILED for ${potProduct.name}: stock=${currentStock}`);
          throw new Error(`Insufficient stock for ${potProduct.name}`);
        }
        if (currentStock !== null) {
          const newStock = currentStock - 1;
          console.log(`>>>> POT STOCK DECREMENT >>>> ${potProduct.name} (ID: ${potIdNum}): ${currentStock} -> ${newStock}`);
          await db
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, potIdNum));
        } else {
          console.log(`>>>> POT STOCK INITIAL >>>> ${potProduct.name} (ID: ${potIdNum}): NULL -> 0`);
          await db
            .update(products)
            .set({ 
              stockQuantity: 0,
              inStock: false,
              updatedAt: new Date()
            })
            .where(eq(products.id, potIdNum));
        }
      }
    }

    // Check and decrement stock for shop items (finished goods)
    const shopItemsArray = typeof shopItems === 'string' ? JSON.parse(shopItems) : shopItems;
    if (shopItemsArray && shopItemsArray.length > 0) {
      const groupedItems = shopItemsArray.reduce((acc: Record<number, {name: string, quantity: number}>, item: any) => {
        if (!acc[item.productId]) {
          acc[item.productId] = { name: item.name || '', quantity: 0 };
        }
        acc[item.productId].quantity += item.quantity;
        return acc;
      }, {} as Record<number, {name: string, quantity: number}>);

      for (const [productId, itemData] of Object.entries(groupedItems) as [string, {name: string, quantity: number}][]) {
        const productIdNum = parseInt(productId);
        const quantity = itemData.quantity;
        const name = itemData.name;

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, productIdNum))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${name}`);
        }

        const currentStock = product.stockQuantity;
        
        // If stockQuantity is NULL, treat as unlimited - don't check stock
        // If stockQuantity is set, check and decrement
        // Allow ordering even if stock is 0 (admin can restock later)
        if (currentStock !== null && currentStock < quantity) {
          throw new Error(`Insufficient stock for ${name}. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Decrement stock when order is placed (even for 0 stock - allows admin to track orders)
        if (currentStock !== null) {
          const newStock = currentStock - quantity;
          await db
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productIdNum));
        } else {
          // NULL stockQuantity - set to 0 to start tracking
          await db
            .update(products)
            .set({ 
              stockQuantity: 0,
              inStock: false,
              updatedAt: new Date()
            })
            .where(eq(products.id, productIdNum));
        }
      }
    }

    // Check and decrement stock for addons
    const addonItemsArray = typeof addonItems === 'string' ? JSON.parse(addonItems) : addonItems;
    if (addonItemsArray && addonItemsArray.length > 0) {
      for (const addon of addonItemsArray) {
        if (addon.id) {
          const [addonProduct] = await db
            .select()
            .from(products)
            .where(eq(products.id, addon.id))
            .limit(1);

          if (addonProduct) {
            const currentStock = addonProduct.stockQuantity;
            // Allow ordering even if stock is 0 (admin can restock later)
            if (currentStock !== null && currentStock < 1) {
              throw new Error(`Insufficient stock for ${addonProduct.name}`);
            }
            if (currentStock !== null) {
              await db
                .update(products)
                .set({ 
                  stockQuantity: Math.max(0, currentStock - 1),
                  inStock: (Math.max(0, currentStock - 1)) > 0,
                  updatedAt: new Date()
                })
                .where(eq(products.id, addon.id));
            } else {
              await db
                .update(products)
                .set({ 
                  stockQuantity: 0,
                  inStock: false,
                  updatedAt: new Date()
                })
                .where(eq(products.id, addon.id));
            }
          }
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
      if (potPrice) {
        orderData.potPrice = potPrice;
      }

      // Wrapper color for bouquets
      if (wrapperColorId) {
        orderData.wrapperColorId = wrapperColorId;
      }
      if (wrapperColorName) {
        orderData.wrapperColorName = wrapperColorName;
      }
      if (wrapperColorHex) {
        orderData.wrapperColorHex = wrapperColorHex;
      }
      if (wrapperColorImageUrl) {
        orderData.wrapperColorImageUrl = wrapperColorImageUrl;
      }
      if (wrapperColorPrice) {
        orderData.wrapperColorPrice = wrapperColorPrice;
      }

      // Add-ons
      if (addonItems) {
        orderData.addonItems = typeof addonItems === 'string' ? addonItems : JSON.stringify(addonItems);
      }

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
          customerEmail: "",
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
