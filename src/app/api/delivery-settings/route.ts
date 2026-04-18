import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { deliverySettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const settings = await getDb().select().from(deliverySettings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch delivery settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationName, deliveryFee, action, toggleOther } = body;

    if (action === "toggleOther") {
      const result = await getDb()
        .insert(deliverySettings)
        .values({
          locationName: "__OTHER__",
          deliveryFee: 10,
          inStock: !toggleOther,
        })
        .onConflictDoUpdate({
          target: deliverySettings.locationName,
          set: { inStock: !toggleOther },
        })
        .returning();
      return NextResponse.json(result[0]);
    }

    if (!locationName) {
      return NextResponse.json(
        { error: "Location name is required" },
        { status: 400 }
      );
    }

    const result = await getDb()
      .insert(deliverySettings)
      .values({
        locationName,
        deliveryFee: deliveryFee ?? 0,
        inStock: true,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create delivery location:", error);
    return NextResponse.json(
      { error: "Failed to create delivery location" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, locationName, deliveryFee, inStock } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await getDb()
      .update(deliverySettings)
      .set({
        locationName,
        deliveryFee,
        inStock,
        updatedAt: new Date(),
      })
      .where(eq(deliverySettings.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Failed to update delivery location:", error);
    return NextResponse.json(
      { error: "Failed to update delivery location" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await getDb()
      .delete(deliverySettings)
      .where(eq(deliverySettings.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete delivery location:", error);
    return NextResponse.json(
      { error: "Failed to delete delivery location" },
      { status: 500 }
    );
  }
}