import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";

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
      orderType,
      bouquetItems,
      wrapperColorId,
      wrapperColorName,
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
        orderType: orderType ?? "bouquet",
        bouquetItems: JSON.stringify(bouquetItems ?? []),
        wrapperColorId: wrapperColorId ?? null,
        wrapperColorName: wrapperColorName ?? null,
        totalPrice,
        status: "pending",
      })
      .returning({ id: orders.id });

    return NextResponse.json({ orderId: result[0].id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
