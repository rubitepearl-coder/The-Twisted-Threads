"use client";

import { useState } from "react";

type Order = {
  id: number;
  customerName: string;
  customerEmail: string;
  orderType: string;
  bouquetItems: string;
  wrapperColorName: string | null;
  totalPrice: number;
  status: string;
  notes: string | null;
  createdAt: Date | null;
};

type BouquetItem = {
  name: string;
  quantity: number;
  price: number;
};

export default function OrdersClient({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [message, setMessage] = useState("");

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
      showMessage(`✅ Order #${orderId} updated to ${newStatus}`);
    } catch {
      showMessage("❌ Failed to update order");
    }
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    in_progress: orders.filter((o) => o.status === "in_progress").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div>
      {/* Message Toast */}
      {message && (
        <div className="fixed top-4 right-4 bg-[#2d1f14] border border-[#7a4f2e] text-[#f5ede0] px-4 py-3 rounded-xl shadow-lg z-50 text-sm">
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "in_progress", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === key
                ? "bg-[#7a4f2e] text-white"
                : "bg-[#2d1f14] text-[#c4a882] hover:text-[#f5ede0] border border-[#5c3a1e]"
            }`}
          >
            {label} ({statusCounts[key]})
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-[#2d1f14] rounded-2xl p-8 text-center border border-[#5c3a1e]">
          <p className="text-[#7a5c3e]">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const items: BouquetItem[] = JSON.parse(order.bouquetItems || "[]");
            const isExpanded = expandedId === order.id;
            const date = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Unknown date";

            return (
              <div
                key={order.id}
                className="bg-[#2d1f14] rounded-2xl border border-[#5c3a1e] overflow-hidden"
              >
                {/* Order Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[#3d2c1e] transition-colors"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : order.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#f5ede0] font-bold">
                          #{order.id}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-[#c4a882] text-sm">
                        {order.customerName} · {order.customerEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[#f5ede0] font-bold">
                        ${order.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-[#7a5c3e] text-xs">{date}</p>
                    </div>
                    <span className="text-[#7a5c3e] text-lg">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[#3d2c1e]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Bouquet Recipe */}
                      <div>
                        <h4 className="text-[#c4a882] text-xs font-medium uppercase tracking-wider mb-3">
                          🌸 Bouquet Recipe
                        </h4>
                        {items.length === 0 ? (
                          <p className="text-[#7a5c3e] text-sm">
                            No items recorded
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {items.map((item, i) => (
                              <li
                                key={i}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-[#e8d5be]">
                                  {item.name} × {item.quantity}
                                </span>
                                <span className="text-[#c4a882]">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {order.wrapperColorName && (
                          <p className="text-sm text-[#7a5c3e] mt-2 pt-2 border-t border-[#3d2c1e]">
                            Wrapper: {order.wrapperColorName}
                          </p>
                        )}
                      </div>

                      {/* Status Update */}
                      <div>
                        <h4 className="text-[#c4a882] text-xs font-medium uppercase tracking-wider mb-3">
                          Update Status
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "pending", label: "Pending" },
                            { value: "in_progress", label: "In Progress" },
                            { value: "completed", label: "Completed" },
                            { value: "cancelled", label: "Cancelled" },
                          ].map((s) => (
                            <button
                              key={s.value}
                              onClick={() => updateStatus(order.id, s.value)}
                              disabled={order.status === s.value}
                              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                order.status === s.value
                                  ? "bg-[#7a4f2e] text-white border-[#7a4f2e]"
                                  : "bg-[#1e1410] text-[#c4a882] border-[#5c3a1e] hover:border-[#7a4f2e] hover:text-[#f5ede0]"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? "bg-gray-800 text-gray-300 border-gray-600"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
