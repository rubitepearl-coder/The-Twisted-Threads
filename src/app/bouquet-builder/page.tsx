import { db } from "@/db";
import { products, wrapperColors, addons } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import BouquetBuilderClient from "./BouquetBuilderClient";

// Force dynamic rendering so inventory updates are reflected immediately
export const dynamic = "force-dynamic";

export default async function BouquetBuilderPage() {
  let flowers: typeof products.$inferSelect[] = [];
  let colors: typeof wrapperColors.$inferSelect[] = [];
  let addonItems: typeof addons.$inferSelect[] = [];

  try {
    flowers = await db
      .select()
      .from(products)
      .where(eq(products.category, "flower"));
    colors = await db.select().from(wrapperColors);
    addonItems = await db
      .select()
      .from(addons)
      .where(or(eq(addons.inStock, true), eq(addons.availableFor, "both")));
  } catch {
    // DB not yet seeded
  }

  // Filter out out-of-stock flowers (stockQuantity = 0)
  const availableFlowers = flowers.filter((f) => f.stockQuantity === null || f.stockQuantity > 0);

  const filteredAddons = addonItems.filter(
    (a) => a.availableFor === "both" || a.availableFor === "bouquet"
  );

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#f5ede0] to-[#ede0d0] py-12 px-4 text-center border-b border-[#d4b896]">
        <div className="text-5xl mb-4">🌺</div>
        <h1 className="text-4xl font-bold text-[#3d2c1e] mb-3">
          Build Your Bouquet
        </h1>
        <p className="text-[#6b4c30] text-lg max-w-xl mx-auto">
          Choose your flowers, pick a wrapper, and we&apos;ll craft your custom
          crochet bouquet with love.
        </p>
      </div>

      <BouquetBuilderClient flowers={availableFlowers} wrapperColors={colors} addons={filteredAddons} />
    </div>
  );
}
