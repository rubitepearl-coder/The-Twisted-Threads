"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Flower = {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
  imageEmoji: string;
  description: string;
};

type WrapperColor = {
  id: number;
  name: string;
  colorHex: string;
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
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availableFlowers = flowers.filter((f) => f.inStock);

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const totalStems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = flowers.reduce((sum, flower) => {
    return sum + (quantities[flower.id] ?? 0) * flower.price;
  }, 0);

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
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Please enter your name and email.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const bouquetItems = selectedItems.map((f) => ({
        productId: f.id,
        name: f.name,
        quantity: quantities[f.id],
        price: f.price,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          orderType: "bouquet",
          bouquetItems,
          wrapperColorId: selectedWrapper,
          wrapperColorName: selectedWrapperObj?.name,
          totalPrice,
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
                  return (
                    <div
                      key={flower.id}
                      className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                        qty > 0
                          ? "border-[#7a4f2e] shadow-md"
                          : "border-[#e8d5be] hover:border-[#c4a882]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{flower.imageEmoji}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-[#3d2c1e]">
                            {flower.name}
                          </p>
                          <p className="text-[#7a4f2e] text-sm font-medium">
                            ${flower.price.toFixed(2)} / stem
                          </p>
                          {flower.description && (
                            <p className="text-xs text-[#a07850] mt-0.5">
                              {flower.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(flower.id, -1)}
                            disabled={qty === 0}
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
                            className="w-8 h-8 rounded-full bg-[#7a4f2e] text-white font-bold text-lg flex items-center justify-center hover:bg-[#5c3a1e] transition-colors"
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all font-medium text-sm ${
                          selectedWrapper === color.id
                            ? "border-[#7a4f2e] bg-[#f5ede0] text-[#3d2c1e] shadow-md"
                            : "border-[#e8d5be] bg-white text-[#6b4c30] hover:border-[#c4a882]"
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-gray-200 inline-block"
                          style={{ backgroundColor: color.colorHex }}
                        />
                        {color.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Step 3: Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Your Details
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                So we can reach you about your order.
              </p>
              <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                    required
                  />
                </div>
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
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#3d2c1e]">
                        {f.imageEmoji} {f.name} × {quantities[f.id]}
                      </span>
                      <span className="text-[#7a4f2e] font-medium">
                        ${((quantities[f.id] ?? 0) * f.price).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {selectedWrapperObj && (
                <div className="flex items-center gap-2 text-sm text-[#6b4c30] mb-4 pb-4 border-b border-[#e8d5be]">
                  <span
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: selectedWrapperObj.colorHex }}
                  />
                  <span>{selectedWrapperObj.name} wrapper</span>
                </div>
              )}

              <div className="flex justify-between items-center mb-2">
                <span className="text-[#6b4c30] text-sm">
                  {totalStems} stem{totalStems !== 1 ? "s" : ""}
                </span>
                <span className="text-2xl font-bold text-[#3d2c1e]">
                  ${totalPrice.toFixed(2)}
                </span>
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
                We&apos;ll confirm your order by email
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
