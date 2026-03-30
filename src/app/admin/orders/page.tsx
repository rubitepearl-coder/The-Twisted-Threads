import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  let db;
  try {
    db = getDb();
  } catch (dbError) {
    console.error("[Orders] Database initialization failed:", dbError);
  }

  let allOrders: typeof orders.$inferSelect[] = [];

  if (db) {
    try {
      console.log("[Orders] Fetching orders from database...");
      allOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));
      console.log("[Orders] Found orders:", allOrders.length);
    } catch (error) {
      console.error("[Orders] Error fetching data:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#1e1410]">
      {/* Admin Header */}
      <header className="bg-[#2d1f14] border-b border-[#5c3a1e] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧶</span>
            <div>
              <h1 className="text-xl font-bold text-[#f5ede0]">
                The Twisted Threads
              </h1>
              <p className="text-xs text-[#c4a882]">Admin Dashboard</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-[#c4a882] hover:text-[#f5ede0] text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/inventory"
              className="text-[#c4a882] hover:text-[#f5ede0] text-sm font-medium transition-colors"
            >
              Inventory
            </Link>
            <Link
              href="/admin/orders"
              className="text-[#f5ede0] text-sm font-bold"
            >
              Orders
            </Link>
            <Link
              href="/"
              className="text-[#c4a882] hover:text-[#f5ede0] text-sm transition-colors"
            >
              View Site →
            </Link>
            <AdminLogoutButton />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-[#f5ede0] mb-2">
          Customer Orders
        </h2>
        <p className="text-[#c4a882] mb-8">
          View and manage all customer orders. Update status to track
          fulfillment.
        </p>

        <OrdersClient initialOrders={allOrders} />
      </main>
    </div>
  );
}
