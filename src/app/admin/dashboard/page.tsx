import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export default async function AdminDashboardPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  let totalOrders = 0;
  let pendingOrders = 0;
  let totalProducts = 0;
  let recentOrders: typeof orders.$inferSelect[] = [];

  try {
    const allOrders = await db.select().from(orders);
    totalOrders = allOrders.length;
    pendingOrders = allOrders.filter((o) => o.status === "pending").length;

    const allProducts = await db.select().from(products);
    totalProducts = allProducts.length;

    recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);
  } catch {
    // DB not yet seeded
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
                The Petal Loop
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
        <h2 className="text-2xl font-bold text-[#f5ede0] mb-8">Overview</h2>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#2d1f14] rounded-2xl p-6 border border-[#5c3a1e]">
            <p className="text-[#c4a882] text-sm mb-1">Total Orders</p>
            <p className="text-4xl font-bold text-[#f5ede0]">{totalOrders}</p>
          </div>
          <div className="bg-[#2d1f14] rounded-2xl p-6 border border-[#7a4f2e]">
            <p className="text-[#c4a882] text-sm mb-1">Pending Orders</p>
            <p className="text-4xl font-bold text-[#e8c97a]">{pendingOrders}</p>
          </div>
          <div className="bg-[#2d1f14] rounded-2xl p-6 border border-[#5c3a1e]">
            <p className="text-[#c4a882] text-sm mb-1">Products in Catalog</p>
            <p className="text-4xl font-bold text-[#f5ede0]">{totalProducts}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/admin/inventory"
            className="bg-[#7a4f2e] hover:bg-[#5c3a1e] text-white rounded-2xl p-6 transition-colors group"
          >
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-lg font-bold mb-1">Manage Inventory</h3>
            <p className="text-sm text-[#e8d5be]">
              Update prices, toggle stock, add or remove products
            </p>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-[#4d3828] hover:bg-[#3d2c1e] text-white rounded-2xl p-6 transition-colors"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="text-lg font-bold mb-1">View Orders</h3>
            <p className="text-sm text-[#c4a882]">
              See customer orders, bouquet recipes, and fulfillment status
            </p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#f5ede0]">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="text-[#c4a882] hover:text-[#f5ede0] text-sm transition-colors"
            >
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-[#2d1f14] rounded-2xl p-8 text-center border border-[#5c3a1e]">
              <p className="text-[#7a5c3e]">No orders yet.</p>
            </div>
          ) : (
            <div className="bg-[#2d1f14] rounded-2xl border border-[#5c3a1e] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#5c3a1e]">
                    <th className="text-left px-4 py-3 text-[#c4a882] text-sm font-medium">
                      Order
                    </th>
                    <th className="text-left px-4 py-3 text-[#c4a882] text-sm font-medium">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-[#c4a882] text-sm font-medium">
                      Total
                    </th>
                    <th className="text-left px-4 py-3 text-[#c4a882] text-sm font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#3d2c1e] last:border-0"
                    >
                      <td className="px-4 py-3 text-[#f5ede0] text-sm">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 text-[#e8d5be] text-sm">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-[#c4a882] text-sm font-medium">
                        ₱{order.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
    in_progress: "bg-blue-900/40 text-blue-300 border-blue-700",
    completed: "bg-green-900/40 text-green-300 border-green-700",
    cancelled: "bg-red-900/40 text-red-300 border-red-700",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full border font-medium ${styles[status] ?? "bg-gray-800 text-gray-300 border-gray-600"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
