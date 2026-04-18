import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getDb } from "@/db";
import { deliverySettings } from "@/db/schema";
import Link from "next/link";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import DeliverySettingsClient from "./DeliverySettingsClient";

export const dynamic = "force-dynamic";

export default async function DeliverySettingsPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const db = getDb();

  let allLocations: typeof deliverySettings.$inferSelect[] = [];

  try {
    allLocations = await db.select().from(deliverySettings);
  } catch (error) {
    console.error("[DeliverySettings] Error fetching data:", error);
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
              className="text-[#c4a882] hover:text-[#f5ede0] text-sm font-medium transition-colors"
            >
              Orders
            </Link>
            <Link
              href="/admin/delivery-settings"
              className="text-[#f5ede0] text-sm font-bold"
            >
              Delivery Settings
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
          Delivery Settings
        </h2>
        <p className="text-[#c4a882] mb-8">
          Manage delivery locations and fees that appear in the checkout dropdown.
        </p>

        <DeliverySettingsClient initialLocations={allLocations} />
      </main>
    </div>
  );
}