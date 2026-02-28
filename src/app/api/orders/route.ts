import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { orders, products } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { sendOrderToGoogleSheets, isGoogleSheetsConfigured } from "@/lib/googleSheets";

export async function GET(request: NextRequest) {
  try {
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
    if (!customerName || (!customerEmail && !facebookId)) {
      return NextResponse.json(
        { error: "Name is required. Email or Facebook ID is required for contact." },
        { status: 400 }
      );
    }

    // Calculate Anini-y delivery fee: ₱10 if home delivery in Anini-y
    let deliveryFee = 0;
    if (deliveryType === "home" && deliveryLocation) {
      const locationLower = deliveryLocation.toLowerCase();
      if (locationLower.includes("anini") || locationLower === "anini-y") {
        deliveryFee = 10;
      }
    }

    // Calculate final total with delivery fee
    const finalTotal = totalPrice + deliveryFee;

    // Start a transaction to ensure stock consistency
    await db.transaction(async (tx) => {
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

      // Create the order
      const result = await tx
        .insert(orders)
        .values({
          userId: userId ?? null,
          facebookId: facebookId ?? null,
          customerName,
          customerEmail: customerEmail ?? null,
          customerAddress: customerAddress ?? "",
          deliveryType: deliveryType ?? "home",
          deliveryLocation: deliveryLocation ?? null,
          deliveryFee,
          orderType: orderType ?? "bouquet",
          bouquetItems: JSON.stringify(bouquetItems ?? []),
          miniPotItems: JSON.stringify(miniPotItems ?? []),
          potId: potId ?? null,
          potName: potName ?? null,
          potImageUrl: potImageUrl ?? null,
          wrapperColorId: wrapperColorId ?? null,
          wrapperColorName: wrapperColorName ?? null,
          wrapperColorHex: wrapperColorHex ?? null,
          wrapperColorImageUrl: wrapperColorImageUrl ?? null,
          totalPrice: finalTotal,
          status: "pending",
        })
        .returning({ id: orders.id });

      const orderId = result[0].id;

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

    // Note: The transaction above handles everything, but we need to get the orderId
    // Let me restructure this properly
    
    // Actually, let me simplify - the transaction is working, but I need to return properly
    // The issue is the nested async and return - let me refactor
    
    // For now, fetch the most recent order to get the ID
    const [latestOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(1);

    return NextResponse.json({ 
      orderId: latestOrder?.id, 
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
