"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  imageEmoji: string;
  imageUrl: string;
};

type AddonItem = {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number;
  imageUrl: string;
};

type Order = {
  id: number;
  customerName: string;
  facebookName: string | null;
  customerEmail: string | null;
  customerAddress: string;
  deliveryType: string;
  deliveryLocation: string | null;
  deliveryFee: number;
  orderType: string;
  bouquetItems: string;
  miniPotItems: string;
  shopItems: string;
  addonItems: string | null;
  potId: number | null;
  potName: string | null;
  potImageUrl: string | null;
  wrapperColorId: number | null;
  wrapperColorName: string | null;
  wrapperColorHex: string | null;
  wrapperColorImageUrl: string | null;
  totalPrice: number;
  status: string;
  notes: string;
  createdAt: string;
};

export default function MyOrdersClient() {
  const [customerName, setCustomerName] = useState("");
  const [facebookName, setFacebookName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Please enter your name to view your orders.");
      return;
    }

    setLoading(true);
    setError("");
    setOrders([]);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        customerName: customerName.trim(),
      });
      
      // Add facebookName if provided for better matching
      if (facebookName.trim()) {
        params.set("facebookName", facebookName.trim());
      }

      const res = await fetch(`/api/orders/customer?${params}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch orders");
      }

      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const parseItems = (itemsJson: string): OrderItem[] => {
    try {
      return JSON.parse(itemsJson);
    } catch {
      return [];
    }
  };

  const parseAddonItems = (addonItemsJson: string | null): AddonItem[] => {
    try {
      return addonItemsJson ? JSON.parse(addonItemsJson) : [];
    } catch {
      return [];
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f5ede0] to-[#ede0d0] py-12 px-4 text-center border-b border-[#d4b896]">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-4xl font-bold text-[#3d2c1e] mb-3">
          My Orders
        </h1>
        <p className="text-[#6b4c30] text-lg max-w-xl mx-auto">
          View your past orders by entering your name.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Search Form */}
        <div className="bg-white rounded-2xl border border-[#e8d5be] p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#3d2c1e] mb-4">
            Find Your Orders
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Pearl Rubite"
                  className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                  Your Facebook Name (for better matching)
                </label>
                <input
                  type="text"
                  value={facebookName}
                  onChange={(e) => setFacebookName(e.target.value)}
                  placeholder="e.g., pearl.rubite"
                  className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                />
              </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7a4f2e] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#5c3a1e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search Orders"}
            </button>
          </form>
        </div>

        {/* Orders List */}
        {searched && !loading && (
          <div>
            <h2 className="text-xl font-bold text-[#3d2c1e] mb-4">
              {orders.length > 0 ? `Found ${orders.length} Order(s)` : "No Orders Found"}
            </h2>

            {orders.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#e8d5be] p-8 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-[#6b4c30] mb-4">
                  No orders found with that name.
                </p>
                <p className="text-sm text-[#a07850]">
                  Make sure you use the same name you used when placing your order.
                </p>
              </div>
            )}

            {orders.map((order) => {
              const bouquetItems = parseItems(order.bouquetItems || "[]");
              const miniPotItems = parseItems(order.miniPotItems || "[]");
              const shopItems = parseItems(order.shopItems || "[]");
              const addonItems = parseAddonItems(order.addonItems);
              const allItems = [...bouquetItems, ...miniPotItems, ...shopItems];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#e8d5be] p-6 mb-4 shadow-sm"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-[#e8d5be]">
                    <div>
                      <h3 className="font-bold text-[#3d2c1e] text-lg">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-[#a07850]">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-[#3d2c1e] mb-2">Items:</h4>
                    <div className="space-y-2">
                      {allItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 bg-[#faf7f2] rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#e8d5be]">
                            {isValidImageUrl(item.imageUrl) && !imageErrors[`${order.id}-${idx}`] ? (
                              <Image
                                src={item.imageUrl!}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                unoptimized
                                onError={() => handleImageError(`${order.id}-${idx}`)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">
                                {item.imageEmoji}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#3d2c1e] text-sm">
                              {item.name}
                            </p>
                            <p className="text-xs text-[#a07850]">
                              Quantity: {item.quantity} × ₱{item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Pot if mini pot order */}
                      {order.potName && (
                        <div className="flex items-center gap-3 p-2 bg-[#faf7f2] rounded-lg">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#e8d5be]">
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
                              <div className="w-full h-full flex items-center justify-center text-xl">
                                🪴
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#3d2c1e] text-sm">
                              {order.potName} (Pot)
                            </p>
                            <p className="text-xs text-[#a07850]">Quantity: 1</p>
                          </div>
                        </div>
                       )}
                     </div>
                   </div>

                   {/* Add-ons */}
                   {addonItems.length > 0 && (
                     <div className="mb-4">
                       <h4 className="font-semibold text-[#3d2c1e] mb-2">Add-ons:</h4>
                       <div className="space-y-2">
                         {addonItems.map((addon, idx) => (
                           <div
                             key={idx}
                             className="flex items-center gap-3 p-2 bg-[#faf7f2] rounded-lg"
                           >
                             <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#e8d5be]">
                               {isValidImageUrl(addon.imageUrl) && !imageErrors[`addon-${order.id}-${idx}`] ? (
                                 <Image
                                   src={addon.imageUrl}
                                   alt={addon.name}
                                   width={40}
                                   height={40}
                                   className="w-full h-full object-cover"
                                   unoptimized
                                   onError={() => handleImageError(`addon-${order.id}-${idx}`)}
                                 />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-xl">
                                   {addon.type === 'letter' && '✉️'}
                                   {addon.type === 'card' && '💌'}
                                   {addon.type === 'wrapper' && '🎁'}
                                   {addon.type === 'other' && '✨'}
                                   {!addon.type && '✨'}
                                 </div>
                               )}
                             </div>
                             <div className="flex-1">
                               <p className="font-medium text-[#3d2c1e] text-sm">
                                 {addon.name}
                               </p>
                               <p className="text-xs text-[#a07850]">
                                 +₱{addon.price.toFixed(2)}
                               </p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Wrapper Color */}
                  {order.wrapperColorName && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-[#3d2c1e] mb-2">Wrapper:</h4>
                      <div className="flex items-center gap-2">
                        {order.wrapperColorImageUrl ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#e8d5be]">
                            <Image
                              src={order.wrapperColorImageUrl}
                              alt={order.wrapperColorName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full border border-gray-200"
                            style={{
                              backgroundColor: order.wrapperColorHex || "#ccc",
                            }}
                          />
                        )}
                        <span className="text-sm text-[#6b4c30]">
                          {order.wrapperColorName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Delivery Info */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-[#3d2c1e] mb-2">Delivery:</h4>
                    <p className="text-sm text-[#6b4c30]">
                      {order.deliveryType === "pickup"
                        ? "Pickup"
                        : `Home Delivery to ${order.deliveryLocation || order.customerAddress}`}
                    </p>
                    {order.deliveryFee > 0 && (
                      <p className="text-xs text-[#a07850]">
                        Delivery Fee: ₱{order.deliveryFee.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t border-[#e8d5be]">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#3d2c1e]">Total:</span>
                      <span className="text-xl font-bold text-[#7a4f2e]">
                        ₱{order.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
