import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  const bouquetItems = order
    ? (JSON.parse(order.bouquetItems) as {
        name: string;
        quantity: number;
        price: number;
      }[])
    : [];

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#e8d5be] shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🌸</div>
        <h1 className="text-3xl font-bold text-[#3d2c1e] mb-2">
          Order Placed!
        </h1>
        <p className="text-[#6b4c30] mb-6">
          Thank you{order ? `, ${order.customerName}` : ""}! Your custom crochet
          bouquet is on its way to being crafted with love.
        </p>

        {order && (
          <div className="bg-[#faf7f2] rounded-2xl p-5 text-left mb-6 border border-[#e8d5be]">
            <h2 className="font-semibold text-[#3d2c1e] mb-3">
              Order #{order.id} Summary
            </h2>
            <ul className="space-y-1 mb-3">
              {bouquetItems.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-[#6b4c30]">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-[#7a4f2e] font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            {order.wrapperColorName && (
              <p className="text-sm text-[#6b4c30] border-t border-[#e8d5be] pt-2">
                Wrapper: {order.wrapperColorName}
              </p>
            )}
            <p className="text-lg font-bold text-[#3d2c1e] mt-2">
              Total: ${order.totalPrice.toFixed(2)}
            </p>
          </div>
        )}

        <p className="text-sm text-[#a07850] mb-6">
          We&apos;ll send a confirmation to{" "}
          {order?.customerEmail ?? "your email"} shortly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/bouquet-builder"
            className="bg-[#7a4f2e] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
          >
            Build Another Bouquet
          </Link>
          <Link
            href="/"
            className="bg-[#f5ede0] text-[#7a4f2e] px-6 py-3 rounded-full font-semibold hover:bg-[#e8d5be] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
