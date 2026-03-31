import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import OrderConfirmationClient from "./OrderConfirmationClient";

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
    } catch (e) {
      console.error("Failed to fetch order:", e);
    }
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#3d2c1e] mb-4">Order Not Found</h1>
          <Link href="/" className="text-[#7a4f2e] hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  let bouquetItems: OrderItem[] = [];
  let miniPotItems: OrderItem[] = [];
  let shopItems: OrderItem[] = [];
  let addonItems: any[] = [];

  try {
    bouquetItems = order?.bouquetItems
      ? (JSON.parse(order.bouquetItems) as OrderItem[])
      : [];
  } catch (e) {
    console.error("Failed to parse bouquetItems:", e);
  }

  try {
    miniPotItems = order?.miniPotItems
      ? (JSON.parse(order.miniPotItems) as OrderItem[])
      : [];
  } catch (e) {
    console.error("Failed to parse miniPotItems:", e);
  }

  try {
    shopItems = order?.shopItems
      ? (JSON.parse(order.shopItems) as OrderItem[])
      : [];
  } catch (e) {
    console.error("Failed to parse shopItems:", e);
  }

  try {
    addonItems = order?.addonItems
      ? (JSON.parse(order.addonItems) as any[])
      : [];
  } catch (e) {
    console.error("Failed to parse addonItems:", e);
  }

  return (
    <OrderConfirmationClient
      order={order}
      bouquetItems={bouquetItems}
      miniPotItems={miniPotItems}
      shopItems={shopItems}
      addonItems={addonItems}
    />
  );
}
