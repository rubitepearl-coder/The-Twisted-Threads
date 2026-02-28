import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { desc, eq, and, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get("customerName");

    if (!customerName) {
      return NextResponse.json(
        { error: "Please enter your name to view your orders" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Match orders by customer name (Facebook name) - case-insensitive
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerName, customerName))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json(customerOrders);
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
