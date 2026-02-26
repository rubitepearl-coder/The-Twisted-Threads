import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wrapperColors } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const colorId = parseInt(id);
    const body = await request.json();

    const updateData: Partial<typeof wrapperColors.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.colorHex !== undefined) updateData.colorHex = body.colorHex;
    if (body.inStock !== undefined) updateData.inStock = body.inStock;

    const result = await db
      .update(wrapperColors)
      .set(updateData)
      .where(eq(wrapperColors.id, colorId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Failed to update wrapper color:", error);
    return NextResponse.json(
      { error: "Failed to update wrapper color" },
      { status: 500 }
    );
  }
}
