import { db } from "./index";
import { products, wrapperColors } from "./schema";

const flowerData = [
  {
    name: "Rose",
    description: "Classic romantic bloom",
    category: "flower",
    price: 4.5,
    stockQuantity: 20,
    inStock: true,
    imageEmoji: "🌹",
  },
  {
    name: "Tulip",
    description: "Elegant spring flower",
    category: "flower",
    price: 3.75,
    stockQuantity: 20,
    inStock: true,
    imageEmoji: "🌷",
  },
  {
    name: "Carnation",
    description: "Ruffled and romantic",
    category: "flower",
    price: 4.0,
    stockQuantity: 20,
    inStock: true,
    imageEmoji: "🌸",
  },
  {
    name: "Daisy",
    description: "Sweet and simple",
    category: "flower",
    price: 3.0,
    stockQuantity: 20,
    inStock: true,
    imageEmoji: "🌼",
  },
  {
    name: "Lavender",
    description: "Calming purple sprig",
    category: "flower",
    price: 3.5,
    stockQuantity: 20,
    inStock: true,
    imageEmoji: "💜",
  },
  {
    name: "Cherry Blossom",
    description: "Delicate pink petals",
    category: "flower",
    price: 5.5,
    stockQuantity: 20,
    inStock: true,
    imageEmoji: "🌸",
  },
  {
    name: "Lily",
    description: "Elegant and fragrant",
    category: "flower",
    price: 4.75,
    stockQuantity: 20,
    inStock: true,
    imageEmoji: "🪷",
  },
  {
    name: "Hibiscus",
    description: "Tropical beauty",
    category: "flower",
    price: 4.25,
    stockQuantity: 0,
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
    stockQuantity: 10,
    inStock: true,
    imageEmoji: "💐",
  },
  {
    name: "Spring Mix Bouquet",
    description: "Tulips, daisies, and lavender — ready to gift",
    category: "finished_good",
    price: 45.0,
    stockQuantity: 10,
    inStock: true,
    imageEmoji: "🌷",
  },
  {
    name: "Sunflower Centerpiece",
    description: "5 large sunflowers in a rustic vase",
    category: "finished_good",
    price: 35.0,
    stockQuantity: 10,
    inStock: true,
    imageEmoji: "🌻",
  },
  {
    name: "Mini Bud Vase Set",
    description: "3 single stems in tiny ceramic vases",
    category: "finished_good",
    price: 28.0,
    stockQuantity: 0,
    inStock: false,
    imageEmoji: "🏺",
  },
  {
    name: "K-Pop Amigurumi Idol",
    description: "Chibi crochet idol doll inspired by K-pop aesthetics — pastel outfit, mic in hand",
    category: "finished_good",
    price: 42.0,
    stockQuantity: 5,
    inStock: true,
    imageEmoji: "🎤",
  },
];

const fuzzyWireFlowersData = [
  {
    name: "Fuzzy Wire Rose",
    description: "Handmade fuzzy wire rose in red",
    category: "fuzzy_wire_flower",
    price: 8.0,
    stockQuantity: 15,
    inStock: true,
    imageEmoji: "🌹",
  },
  {
    name: "Fuzzy Wire Tulip",
    description: "Handmade fuzzy wire tulip in assorted colors",
    category: "fuzzy_wire_flower",
    price: 7.0,
    stockQuantity: 15,
    inStock: true,
    imageEmoji: "🌷",
  },
  {
    name: "Fuzzy Wire Sunflower",
    description: "Handmade fuzzy wire sunflower in yellow",
    category: "fuzzy_wire_flower",
    price: 9.0,
    stockQuantity: 15,
    inStock: true,
    imageEmoji: "🌻",
  },
  {
    name: "Fuzzy Wire Daisy",
    description: "Handmade fuzzy wire daisy in white/yellow",
    category: "fuzzy_wire_flower",
    price: 6.5,
    stockQuantity: 15,
    inStock: true,
    imageEmoji: "🌼",
  },
  {
    name: "Fuzzy Wire Lavender",
    description: "Handmade fuzzy wire lavender sprig",
    category: "fuzzy_wire_flower",
    price: 7.5,
    stockQuantity: 15,
    inStock: true,
    imageEmoji: "💜",
  },
];

const potsData = [
  {
    name: "Mini Ceramic Pot - Pink",
    description: "Adorable mini ceramic pot in pastel pink",
    category: "pot",
    price: 12.0,
    stockQuantity: 8,
    inStock: true,
    imageEmoji: "🪴",
  },
  {
    name: "Mini Ceramic Pot - White",
    description: "Adorable mini ceramic pot in clean white",
    category: "pot",
    price: 12.0,
    stockQuantity: 8,
    inStock: true,
    imageEmoji: "🪴",
  },
  {
    name: "Mini Ceramic Pot - Blue",
    description: "Adorable mini ceramic pot in sky blue",
    category: "pot",
    price: 12.0,
    stockQuantity: 8,
    inStock: true,
    imageEmoji: "🪴",
  },
  {
    name: "Mini Ceramic Pot - Green",
    description: "Adorable mini ceramic pot in sage green",
    category: "pot",
    price: 12.0,
    stockQuantity: 0,
    inStock: false,
    imageEmoji: "🪴",
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
  for (const fuzzyFlower of fuzzyWireFlowersData) {
    await db.insert(products).values(fuzzyFlower).onConflictDoNothing();
  }
  for (const pot of potsData) {
    await db.insert(products).values(pot).onConflictDoNothing();
  }

  // Insert wrapper colors
  for (const color of colorData) {
    await db.insert(wrapperColors).values(color).onConflictDoNothing();
  }

  console.log("✅ Seed complete!");
}

seed().catch(console.error);
