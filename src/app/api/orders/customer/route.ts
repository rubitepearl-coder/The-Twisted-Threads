import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get("customerName");
    const facebookName = searchParams.get("facebookName");

    if (!customerName) {
      return NextResponse.json(
        { error: "Please enter your name to view your orders" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Match orders by customerName OR facebookName - case-insensitive using LOWER()
    const searchTerm = customerName.trim().toLowerCase();
    const facebookSearchTerm = facebookName ? facebookName.trim().toLowerCase() : null;
    
    // If facebookName provided, match by either name
    let customerOrders;
    if (facebookSearchTerm) {
      customerOrders = await db
        .select()
        .from(orders)
        .where(sql`LOWER(${orders.customerName}) = ${searchTerm} OR LOWER(${orders.facebookName}) = ${facebookSearchTerm}`)
        .orderBy(desc(orders.createdAt));
    } else {
      // Otherwise just match by customerName
      customerOrders = await db
        .select()
        .from(orders)
        .where(sql`LOWER(${orders.customerName}) = ${searchTerm}`)
        .orderBy(desc(orders.createdAt));
    }

    return NextResponse.json(customerOrders);
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
