"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Flower = {
  id: number;
  name: string;
  price: number;
  salePrice: number | null;
  stockQuantity: number | null;
  inStock: boolean;
  imageEmoji: string;
  imageUrl: string | null;
  description: string;
};

type WrapperColor = {
  id: number;
  name: string;
  colorHex: string;
  imageUrl: string | null;
  inStock: boolean;
};

type Props = {
  flowers: Flower[];
  wrapperColors: WrapperColor[];
};

export default function BouquetBuilderClient({ flowers, wrapperColors }: Props) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedWrapper, setSelectedWrapper] = useState<number | null>(
    wrapperColors.find((c) => c.inStock)?.id ?? null
  );
  const [customerName, setCustomerName] = useState(""); // Full legal name
  const [facebookName, setFacebookName] = useState(""); // Facebook name for contact
  const [customerEmail, setCustomerEmail] = useState(""); // Optional email
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "pickup">("home");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
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

  // Show all flowers, but mark out-of-stock ones
  // const availableFlowers = flowers.filter((f) => f.inStock && f.stockQuantity > 0);
  const availableFlowers = flowers;

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      const flower = flowers.find(f => f.id === id);
      const maxStock = flower?.stockQuantity ?? 999;
      const next = Math.max(0, Math.min(current + delta, maxStock));
      return { ...prev, [id]: next };
    });
  };

  const totalStems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = flowers.reduce((sum, flower) => {
    return sum + (quantities[flower.id] ?? 0) * (flower.salePrice || flower.price);
  }, 0);

  // Calculate delivery fee:
  // - ₱10 for Anini-y
  // - FREE for San Francisco area (STHS, SFES, nearby houses)
  // - ₱10 for other locations
  const deliveryFee = deliveryType === "home" && deliveryLocation 
    ? (() => {
        const loc = deliveryLocation.toLowerCase();
        if (loc.includes("aniniy") || loc.includes("anini-y")) return 10; // Anini-y
        if (loc.includes("san francisco") || loc.includes("sths") || loc.includes("sfes")) return 0; // Free
        return 10; // Other locations
      })()
    : 0;

  const finalTotal = totalPrice + deliveryFee;

  const selectedItems = flowers.filter((f) => (quantities[f.id] ?? 0) > 0);
  const selectedWrapperObj = wrapperColors.find((c) => c.id === selectedWrapper);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalStems === 0) {
      setError("Please add at least one flower to your bouquet.");
      return;
    }
    if (!selectedWrapper) {
      setError("Please select a wrapper color.");
      return;
    }
    if (!customerName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!facebookName.trim()) {
      setError("Please enter your Facebook name for contact.");
      return;
    }
    if (deliveryType === "home" && !customerAddress.trim()) {
      setError("Please enter your delivery address.");
      return;
    }
    if (deliveryType === "home" && !deliveryLocation.trim()) {
      setError("Please enter your location (municipality/barangay) for delivery fee calculation.");
      return;
    }

    // Check stock availability before submitting
    for (const item of selectedItems) {
      const qty = quantities[item.id];
      // Only check stock if stockQuantity is explicitly set
      if (item.stockQuantity !== null && qty > item.stockQuantity) {
        setError(`Not enough stock for ${item.name}. Only ${item.stockQuantity} available.`);
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const bouquetItems = selectedItems.map((f) => ({
        productId: f.id,
        name: f.name,
        quantity: quantities[f.id],
        price: f.salePrice || f.price,
        imageEmoji: f.imageEmoji,
        imageUrl: f.imageUrl ?? "",
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          facebookName: facebookName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerAddress: customerAddress.trim() || undefined,
          deliveryType,
          deliveryLocation: deliveryLocation.trim() || null,
          orderType: "bouquet",
          bouquetItems,
          wrapperColorId: selectedWrapper,
          wrapperColorName: selectedWrapperObj?.name,
          wrapperColorHex: selectedWrapperObj?.colorHex,
          wrapperColorImageUrl: selectedWrapperObj?.imageUrl ?? "",
          totalPrice: finalTotal,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place order");
      }

      const data = await res.json();
      router.push(`/order-confirmation?id=${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (flowers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🌱</div>
        <h2 className="text-2xl font-bold text-[#3d2c1e] mb-3">
          Coming Soon!
        </h2>
        <p className="text-[#6b4c30]">
          Our flower catalog is being set up. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Flower Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Flowers */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Choose Your Flowers
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                Use the + and − buttons to set how many of each flower you want.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableFlowers.map((flower) => {
                  const qty = quantities[flower.id] ?? 0;
                    const isOutOfStock = flower.stockQuantity !== null && flower.stockQuantity <= 0;
                  return (
                    <div
                      key={flower.id}
                      className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                        qty > 0
                          ? "border-[#7a4f2e] shadow-md"
                          : isOutOfStock
                          ? "border-gray-200 opacity-60"
                          : "border-[#e8d5be] hover:border-[#c4a882]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Square image or emoji fallback */}
                        {isValidImageUrl(flower.imageUrl) && !imageErrors[`flower-${flower.id}`] ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be]">
                            <Image
                              src={flower.imageUrl!}
                              alt={flower.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                              unoptimized
                              onError={() => handleImageError(`flower-${flower.id}`)}
                            />
                          </div>
                        ) : (
                          <span className="text-4xl flex-shrink-0">{flower.imageEmoji}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#3d2c1e]">
                            {flower.name}
                            {isOutOfStock && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Sold Out
                              </span>
                            )}
                          </p>
                          <p className="text-[#7a4f2e] text-sm font-medium">
                            {flower.salePrice ? (
                              <span>
                                <span className="text-green-600">₱{flower.salePrice.toFixed(2)}</span>
                                <span className="text-[#a07850] line-through text-xs ml-1">₱{flower.price.toFixed(2)}</span>
                              </span>
                            ) : (
                              <span>₱{flower.price.toFixed(2)}</span>
                            )}
                            <span className="text-xs font-normal text-[#a07850]"> / stem</span>
                          </p>
                          {flower.stockQuantity !== null && flower.stockQuantity <= 5 && flower.stockQuantity > 0 && (
                            <p className="text-xs text-orange-600 font-medium">
                              Only {flower.stockQuantity} left!
                            </p>
                          )}
                          {isOutOfStock && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Available in shop
                            </p>
                          )}
                          {flower.description && !isOutOfStock && (
                            <p className="text-xs text-[#a07850] mt-0.5 truncate">
                              {flower.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(flower.id, -1)}
                            disabled={qty === 0 || isOutOfStock}
                            className="w-8 h-8 rounded-full bg-[#f5ede0] text-[#7a4f2e] font-bold text-lg flex items-center justify-center hover:bg-[#e8d5be] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-[#3d2c1e] text-lg">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(flower.id, 1)}
                            disabled={isOutOfStock || (flower.stockQuantity !== null && qty >= flower.stockQuantity)}
                            className="w-8 h-8 rounded-full bg-[#7a4f2e] text-white font-bold text-lg flex items-center justify-center hover:bg-[#5c3a1e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Wrapper Color */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Pick a Wrapper Color
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                Choose the wrapping paper color for your bouquet.
              </p>

              {wrapperColors.filter((c) => c.inStock).length === 0 ? (
                <p className="text-[#a07850] ml-10">
                  No wrapper colors available right now.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3 ml-10">
                  {wrapperColors
                    .filter((c) => c.inStock)
                    .map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedWrapper(color.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all font-medium text-sm ${
                          selectedWrapper === color.id
                            ? "border-[#7a4f2e] bg-[#f5ede0] text-[#3d2c1e] shadow-md"
                            : "border-[#e8d5be] bg-white text-[#6b4c30] hover:border-[#c4a882]"
                        }`}
                      >
                        {isValidImageUrl(color.imageUrl) && !imageErrors[`wrapper-${color.id}`] ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                            <Image
                              src={color.imageUrl!}
                              alt={color.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              unoptimized
                              onError={() => handleImageError(`wrapper-${color.id}`)}
                            />
                          </div>
                        ) : (
                          <span
                            className="w-5 h-5 rounded-full border border-gray-200 inline-block flex-shrink-0"
                            style={{ backgroundColor: color.colorHex }}
                          />
                        )}
                        {color.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Step 3: Delivery Type */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Delivery Option
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                Choose how you want to receive your order.
              </p>
              <div className="ml-10 flex gap-4">
                <label className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  deliveryType === "home" 
                    ? "border-[#7a4f2e] bg-[#f5ede0]" 
                    : "border-[#e8d5be] hover:border-[#c4a882]"
                }`}>
                  <input
                    type="radio"
                    name="deliveryType"
                    value="home"
                    checked={deliveryType === "home"}
                    onChange={() => setDeliveryType("home")}
                    className="w-4 h-4 text-[#7a4f2e]"
                  />
                  <span className="text-[#3d2c1e] font-medium">🏠 Home Delivery</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  deliveryType === "pickup" 
                    ? "border-[#7a4f2e] bg-[#f5ede0]" 
                    : "border-[#e8d5be] hover:border-[#c4a882]"
                }`}>
                  <input
                    type="radio"
                    name="deliveryType"
                    value="pickup"
                    checked={deliveryType === "pickup"}
                    onChange={() => setDeliveryType("pickup")}
                    className="w-4 h-4 text-[#7a4f2e]"
                  />
                  <span className="text-[#3d2c1e] font-medium">🏪 Pickup</span>
                </label>
              </div>
              
              {/* Show location field for delivery fee calculation */}
              {deliveryType === "home" && (
                <div className="ml-10 mt-4">
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Location (Municipality/Barangay) *
                  </label>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g., Anini-y, Sibalom, San Jose"
                    className="w-full sm:w-80 border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                    required={deliveryType === "home"}
                  />
                  <p className="text-xs text-[#a07850] mt-1">
                    Enter your municipality to calculate delivery fee.
                    Free delivery for STHS, SFES, and San Francisco nearby.
                    ₱10 for Anini-y and other areas.
                  </p>
                </div>
              )}
            </div>

            {/* Step 4: Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {deliveryType === "home" ? "5" : "4"}
                </span>
                Your Details
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                So we know where to send your bouquet.
              </p>
              <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Full Name * <span className="text-xs text-[#a07850] font-normal">(for shipping records)</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g., Juan dela Cruz"
                    className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Facebook Name * <span className="text-xs text-[#a07850] font-normal">(for contact via Messenger)</span>
                  </label>
                  <input
                    type="text"
                    value={facebookName}
                    onChange={(e) => setFacebookName(e.target.value)}
                    placeholder="e.g., pearl.rubite"
                    className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Email Address <span className="text-xs text-[#a07850] font-normal">(optional - for order confirmation)</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g., juan@example.com"
                    className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                  />
                </div>
                {deliveryType === "home" && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="123 Main St, Apt 4B&#10;Anini-y, Antique 5715"
                      rows={3}
                      className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent resize-none"
                      required={deliveryType === "home"}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl border border-[#e8d5be] p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#3d2c1e] mb-4 flex items-center gap-2">
                🧺 Your Bouquet
              </h3>

              {selectedItems.length === 0 ? (
                <p className="text-[#a07850] text-sm italic mb-4">
                  No flowers selected yet...
                </p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {selectedItems.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between text-sm gap-2"
                    >
                      <span className="flex items-center gap-1.5 text-[#3d2c1e]">
                        {isValidImageUrl(f.imageUrl) && !imageErrors[`summary-flower-${f.id}`] ? (
                          <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={f.imageUrl!}
                              alt={f.name}
                              width={24}
                              height={24}
                              className="w-full h-full object-cover"
                              unoptimized
                              onError={() => handleImageError(`summary-flower-${f.id}`)}
                            />
                          </div>
                        ) : (
                          <span>{f.imageEmoji}</span>
                        )}
                        {f.name} × {quantities[f.id]}
                      </span>
                      <span className="text-[#7a4f2e] font-medium flex-shrink-0">
                        ₱{((quantities[f.id] ?? 0) * (f.salePrice || f.price)).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {selectedWrapperObj && (
                <div className="flex items-center gap-2 text-sm text-[#6b4c30] mb-4 pb-4 border-b border-[#e8d5be]">
                  {isValidImageUrl(selectedWrapperObj.imageUrl) && !imageErrors[`summary-wrapper-${selectedWrapperObj.id}`] ? (
                    <div className="w-5 h-5 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                      <Image
                        src={selectedWrapperObj.imageUrl!}
                        alt={selectedWrapperObj.name}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                        unoptimized
                        onError={() => handleImageError(`summary-wrapper-${selectedWrapperObj.id}`)}
                      />
                    </div>
                  ) : (
                    <span
                      className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: selectedWrapperObj.colorHex }}
                    />
                  )}
                  <span>{selectedWrapperObj.name} wrapper</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#6b4c30] text-sm">
                    {totalStems} stem{totalStems !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[#3d2c1e]">
                    ₱{totalPrice.toFixed(2)}
                  </span>
                </div>
                
                {deliveryType === "home" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6b4c30]">
                      Delivery {deliveryLocation && (deliveryLocation.toLowerCase().includes("aniniy") || deliveryLocation.toLowerCase().includes("anini-y")) && "(Anini-y)"}
                    </span>
                    <span className={deliveryFee > 0 ? "text-[#7a4f2e]" : "text-green-600"}>
                      {deliveryFee > 0 ? `₱${deliveryFee.toFixed(2)}` : "Free"}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t border-[#e8d5be]">
                  <span className="text-[#3d2c1e] font-bold">Total</span>
                  <span className="text-2xl font-bold text-[#3d2c1e]">
                    ₱{finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-lg p-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || totalStems === 0}
                className="w-full bg-[#7a4f2e] text-white py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? "Placing Order..." : "Place Order 🌸"}
              </button>

              <p className="text-xs text-[#a07850] text-center mt-3">
                We will confirm your order by email
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
