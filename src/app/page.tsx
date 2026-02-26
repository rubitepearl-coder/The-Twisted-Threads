import Link from "next/link";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function HomePage() {
  let featuredFlowers: typeof products.$inferSelect[] = [];
  try {
    featuredFlowers = await db
      .select()
      .from(products)
      .where(eq(products.category, "flower"))
      .limit(6);
  } catch {
    // DB not yet seeded
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#f5ede0] via-[#faf7f2] to-[#ede0d0] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🌸🧶🌷</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#3d2c1e] mb-6 leading-tight">
            Flowers That Last{" "}
            <span className="text-[#7a4f2e]">Forever</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#6b4c30] mb-8 max-w-2xl mx-auto leading-relaxed">
            Design your own custom crochet bouquet or shop our handcrafted
            collection. Each petal is lovingly stitched — no watering required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/bouquet-builder"
              className="bg-[#7a4f2e] text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#5c3a1e] transition-colors shadow-md"
            >
              🌺 Build Your Bouquet
            </Link>
            <Link
              href="/shop"
              className="bg-white text-[#7a4f2e] border-2 border-[#7a4f2e] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#f5ede0] transition-colors"
            >
              Browse the Shop
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#3d2c1e] mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                emoji: "🌸",
                title: "Choose Your Flowers",
                desc: "Pick from our collection of handcrafted crochet flowers — roses, tulips, sunflowers, and more.",
              },
              {
                step: "2",
                emoji: "🎨",
                title: "Pick a Wrapper",
                desc: "Select a beautiful wrapper color to complement your bouquet and match your style.",
              },
              {
                step: "3",
                emoji: "📦",
                title: "We Craft & Ship",
                desc: "Your custom bouquet is lovingly assembled and shipped straight to your door.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center p-6 rounded-2xl bg-[#faf7f2] border border-[#e8d5be]"
              >
                <div className="w-10 h-10 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-4xl mb-3">{item.emoji}</div>
                <h3 className="text-xl font-semibold text-[#3d2c1e] mb-2">
                  {item.title}
                </h3>
                <p className="text-[#6b4c30] text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Flowers */}
      {featuredFlowers.length > 0 && (
        <section className="py-16 px-4 bg-[#faf7f2]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#3d2c1e] mb-4">
              Our Flowers
            </h2>
            <p className="text-center text-[#6b4c30] mb-10">
              Each stem is hand-crocheted with premium yarn
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredFlowers.map((flower) => (
                <div
                  key={flower.id}
                  className="bg-white rounded-2xl p-4 text-center border border-[#e8d5be] hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-2">{flower.imageEmoji}</div>
                  <p className="font-semibold text-[#3d2c1e] text-sm">
                    {flower.name}
                  </p>
                  <p className="text-[#7a4f2e] text-sm font-medium">
                    ₱{flower.price.toFixed(2)}
                  </p>
                  {!flower.inStock && (
                    <span className="text-xs text-red-500">Out of stock</span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/bouquet-builder"
                className="bg-[#7a4f2e] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
              >
                Start Building →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Crochet */}
      <section className="py-16 px-4 bg-[#f5ede0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#3d2c1e] mb-6">
            Why Crochet Flowers?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: "♾️", title: "Last Forever", desc: "Never wilt or fade" },
              {
                emoji: "🌿",
                title: "Eco-Friendly",
                desc: "No pesticides or waste",
              },
              {
                emoji: "🎁",
                title: "Perfect Gift",
                desc: "For any occasion",
              },
              {
                emoji: "✂️",
                title: "Handmade",
                desc: "Each one is unique",
              },
            ].map((item) => (
              <div key={item.title} className="p-4">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <h3 className="font-semibold text-[#3d2c1e] mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-[#6b4c30]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#7a4f2e] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🌺</div>
          <h2 className="text-3xl font-bold mb-4">
            Ready to Create Something Beautiful?
          </h2>
          <p className="text-[#e8d5be] mb-8 text-lg">
            Design your perfect crochet bouquet today — a gift that truly lasts
            forever.
          </p>
          <Link
            href="/bouquet-builder"
            className="bg-white text-[#7a4f2e] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#f5ede0] transition-colors"
          >
            Build My Bouquet
          </Link>
        </div>
      </section>
    </div>
  );
}
