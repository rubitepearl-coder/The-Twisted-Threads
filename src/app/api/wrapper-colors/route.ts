import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wrapperColors } from "@/db/schema";

export async function GET() {
  try {
    const colors = await db.select().from(wrapperColors);
    return NextResponse.json(colors);
  } catch (error) {
    console.error("Failed to fetch wrapper colors:", error);
    return NextResponse.json(
      { error: "Failed to fetch wrapper colors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, colorHex } = body;

    if (!name || !colorHex) {
      return NextResponse.json(
        { error: "Name and colorHex are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(wrapperColors)
      .values({ name, colorHex, inStock: true })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create wrapper color:", error);
    return NextResponse.json(
      { error: "Failed to create wrapper color" },
      { status: 500 }
    );
  }
}
