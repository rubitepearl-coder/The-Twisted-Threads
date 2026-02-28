"use client";

import { useState } from "react";
import Image from "next/image";

type Order = {
  id: number;
  userId: string | null;
  facebookId: string | null;
  customerName: string;
  facebookName: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  deliveryType: string;
  deliveryLocation: string | null;
  deliveryFee: number | null;
  orderType: string;
  bouquetItems: string | null;
  miniPotItems: string | null;
  shopItems: string | null;
  potId: number | null;
  potName: string | null;
  potImageUrl: string | null;
  wrapperColorId: number | null;
  wrapperColorName: string | null;
  wrapperColorHex: string | null;
  wrapperColorImageUrl: string | null;
  totalPrice: number;
  status: string;
  notes: string | null;
  createdAt: Date | null;
};

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  imageEmoji?: string;
  imageUrl?: string;
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Helper function to validate image URL
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Handle image load error
  const handleImageError = (key: string) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

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
            const items: OrderItem[] = JSON.parse(order.bouquetItems || "[]");
            const miniPotItems: OrderItem[] = JSON.parse(order.miniPotItems || "[]");
            const isMiniPotOrder = order.orderType === "mini_pot";
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
                        {isMiniPotOrder && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-300 border border-green-700">
                            🪴 Mini Pot
                          </span>
                        )}
                        {order.deliveryType === "pickup" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700">
                            🏪 Pickup
                          </span>
                        )}
                      </div>
                      <p className="text-[#c4a882] text-sm">
                        {order.customerName}
                        {order.facebookId && (
                          <span className="ml-2 text-blue-300">📘 {order.facebookId}</span>
                        )}
                        {order.customerEmail && (
                          <span className="ml-2 text-[#7a5c3e]">· {order.customerEmail}</span>
                        )}
                      </p>
                      {order.customerAddress && (
                        <p className="text-[#7a5c3e] text-xs mt-0.5 truncate max-w-xs">
                          📍 {order.customerAddress.split("\n")[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[#f5ede0] font-bold">
                        ₱{order.totalPrice.toFixed(2)}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                      {/* Order Recipe with thumbnails */}
                      <div className="md:col-span-2">
                        <h4 className="text-[#c4a882] text-xs font-medium uppercase tracking-wider mb-3">
                          {isMiniPotOrder ? "🪴 Mini Pot Order" : "🌸 Bouquet Recipe"}
                        </h4>
                        
                        {/* Mini Pot: Show pot first */}
                        {isMiniPotOrder && order.potName && (
                          <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[#3d2c1e]">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#5c3a1e] bg-[#1e1410]">
                              {order.potImageUrl ? (
                                <Image
                                  src={order.potImageUrl}
                                  alt={order.potName}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">
                                  🪴
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[#e8d5be] text-sm font-medium">
                                {order.potName}
                              </p>
                              <p className="text-[#7a5c3e] text-xs">Mini Pot</p>
                            </div>
                          </div>
                        )}

                        {/* Then show items */}
                        {(isMiniPotOrder ? miniPotItems : items).length === 0 ? (
                          <p className="text-[#7a5c3e] text-sm">
                            No items recorded
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {(isMiniPotOrder ? miniPotItems : items).map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                {/* Square thumbnail */}
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#5c3a1e] bg-[#1e1410]">
                                  {isValidImageUrl(item.imageUrl) && !imageErrors[`${order.id}-item-${i}`] ? (
                                    <Image
                                      src={item.imageUrl!}
                                      alt={item.name}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                      unoptimized
                                      onError={() => handleImageError(`${order.id}-item-${i}`)}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg">
                                      {item.imageEmoji ?? "🌸"}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <span className="text-[#e8d5be] text-sm font-medium">
                                    {item.name}
                                  </span>
                                  <span className="text-[#7a5c3e] text-xs ml-2">
                                    × {item.quantity}
                                  </span>
                                </div>
                                <span className="text-[#c4a882] text-sm flex-shrink-0">
                                  ₱{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Wrapper color for bouquets */}
                        {!isMiniPotOrder && order.wrapperColorName && (
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#3d2c1e]">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#5c3a1e]">
                              {order.wrapperColorImageUrl ? (
                                <Image
                                  src={order.wrapperColorImageUrl}
                                  alt={order.wrapperColorName}
                                  width={40}
                                  height={40}
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
                              <p className="text-[#e8d5be] text-sm font-medium">
                                {order.wrapperColorName}
                              </p>
                              <p className="text-[#7a5c3e] text-xs">Wrapper color</p>
                            </div>
                          </div>
                        )}

                        {/* Total */}
                        <div className="mt-3 pt-3 border-t border-[#3d2c1e] flex justify-between">
                          <span className="text-[#c4a882] text-sm">Total</span>
                          <span className="text-[#f5ede0] font-bold">
                            ₱{order.totalPrice.toFixed(2)}
                          </span>
                        </div>
                        {order.deliveryFee != null && order.deliveryFee > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#7a5c3e]">+ Delivery</span>
                            <span className="text-orange-300">₱{order.deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Right column: Customer info + Status */}
                      <div className="space-y-4">
                        {/* Customer / Shipping Info */}
                        <div>
                          <h4 className="text-[#c4a882] text-xs font-medium uppercase tracking-wider mb-3">
                            {order.deliveryType === "pickup" ? "📤 Pickup Info" : "📦 Ship To"}
                          </h4>
                          <div className="space-y-1.5">
                            <p className="text-[#f5ede0] text-sm font-medium">
                              {order.customerName}
                            </p>
                            {order.facebookId && (
                              <p className="text-blue-300 text-xs">
                                📘 {order.facebookId}
                              </p>
                            )}
                            {order.customerEmail && (
                              <p className="text-[#c4a882] text-xs">
                                ✉️ {order.customerEmail}
                              </p>
                            )}
                            {order.deliveryType === "home" && order.customerAddress && (
                              <p className="text-[#e8d5be] text-sm whitespace-pre-line mt-1 bg-[#1e1410] rounded-lg p-2 border border-[#3d2c1e]">
                                {order.customerAddress}
                              </p>
                            )}
                            {order.deliveryLocation && (
                              <p className="text-[#7a5c3e] text-xs mt-1">
                                📍 Location: {order.deliveryLocation}
                              </p>
                            )}
                            {order.deliveryFee != null && order.deliveryFee > 0 && (
                              <p className="text-orange-300 text-xs mt-1">
                                🚚 Delivery Fee: ₱{order.deliveryFee.toFixed(2)}
                              </p>
                            )}
                          </div>
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
