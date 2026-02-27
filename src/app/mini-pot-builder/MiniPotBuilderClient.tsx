"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  price: number;
  salePrice: number | null;
  stockQuantity: number;
  inStock: boolean;
  imageEmoji: string;
  imageUrl: string | null;
  description: string;
};

type Props = {
  pots: Product[];
  fuzzyFlowers: Product[];
};

export default function MiniPotBuilderClient({ pots, fuzzyFlowers }: Props) {
  const router = useRouter();
  const [selectedPot, setSelectedPot] = useState<number | null>(
    pots.find((p) => p.inStock && p.stockQuantity > 0)?.id ?? null
  );
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availablePots = pots.filter((p) => p.inStock && p.stockQuantity > 0);
  const availableFlowers = fuzzyFlowers.filter(
    (f) => f.inStock && f.stockQuantity > 0
  );

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const totalFlowers = Object.values(quantities).reduce((a, b) => a + b, 0);

  // Calculate total price: pot price + sum of (flower price * quantity)
  const potPrice = selectedPot
    ? pots.find((p) => p.id === selectedPot)?.salePrice ??
      pots.find((p) => p.id === selectedPot)?.price ??
      0
    : 0;

  const flowersPrice = fuzzyFlowers.reduce((sum, flower) => {
    const effectivePrice = flower.salePrice ?? flower.price;
    return sum + (quantities[flower.id] ?? 0) * effectivePrice;
  }, 0);

  const totalPrice = potPrice + flowersPrice;

  const selectedItems = fuzzyFlowers.filter(
    (f) => (quantities[f.id] ?? 0) > 0
  );
  const selectedPotObj = pots.find((p) => p.id === selectedPot);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPot) {
      setError("Please select a mini pot.");
      return;
    }
    if (totalFlowers === 0) {
      setError("Please add at least one fuzzy wire flower to your pot.");
      return;
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    if (!customerAddress.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const miniPotItems = selectedItems.map((f) => ({
        productId: f.id,
        name: f.name,
        quantity: quantities[f.id],
        price: f.salePrice ?? f.price,
        imageEmoji: f.imageEmoji,
        imageUrl: f.imageUrl ?? "",
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerAddress: customerAddress.trim(),
          orderType: "mini_pot",
          miniPotItems,
          potId: selectedPot,
          potName: selectedPotObj?.name,
          potImageUrl: selectedPotObj?.imageUrl ?? "",
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

  if (pots.length === 0 && fuzzyFlowers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🪴</div>
        <h2 className="text-2xl font-bold text-[#3d2c1e] mb-3">
          Coming Soon!
        </h2>
        <p className="text-[#6b4c30]">
          Our mini pot collection is being set up. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Product Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Pot Selection */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Choose Your Mini Pot
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                Pick the perfect pot for your fuzzy wire flowers.
              </p>

              {availablePots.length === 0 ? (
                <p className="text-[#a07850] ml-10">
                  No pots available right now.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 ml-10">
                  {availablePots.map((pot) => (
                    <button
                      key={pot.id}
                      type="button"
                      onClick={() => setSelectedPot(pot.id)}
                      className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                        selectedPot === pot.id
                          ? "border-[#7a4f2e] shadow-md"
                          : "border-[#e8d5be] hover:border-[#c4a882]"
                      }`}
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 border border-[#e8d5be]">
                        {pot.imageUrl ? (
                          <Image
                            src={pot.imageUrl}
                            alt={pot.name}
                            width={120}
                            height={120}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {pot.imageEmoji}
                          </div>
                        )}
                      </div>
                      <p className="font-semibold text-[#3d2c1e] text-sm">
                        {pot.name}
                      </p>
                      <p className="text-[#7a4f2e] text-sm font-medium">
                        {pot.salePrice ? (
                          <>
                            <span className="line-through text-[#a07850] text-xs">
                              ₱{pot.price.toFixed(2)}
                            </span>{" "}
                            ₱{pot.salePrice.toFixed(2)}
                          </>
                        ) : (
                          `₱${pot.price.toFixed(2)}`
                        )}
                      </p>
                      {pot.stockQuantity <= 5 && pot.stockQuantity > 0 && (
                        <p className="text-xs text-orange-600">
                          Only {pot.stockQuantity} left!
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Fuzzy Wire Flower Selection */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Plant Your Flowers
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                Choose how many of each fuzzy wire flower to add to your pot.
              </p>

              {availableFlowers.length === 0 ? (
                <p className="text-[#a07850] ml-10">
                  No fuzzy wire flowers available right now.
                </p>
              ) : (
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
                          {/* Square image or emoji fallback */}
                          {flower.imageUrl ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be]">
                              <Image
                                src={flower.imageUrl}
                                alt={flower.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <span className="text-4xl flex-shrink-0">
                              {flower.imageEmoji}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#3d2c1e]">
                              {flower.name}
                            </p>
                            <p className="text-[#7a4f2e] text-sm font-medium">
                              {flower.salePrice ? (
                                <>
                                  <span className="line-through text-[#a07850] text-xs">
                                    ₱{flower.price.toFixed(2)}
                                  </span>{" "}
                                  ₱{flower.salePrice.toFixed(2)}
                                </>
                              ) : (
                                `₱${flower.price.toFixed(2)}`
                              )}{" "}
                              / flower
                            </p>
                            {flower.stockQuantity <= 5 &&
                              flower.stockQuantity > 0 && (
                                <p className="text-xs text-orange-600">
                                  Only {flower.stockQuantity} left!
                                </p>
                              )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
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
                So we know where to send your mini pot.
              </p>
              <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Your Name *
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
                    Email Address *
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
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="123 Main St, Apt 4B&#10;Springfield, IL 62701"
                    rows={3}
                    className="w-full border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent resize-none"
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
                🪴 Your Mini Pot
              </h3>

              {selectedPotObj ? (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e8d5be]">
                  {selectedPotObj.imageUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#e8d5be] flex-shrink-0">
                      <Image
                        src={selectedPotObj.imageUrl}
                        alt={selectedPotObj.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="text-3xl flex-shrink-0">
                      {selectedPotObj.imageEmoji}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-[#3d2c1e]">
                      {selectedPotObj.name}
                    </p>
                    <p className="text-[#7a4f2e] text-sm">
                      {selectedPotObj.salePrice ? (
                        <>
                          <span className="line-through text-[#a07850]">
                            ₱{selectedPotObj.price.toFixed(2)}
                          </span>{" "}
                          ₱{selectedPotObj.salePrice.toFixed(2)}
                        </>
                      ) : (
                        `₱${selectedPotObj.price.toFixed(2)}`
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[#a07850] text-sm italic mb-4">
                  No pot selected yet...
                </p>
              )}

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
                        {f.imageUrl ? (
                          <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={f.imageUrl}
                              alt={f.name}
                              width={24}
                              height={24}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <span>{f.imageEmoji}</span>
                        )}
                        {f.name} × {quantities[f.id]}
                      </span>
                      <span className="text-[#7a4f2e] font-medium flex-shrink-0">
                        ₱
                        {(
                          (f.salePrice ?? f.price) * quantities[f.id]
                        ).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-between items-center mb-2">
                <span className="text-[#6b4c30] text-sm">
                  {totalFlowers} flower{totalFlowers !== 1 ? "s" : ""}
                </span>
                <span className="text-2xl font-bold text-[#3d2c1e]">
                  ₱{totalPrice.toFixed(2)}
                </span>
              </div>

              {error && (
                <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-lg p-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedPot || totalFlowers === 0}
                className="w-full bg-[#7a4f2e] text-white py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? "Placing Order..." : "Place Order 🪴"}
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
