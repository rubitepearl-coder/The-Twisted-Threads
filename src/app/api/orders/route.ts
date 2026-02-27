import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import { sendOrderToGoogleSheets, isGoogleSheetsConfigured } from "@/lib/googleSheets";

export async function GET() {
  try {
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
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerAddress,
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

    if (!customerName || !customerEmail || !totalPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(orders)
      .values({
        customerName,
        customerEmail,
        customerAddress: customerAddress ?? "",
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
        totalPrice,
        status: "pending",
      })
      .returning({ id: orders.id });

    const orderId = result[0].id;

    // Send order to Google Sheets if configured
    if (isGoogleSheetsConfigured()) {
      const sheetResult = await sendOrderToGoogleSheets({
        customerName,
        customerEmail,
        customerAddress: customerAddress ?? "",
        orderType: orderType ?? "bouquet",
        bouquetItems: JSON.stringify(bouquetItems ?? []),
        miniPotItems: JSON.stringify(miniPotItems ?? []),
        potId: potId ?? null,
        potName: potName ?? null,
        wrapperColorId: wrapperColorId ?? null,
        wrapperColorName: wrapperColorName ?? null,
        totalPrice,
        status: "pending",
      });
      
      if (!sheetResult.success) {
        console.error("Google Sheets sync failed:", sheetResult.error);
        // Order still saved locally, just logging the sync failure
      } else {
        console.log("Order synced to Google Sheets:", sheetResult.orderId);
      }
    }

    return NextResponse.json({ orderId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
