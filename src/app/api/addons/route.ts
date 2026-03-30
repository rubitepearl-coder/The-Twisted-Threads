import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { addons } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allAddons = await getDb().select().from(addons).where(eq(addons.inStock, true));
    return NextResponse.json(allAddons);
  } catch (error) {
    console.error("Failed to fetch addons:", error);
    return NextResponse.json({ error: "Failed to fetch addons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, price, imageUrl } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const result = await getDb()
      .insert(addons)
      .values({ 
        name, 
        description: description ?? "", 
        type: type ?? "addon", 
        price, 
        imageUrl: imageUrl ?? "",
        inStock: true 
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create addon:", error);
    return NextResponse.json({ error: "Failed to create addon" }, { status: 500 });
  }
}