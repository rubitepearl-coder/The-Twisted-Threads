import { db } from "@/db";
import { products, addons } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import MiniPotBuilderClient from "./MiniPotBuilderClient";

// Force dynamic rendering so inventory updates are reflected immediately
export const dynamic = "force-dynamic";

export default async function MiniPotBuilderPage() {
  let pots: typeof products.$inferSelect[] = [];
  let fuzzyFlowers: typeof products.$inferSelect[] = [];
  let addonItems: typeof addons.$inferSelect[] = [];

  try {
    pots = await db
      .select()
      .from(products)
      .where(eq(products.category, "pot"));
    fuzzyFlowers = await db
      .select()
      .from(products)
      .where(eq(products.category, "fuzzy_wire_flower"));
    addonItems = await db
      .select()
      .from(addons)
      .where(or(eq(addons.inStock, true), eq(addons.availableFor, "both")));
  } catch {
    // DB not yet seeded
  }

  // Filter out out-of-stock items (stockQuantity = 0)
  const availablePots = pots.filter((p) => p.stockQuantity === null || p.stockQuantity > 0);
  const availableFlowers = fuzzyFlowers.filter((f) => f.stockQuantity === null || f.stockQuantity > 0);

  const filteredAddons = addonItems.filter(
    (a) => a.availableFor === "both" || a.availableFor === "mini_pot"
  );

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#f5ede0] to-[#ede0d0] py-12 px-4 text-center border-b border-[#d4b896]">
        <div className="text-5xl mb-4">🪴</div>
        <h1 className="text-4xl font-bold text-[#3d2c1e] mb-3">
          Build Your Mini Pot
        </h1>
        <p className="text-[#6b4c30] text-lg max-w-xl mx-auto">
          Select a mini pot, choose your fuzzy wire flowers, and create your own
          adorable desk companion!
        </p>
      </div>

      <MiniPotBuilderClient pots={availablePots} fuzzyFlowers={availableFlowers} addons={filteredAddons} />
    </div>
  );
}
