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
    const { name, description, type, price, imageUrl, availableFor } = body;

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
        inStock: true,
        availableFor: availableFor ?? "both"
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create addon:", error);
    return NextResponse.json({ error: "Failed to create addon" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, type, price, imageUrl, inStock, availableFor } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (price !== undefined) updateData.price = price;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (inStock !== undefined) updateData.inStock = inStock;
    if (availableFor !== undefined) updateData.availableFor = availableFor;

    const result = await getDb()
      .update(addons)
      .set(updateData)
      .where(eq(addons.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Addon not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Failed to update addon:", error);
    return NextResponse.json({ error: "Failed to update addon" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await getDb()
      .delete(addons)
      .where(eq(addons.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Addon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete addon:", error);
    return NextResponse.json({ error: "Failed to delete addon" }, { status: 500 });
  }
}