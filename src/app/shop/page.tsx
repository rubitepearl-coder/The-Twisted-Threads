import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";

export default async function ShopPage() {
  let finishedGoods: typeof products.$inferSelect[] = [];
  let flowers: typeof products.$inferSelect[] = [];

  try {
    finishedGoods = await db
      .select()
      .from(products)
      .where(eq(products.category, "finished_good"));
    flowers = await db
      .select()
      .from(products)
      .where(eq(products.category, "flower"));
  } catch {
    // DB not yet seeded
  }

  const allProducts = [...finishedGoods, ...flowers];

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f5ede0] to-[#ede0d0] py-12 px-4 text-center border-b border-[#d4b896]">
        <div className="text-5xl mb-4">🛍️</div>
        <h1 className="text-4xl font-bold text-[#3d2c1e] mb-3">
          The Petal Loop Shop
        </h1>
        <p className="text-[#6b4c30] text-lg max-w-xl mx-auto">
          Browse our handcrafted crochet goods — from individual stems to
          finished bouquets and more.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {allProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-2xl font-bold text-[#3d2c1e] mb-3">
              Shop Coming Soon!
            </h2>
            <p className="text-[#6b4c30] mb-6">
              Our catalog is being lovingly prepared. In the meantime, build
              your own custom bouquet!
            </p>
            <Link
              href="/bouquet-builder"
              className="bg-[#7a4f2e] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
            >
              Build a Bouquet
            </Link>
          </div>
        ) : (
          <>
            {/* Finished Goods */}
            {finishedGoods.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-[#3d2c1e] mb-6 flex items-center gap-2">
                  🎁 Ready-Made Goods
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finishedGoods.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Individual Flowers */}
            {flowers.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                  🌸 Individual Stems
                </h2>
                <p className="text-[#6b4c30] text-sm mb-6">
                  Want to mix and match?{" "}
                  <Link
                    href="/bouquet-builder"
                    className="text-[#7a4f2e] underline hover:text-[#5c3a1e]"
                  >
                    Build a custom bouquet →
                  </Link>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {flowers.map((flower) => (
                    <div
                      key={flower.id}
                      className="bg-white rounded-2xl overflow-hidden border border-[#e8d5be] hover:shadow-md transition-shadow"
                    >
                      {/* Square image */}
                      <div className="aspect-square w-full overflow-hidden bg-[#f5ede0]">
                        {flower.imageUrl ? (
                          <Image
                            src={flower.imageUrl}
                            alt={flower.name}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">
                            {flower.imageEmoji}
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-semibold text-[#3d2c1e] mb-1 text-sm">
                          {flower.name}
                        </h3>
                        {flower.description && (
                          <p className="text-xs text-[#a07850] mb-2 line-clamp-2">
                            {flower.description}
                          </p>
                        )}
                        <p className="text-[#7a4f2e] font-bold text-sm">
                          ₱{flower.price.toFixed(2)}
                          <span className="text-xs font-normal text-[#a07850]">
                            {" "}
                            / stem
                          </span>
                        </p>
                        {!flower.inStock && (
                          <span className="inline-block mt-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <div className="bg-[#f5ede0] rounded-3xl p-8 text-center border border-[#d4b896]">
              <div className="text-4xl mb-3">🌺</div>
              <h3 className="text-2xl font-bold text-[#3d2c1e] mb-2">
                Want Something Custom?
              </h3>
              <p className="text-[#6b4c30] mb-5">
                Design your own bouquet with exactly the flowers you love.
              </p>
              <Link
                href="/bouquet-builder"
                className="bg-[#7a4f2e] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
              >
                Build Your Bouquet
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({
  product,
}: {
  product: typeof products.$inferSelect;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8d5be] overflow-hidden hover:shadow-lg transition-shadow">
      {/* Square image */}
      <div className="aspect-square w-full overflow-hidden bg-[#f5ede0]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={400}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">
            {product.imageEmoji}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-[#3d2c1e] text-lg mb-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-[#6b4c30] mb-3">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[#7a4f2e]">
            ₱{product.price.toFixed(2)}
          </span>
          {product.inStock ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              In Stock
            </span>
          ) : (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
