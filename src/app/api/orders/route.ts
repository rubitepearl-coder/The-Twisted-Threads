import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { orders, products } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { sendOrderToGoogleSheets, isGoogleSheetsConfigured } from "@/lib/googleSheets";
import { isAdminAuthenticated } from "@/lib/auth";

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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const facebookId = searchParams.get("facebookId");

    const db = getDb();
    
    // If userId or facebookId provided, fetch orders for that specific user
    if (userId || facebookId) {
      const query = userId 
        ? eq(orders.userId, userId)
        : eq(orders.facebookId, facebookId!);
        
      const userOrders = await db
        .select()
        .from(orders)
        .where(query)
        .orderBy(desc(orders.createdAt));
      return NextResponse.json(userOrders);
    }
    
    // Otherwise, fetch all orders (admin view)
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
    const body = await request.json();
    
    // Debug: Log the incoming request body
    console.log("[Orders API] Received body:", JSON.stringify(body));
    
    const {
      userId,
      facebookId,
      customerName,
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
      wrapperColorId,
      wrapperColorName,
      wrapperColorHex,
      wrapperColorImageUrl,
      totalPrice,
    } = body;

    // Validate required fields - customerName is required, but email is optional if facebookId provided
    console.log("[Orders API] Validation check:", { customerName, customerEmail, facebookId });
    if (!customerName || (!customerEmail && !facebookId)) {
      console.log("[Orders API] Validation FAILED:", { 
        hasName: !!customerName, 
        hasEmail: !!customerEmail, 
        hasFacebook: !!facebookId 
      });
      return NextResponse.json(
        { error: "Name is required. Email or Facebook ID is required for contact." },
        { status: 400 }
      );
    }
    console.log("[Orders API] Validation PASSED");

    // Calculate delivery fee:
    // - ₱10 for Anini-y
    // - FREE for San Francisco area (STHS, SFES, nearby houses)
    let deliveryFee = 0;
    if (deliveryType === "home" && deliveryLocation) {
      const locationLower = deliveryLocation.toLowerCase();
      if (locationLower.includes("aniniy") || locationLower.includes("anini-y")) {
        // Anini-y area: ₱10 delivery fee
        deliveryFee = 10;
      } else if (
        locationLower.includes("san francisco") ||
        locationLower.includes("sths") ||
        locationLower.includes("sfes")
      ) {
        // San Francisco area (STHS, SFES, nearby): FREE delivery
        deliveryFee = 0;
      } else {
        // Other locations: ₱10 delivery fee
        deliveryFee = 10;
      }
    }
    
    // Calculate final total with delivery fee
    const finalTotal = totalPrice + deliveryFee;
    
    // Debug: Log the validated and processed values
    console.log("[Orders API] Validated values:", {
      customerName,
      customerEmail,
      facebookId,
      customerAddress: customerAddress ?? "",
      deliveryType: (deliveryType === "pickup" || deliveryType === "home") ? deliveryType : "home",
      deliveryLocation,
      deliveryFee,
      orderType,
      totalPrice,
      finalTotal
    });

    // Start a transaction to ensure stock consistency
    const orderResult = await db.transaction(async (tx) => {
      // Check and decrement stock for bouquet items
      if (bouquetItems && bouquetItems.length > 0) {
        for (const item of bouquetItems) {
          const productId = item.productId;
          const quantity = item.quantity;

          // Get current product stock
          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

          if (!product) {
            throw new Error(`Product not found: ${item.name}`);
          }

          const currentStock = product.stockQuantity || 0;
          
          // Check if sufficient stock available
          if (currentStock < quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${quantity}`);
          }

          // Decrement stock
          const newStock = currentStock - quantity;
          await tx
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productId));
        }
      }

      // Check and decrement stock for mini pot items
      if (miniPotItems && miniPotItems.length > 0) {
        for (const item of miniPotItems) {
          const productId = item.productId;
          const quantity = item.quantity;

          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

          if (!product) {
            throw new Error(`Product not found: ${item.name}`);
          }

          const currentStock = product.stockQuantity || 0;
          
          if (currentStock < quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${quantity}`);
          }

          const newStock = currentStock - quantity;
          await tx
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productId));
        }
      }

      // Check and decrement stock for shop items (finished goods)
      if (shopItems && shopItems.length > 0) {
        for (const item of shopItems) {
          const productId = item.productId;
          const quantity = item.quantity;

          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

          if (!product) {
            throw new Error(`Product not found: ${item.name}`);
          }

          const currentStock = product.stockQuantity || 0;
          
          if (currentStock < quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${quantity}`);
          }

          const newStock = currentStock - quantity;
          await tx
            .update(products)
            .set({ 
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: new Date()
            })
            .where(eq(products.id, productId));
        }
      }

      // Create the order - use onConflictDoNothing for id to handle autoIncrement properly
      // Ensure all required fields have proper values
      const orderData = {
        userId: userId ?? undefined,
        facebookId: facebookId ?? undefined,
        customerName,
        customerEmail: customerEmail ?? undefined,
        customerAddress: customerAddress?.trim() || "",
        deliveryType: (deliveryType === "pickup" || deliveryType === "home") ? deliveryType : "home",
        deliveryLocation: deliveryLocation?.trim() || undefined,
        deliveryFee,
        orderType: orderType ?? "bouquet",
        bouquetItems: JSON.stringify(bouquetItems ?? []),
        miniPotItems: JSON.stringify(miniPotItems ?? []),
        shopItems: JSON.stringify(shopItems ?? []),
        potId: potId ?? undefined,
        potName: potName ?? undefined,
        potImageUrl: potImageUrl ?? undefined,
        wrapperColorId: wrapperColorId ?? undefined,
        wrapperColorName: wrapperColorName ?? undefined,
        wrapperColorHex: wrapperColorHex ?? undefined,
        wrapperColorImageUrl: wrapperColorImageUrl ?? undefined,
        totalPrice: finalTotal,
        status: "pending",
      };
      
      console.log("[Orders API] Final order data:", JSON.stringify(orderData));
      
      const result = await tx
        .insert(orders)
        .values(orderData);

      // Get the last inserted order ID
      const [latestOrder] = await tx
        .select({ id: orders.id })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(1);

      const orderId = latestOrder?.id;

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
          wrapperColorId: wrapperColorId ?? null,
          wrapperColorName: wrapperColorName ?? null,
          totalPrice: finalTotal,
          status: "pending",
        });
        
        if (!sheetResult.success) {
          console.error("Google Sheets sync failed:", sheetResult.error);
        } else {
          console.log("Order synced to Google Sheets:", sheetResult.orderId);
        }
      }

      return { orderId };
    });

    // Return the order result
    return NextResponse.json({ 
      orderId: orderResult.orderId, 
      deliveryFee,
      finalTotal 
    }, { status: 201 });
    
  } catch (error) {
    console.error("Failed to create order:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
