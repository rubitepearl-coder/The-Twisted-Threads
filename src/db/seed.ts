import { db } from "./index";
import { products, wrapperColors } from "./schema";

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
    name: "Sunflower",
    description: "Bright and cheerful",
    category: "flower",
    price: 5.0,
    inStock: true,
    imageEmoji: "🌻",
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

async function seed() {
  console.log("🌱 Seeding database...");

  // Insert products
  for (const flower of flowerData) {
    await db.insert(products).values(flower).onConflictDoNothing();
  }
  for (const good of finishedGoodsData) {
    await db.insert(products).values(good).onConflictDoNothing();
  }

  // Insert wrapper colors
  for (const color of colorData) {
    await db.insert(wrapperColors).values(color).onConflictDoNothing();
  }

  console.log("✅ Seed complete!");
}

seed().catch(console.error);
