import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getDb } from "@/db";
import { products, wrapperColors, addons } from "@/db/schema";
import Link from "next/link";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  let db;
  try {
    db = getDb();
  } catch (dbError) {
    console.error("[Inventory] Database initialization failed:", dbError);
  }

  let allProducts: typeof products.$inferSelect[] = [];
  let allColors: typeof wrapperColors.$inferSelect[] = [];
  let allAddons: typeof addons.$inferSelect[] = [];

  if (db) {
    try {
      console.log("[Inventory] Fetching products from database...");
      allProducts = await db.select().from(products);
      allColors = await db.select().from(wrapperColors);
      allAddons = await db.select().from(addons);
      console.log("[Inventory] Found products:", allProducts.length);
      console.log("[Inventory] Found colors:", allColors.length);
      console.log("[Inventory] Found addons:", allAddons.length);
    } catch (error) {
      console.error("[Inventory] Error fetching data:", error);
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
              className="text-[#f5ede0] text-sm font-bold"
            >
              Inventory
            </Link>
            <Link
              href="/admin/orders"
              className="text-[#c4a882] hover:text-[#f5ede0] text-sm font-medium transition-colors"
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
          Inventory Management
        </h2>
        <p className="text-[#c4a882] mb-8">
          Update prices, toggle stock availability, and manage your product
          catalog.
        </p>

        <InventoryClient
          initialProducts={allProducts}
          initialColors={allColors}
          initialAddons={allAddons}
        />
      </main>
    </div>
  );
}
