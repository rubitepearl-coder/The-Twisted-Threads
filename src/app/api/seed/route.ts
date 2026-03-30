import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, wrapperColors } from "@/db/schema";

const flowerData = [
  {
    name: "Rose",
    description: "Classic romantic bloom",
    category: "flower",
    price: 4.5,
    inStock: true,
    imageEmoji: "🌹",
  },
  {
    name: "Tulip",
    description: "Elegant spring flower",
    category: "flower",
    price: 3.75,
    inStock: true,
    imageEmoji: "🌷",
  },
  {
    name: "Carnation",
    description: "Ruffled and romantic",
    category: "flower",
    price: 4.0,
    inStock: true,
    imageEmoji: "🌸",
  },
  {
    name: "Daisy",
    description: "Sweet and simple",
    category: "flower",
    price: 3.0,
    inStock: true,
    imageEmoji: "🌼",
  },
  {
    name: "Lavender",
    description: "Calming purple sprig",
    category: "flower",
    price: 3.5,
    inStock: true,
    imageEmoji: "💜",
  },
  {
    name: "Cherry Blossom",
    description: "Delicate pink petals",
    category: "flower",
    price: 5.5,
    inStock: true,
    imageEmoji: "🌸",
  },
  {
    name: "Lily",
    description: "Elegant and fragrant",
    category: "flower",
    price: 4.75,
    inStock: true,
    imageEmoji: "🪷",
  },
  {
    name: "Hibiscus",
    description: "Tropical beauty",
    category: "flower",
    price: 4.25,
    inStock: false,
    imageEmoji: "🌺",
  },
];

const finishedGoodsData = [
  {
    name: "Classic Rose Bouquet",
    description: "12 hand-crocheted roses in a kraft paper wrap",
    category: "finished_good",
    price: 58.0,
    inStock: true,
    imageEmoji: "💐",
  },
  {
    name: "Spring Mix Bouquet",
    description: "Tulips, daisies, and lavender — ready to gift",
    category: "finished_good",
    price: 45.0,
    inStock: true,
    imageEmoji: "🌷",
  },
  {
    name: "Sunflower Centerpiece",
    description: "5 large sunflowers in a rustic vase",
    category: "finished_good",
    price: 35.0,
    inStock: true,
    imageEmoji: "🌻",
  },
  {
    name: "Mini Bud Vase Set",
    description: "3 single stems in tiny ceramic vases",
    category: "finished_good",
    price: 28.0,
    inStock: false,
    imageEmoji: "🏺",
  },
  {
    name: "K-Pop Amigurumi Idol",
    description: "Chibi crochet idol doll inspired by K-pop aesthetics — pastel outfit, mic in hand",
    category: "finished_good",
    price: 42.0,
    inStock: true,
    imageEmoji: "🎤",
  },
];

const colorData = [
  { name: "Kraft Brown", colorHex: "#c4956a", inStock: true },
  { name: "Sage Green", colorHex: "#8fad88", inStock: true },
  { name: "Dusty Rose", colorHex: "#d4a0a0", inStock: true },
  { name: "Cream White", colorHex: "#f5f0e8", inStock: true },
  { name: "Terracotta", colorHex: "#c17a5a", inStock: true },
  { name: "Lavender Mist", colorHex: "#b8a8d0", inStock: true },
  { name: "Midnight Black", colorHex: "#2d2d2d", inStock: false },
];

async function seedDatabase() {
  const db = getDb();
  
  // Check if already seeded
  const existing = await db.select().from(products).limit(1);
  if (existing.length > 0) {
    return { success: true, message: "Already seeded" };
  }

  for (const flower of flowerData) {
    await db.insert(products).values(flower);
  }
  for (const good of finishedGoodsData) {
    await db.insert(products).values(good);
  }
  for (const color of colorData) {
    await db.insert(wrapperColors).values(color);
  }

  return { success: true, message: "Seeded successfully" };
}

export async function GET() {
  let db;
  try {
    db = getDb();
  } catch (dbError) {
    console.error("[seed] Database initialization failed:", dbError);
    return NextResponse.json({ error: "Database not available" }, { status: 500 });
  }

  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}

export async function POST() {
  let db;
  try {
    db = getDb();
  } catch (dbError) {
    console.error("[seed] Database initialization failed:", dbError);
    return NextResponse.json({ error: "Database not available" }, { status: 500 });
  }

  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}