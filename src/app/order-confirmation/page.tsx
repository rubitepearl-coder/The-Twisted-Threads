import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

type OrderItem = {
  productId?: number;
  name: string;
  quantity: number;
  price: number;
  imageEmoji?: string;
  imageUrl?: string;
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.id ? parseInt(params.id) : null;

  let order: typeof orders.$inferSelect | null = null;
  if (orderId) {
    try {
      const result = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
      order = result[0] ?? null;
    } catch {
      // ignore
    }
  }

  const bouquetItems: OrderItem[] = order
    ? (JSON.parse(order.bouquetItems) as OrderItem[])
    : [];

  const miniPotItems: OrderItem[] = order
    ? (JSON.parse(order.miniPotItems) as OrderItem[])
    : [];

  const isMiniPotOrder = order?.orderType === "mini_pot";
  const isBouquetOrder = order?.orderType === "bouquet" || (!isMiniPotOrder && bouquetItems.length > 0);

  return (
    <div className="min-h-screen bg-[#faf7f2] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Hero Thank You Card */}
        <div className="bg-white rounded-3xl border border-[#e8d5be] shadow-lg p-8 text-center mb-6">
          <div className="text-6xl mb-4">{isMiniPotOrder ? "🪴" : "🌸"}</div>
          <h1 className="text-3xl font-bold text-[#3d2c1e] mb-2">
            Thank You{order ? `, ${order.customerName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-[#6b4c30] text-lg">
            {order
              ? isMiniPotOrder
                ? "We're crafting your adorable mini pot with fuzzy wire flowers with love. 🪴"
                : "We're getting your flowers ready and crafting your bouquet with love. 💐"
              : "Your order has been placed!"}
          </p>
          {order && (
            <p className="text-sm text-[#a07850] mt-3">
              Order #{order.id} · Confirmation sent to{" "}
              <span className="font-medium">{order.customerEmail}</span>
            </p>
          )}
        </div>

        {order && (
          <>
            {/* Order Recipe */}
            <div className="bg-white rounded-3xl border border-[#e8d5be] shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-[#3d2c1e] mb-4 flex items-center gap-2">
                {isMiniPotOrder ? "🪴 Your Mini Pot" : "🧺 Your Bouquet Recipe"}
              </h2>

              {/* Mini Pot: Show pot first */}
              {isMiniPotOrder && order.potName && (
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[#e8d5be]">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be] bg-[#f5ede0]">
                    {order.potImageUrl ? (
                      <Image
                        src={order.potImageUrl}
                        alt={order.potName}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🪴
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#3d2c1e]">
                      {order.potName}
                    </p>
                    <p className="text-sm text-[#a07850]">Mini Pot</p>
                  </div>
                </div>
              )}

              {/* Then show flowers/items */}
              {isMiniPotOrder && miniPotItems.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {miniPotItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {/* Square thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be] bg-[#f5ede0]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {item.imageEmoji ?? "🌸"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#3d2c1e]">
                          {item.name}
                        </p>
                        <p className="text-sm text-[#a07850]">
                          {item.quantity} flower{item.quantity !== 1 ? "s" : ""} ×
                          ₱{item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="text-[#7a4f2e] font-bold flex-shrink-0">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : isBouquetOrder && bouquetItems.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {bouquetItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {/* Square thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be] bg-[#f5ede0]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {item.imageEmoji ?? "🌸"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#3d2c1e]">
                          {item.name}
                        </p>
                        <p className="text-sm text-[#a07850]">
                          {item.quantity} stem{item.quantity !== 1 ? "s" : ""} ×
                          ₱{item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="text-[#7a4f2e] font-bold flex-shrink-0">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#a07850] text-sm mb-4">No items recorded.</p>
              )}

              {/* Wrapper color for bouquets */}
              {isBouquetOrder && order.wrapperColorName && (
                <div className="flex items-center gap-3 pt-3 border-t border-[#e8d5be]">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be] bg-[#f5ede0]">
                    {order.wrapperColorImageUrl ? (
                      <Image
                        src={order.wrapperColorImageUrl}
                        alt={order.wrapperColorName}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: order.wrapperColorHex ?? "#e8d5be" }}
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[#3d2c1e]">
                      {order.wrapperColorName}
                    </p>
                    <p className="text-sm text-[#a07850]">Wrapper color</p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-[#e8d5be] flex justify-between items-center">
                <span className="text-[#6b4c30] font-medium">Order Total</span>
                <span className="text-2xl font-bold text-[#3d2c1e]">
                  ₱{order.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Shipping Details */}
            <div className="bg-white rounded-3xl border border-[#e8d5be] shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-[#3d2c1e] mb-4 flex items-center gap-2">
                📦 Delivery Details
              </h2>
              <div className="space-y-2">
                <div className="flex gap-3">
                  <span className="text-[#a07850] text-sm w-20 flex-shrink-0">Name</span>
                  <span className="text-[#3d2c1e] font-medium">{order.customerName}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#a07850] text-sm w-20 flex-shrink-0">Email</span>
                  <span className="text-[#3d2c1e]">{order.customerEmail}</span>
                </div>
                {order.customerAddress && (
                  <div className="flex gap-3">
                    <span className="text-[#a07850] text-sm w-20 flex-shrink-0">Address</span>
                    <span className="text-[#3d2c1e] whitespace-pre-line">
                      {order.customerAddress}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isMiniPotOrder ? (
            <Link
              href="/mini-pot-builder"
              className="bg-[#7a4f2e] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors text-center"
            >
              Build Another Mini Pot
            </Link>
          ) : (
            <Link
              href="/bouquet-builder"
              className="bg-[#7a4f2e] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors text-center"
            >
              Build Another Bouquet
            </Link>
          )}
          <Link
            href="/"
            className="bg-[#f5ede0] text-[#7a4f2e] px-6 py-3 rounded-full font-semibold hover:bg-[#e8d5be] transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
