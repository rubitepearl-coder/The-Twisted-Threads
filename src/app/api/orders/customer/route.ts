import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { desc, like, or, sql } from "drizzle-orm";

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

    // Match orders by customer name - case-insensitive using LOWER()
    const searchTerm = customerName.trim().toLowerCase();
    const customerOrders = await db
      .select()
      .from(orders)
      .where(sql`LOWER(${orders.customerName}) = ${searchTerm}`)
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
