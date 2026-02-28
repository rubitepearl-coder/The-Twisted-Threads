import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { products } from "@/db/schema";

export async function GET() {
  try {
    const allProducts = await getDb().select().from(products);
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, price, salePrice, stockQuantity, inStock, imageEmoji, imageUrl } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const result = await getDb()
      .insert(products)
      .values({
        name,
        description: description ?? "",
        category: category ?? "flower",
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
        inStock: inStock ?? true,
        imageEmoji: imageEmoji ?? "🌸",
        imageUrl: imageUrl ?? "",
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
