"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useImageLightbox, LightboxImage } from "@/components/Lightbox";

type Product = {
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

type Addon = {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
  stockQuantity: number | null;
};

type Props = {
  pots: Product[];
  fuzzyFlowers: Product[];
  addons: Addon[];
};

export default function MiniPotBuilderClient({ pots, fuzzyFlowers, addons }: Props) {
  const router = useRouter();
  const [selectedPot, setSelectedPot] = useState<number | null>(
    pots.find((p) => p.stockQuantity === null || p.stockQuantity > 0)?.id ?? null
  );
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState(""); // Full legal name
  const [facebookName, setFacebookName] = useState(""); // Facebook name for contact
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "pickup">("home");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [deliveryLocationsMap, setDeliveryLocationsMap] = useState<Record<string, number>>({});
  const [showOtherOption, setShowOtherOption] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Helper function to validate image URL
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Handle image load error
  const handleImageError = (key: string) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  // Fetch delivery locations from database
  useEffect(() => {
    async function fetchDeliveryLocations() {
      try {
        const res = await fetch("/api/delivery-settings");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, number> = {};
          data.forEach((loc: { locationName: string; deliveryFee: number; inStock: boolean }) => {
            if (loc.locationName === "__OTHER__") {
              setShowOtherOption(true); // Always show "Other (Not Listed)" option
            } else if (loc.inStock) {
              map[loc.locationName] = loc.deliveryFee;
            }
          });
          setDeliveryLocationsMap(map);
        }
      } catch (e) {
        console.error("Failed to fetch delivery locations:", e);
      } finally {
        setLoadingLocations(false);
      }
    }
    fetchDeliveryLocations();
  }, []);

  const availablePots = pots;
  const availableFlowers = fuzzyFlowers;

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      const flower = fuzzyFlowers.find(f => f.id === id);
      const maxStock = flower?.stockQuantity ?? 999;
      const next = Math.max(0, Math.min(current + delta, maxStock));
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

  const selectedAddonItems = addons.filter(a => selectedAddons.includes(a.id));
  const addonPrice = selectedAddonItems.reduce((sum, a) => sum + a.price, 0);

  const totalPrice = potPrice + flowersPrice + addonPrice;

  // Calculate delivery fee:
  // - ₱10 for home delivery
  // - FREE for pickup
  const deliveryFee = deliveryType === "home" && selectedLocation && selectedLocation !== "_other" 
    ? deliveryLocationsMap[selectedLocation] ?? 10 
    : 0;

  const finalTotal = totalPrice + deliveryFee;

  const selectedItems = fuzzyFlowers.filter(
    (f) => (quantities[f.id] ?? 0) > 0
  );
  const selectedPotObj = pots.find((p) => p.id === selectedPot);

  const { openLightbox, LightboxComponent } = useImageLightbox();
  
  const openFlowerLightbox = (flowerId: number) => {
    const flower = fuzzyFlowers.find(f => f.id === flowerId && f.imageUrl);
    if (flower) openLightbox(flower.imageUrl as string, flower.name);
  };
  
  const openPotLightbox = (potId: number) => {
    const pot = pots.find(p => p.id === potId && p.imageUrl);
    if (pot) openLightbox(pot.imageUrl as string, pot.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPot) {
      setError("Please select a mini pot.");
      return;
    }
    if (totalFlowers === 0) {
      setError("Please select at least one flower for your pot.");
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
    if (deliveryType === "home" && !selectedLocation) {
      setError("Please select a delivery location.");
      return;
    }

    // Check stock availability - only if stockQuantity is explicitly set
    if (selectedPotObj && selectedPotObj.stockQuantity !== null && selectedPotObj.stockQuantity < 1) {
      setError(`Sorry, ${selectedPotObj.name} is out of stock.`);
      return;
    }
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
          facebookName: facebookName.trim(),
          customerAddress: customerAddress.trim() || undefined,
          deliveryType,
           deliveryLocation: selectedLocation === "_other" ? null : selectedLocation,
           deliveryFee,
           orderType: "mini_pot",
          miniPotItems,
          potId: selectedPot,
          potName: selectedPotObj?.name,
          potImageUrl: selectedPotObj?.imageUrl ?? "",
          potPrice: selectedPotObj?.price ?? 0,
          totalPrice: finalTotal,
          addonItems: selectedAddons.length > 0 ? JSON.stringify(selectedAddonItems) : null,
        }),
      });

      console.log("[MiniPotBuilder] Order submission data:", {
        customerName: customerName.trim(),
        facebookName: facebookName.trim(),
        deliveryType,
        deliveryLocation: selectedLocation === "_other" ? null : selectedLocation,
        orderType: "mini_pot",
        potId: selectedPot,
        potName: selectedPotObj?.name,
        potStock: selectedPotObj?.stockQuantity,
        miniPotItems: miniPotItems.length,
        totalPrice: finalTotal,
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("[MiniPotBuilder] Order failed response:", data);
        throw new Error(data.error || "Failed to place order");
      }

      const data = await res.json();
      window.location.href = `/order-confirmation?id=${data.orderId}`;
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
                Pick the perfect pot for your fuzzy wire flowers. Each flower is handcrafted with soft fuzzy wire.
              </p>

              {availablePots.length === 0 ? (
                <p className="text-[#a07850] ml-10">
                  No pots available right now.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 ml-10">
                  {availablePots.map((pot) => {
                    const isOutOfStock = pot.stockQuantity !== null && pot.stockQuantity <= 0;
                    return (
                      <button
                        key={pot.id}
                        type="button"
                        onClick={() => !isOutOfStock && setSelectedPot(pot.id)}
                        disabled={isOutOfStock}
                        className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                          selectedPot === pot.id
                            ? "border-[#7a4f2e] shadow-md"
                            : isOutOfStock
                            ? "border-gray-200 opacity-60 cursor-not-allowed"
                            : "border-[#e8d5be] hover:border-[#c4a882]"
                        }`}
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 border border-[#e8d5be]">
                          {isValidImageUrl(pot.imageUrl) && !imageErrors[`pot-${pot.id}`] ? (
                            <div className="w-full h-full cursor-pointer" onClick={() => openPotLightbox(pot.id)}>
                              <Image
                                src={pot.imageUrl!}
                                alt={pot.name}
                                width={120}
                                height={120}
                                className="w-full h-full object-cover"
                                unoptimized
                                onError={() => handleImageError(`pot-${pot.id}`)}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              {pot.imageEmoji}
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-[#3d2c1e] text-sm">
                          {pot.name}
                          {isOutOfStock && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Sold Out
                            </span>
                          )}
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
                        {pot.stockQuantity !== null && pot.stockQuantity <= 5 && pot.stockQuantity > 0 && (
                          <p className="text-xs text-orange-600">
                            Only {pot.stockQuantity} left!
                          </p>
                        )}
                      </button>
                    );
                  })}
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
                Choose how many fuzzy wire flowers to add to your pot. Each is handcrafted with fuzzy wire for a soft, realistic look.
              </p>

              {availableFlowers.length === 0 ? (
                <p className="text-[#a07850] ml-10">
                  No fuzzy wire flowers available right now.
                </p>
              ) : (
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
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be] cursor-pointer" onClick={() => openFlowerLightbox(flower.id)}>
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
                            <span className="text-4xl flex-shrink-0">
                              {flower.imageEmoji}
                            </span>
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
                             {flower.description && !isOutOfStock && (
                               <p className="text-xs text-[#a07850] mb-1 line-clamp-1">
                                 {flower.description}
                               </p>
                             )}
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
                            {flower.stockQuantity !== null && flower.stockQuantity <= 5 &&
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
              )}
            </div>

            {/* Step 3: Add-ons */}
            {addons.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  Add-ons
                </h2>
                <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                  Customize your mini pot with extras.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-10">
                  {addons.map((addon) => {
                    const isSelected = selectedAddons.includes(addon.id);
                    const isOutOfStock = addon.stockQuantity !== null && addon.stockQuantity <= 0;
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#7a4f2e] bg-[#f5ede0]"
                            : isOutOfStock
                            ? "border-gray-200 opacity-60 cursor-not-allowed"
                            : "border-[#e8d5be] hover:border-[#c4a882]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isOutOfStock}
                          onChange={(e) => {
                            if (!isOutOfStock) {
                              if (e.target.checked) {
                                setSelectedAddons(prev => [...prev, addon.id]);
                              } else {
                                setSelectedAddons(prev => prev.filter(id => id !== addon.id));
                              }
                            }
                          }}
                          className="w-4 h-4 text-[#7a4f2e] rounded flex-shrink-0"
                        />
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#f5ede0] flex-shrink-0">
                          {isValidImageUrl(addon.imageUrl) && !imageErrors[`addon-${addon.id}`] ? (
                            <Image
                              src={addon.imageUrl!}
                              alt={addon.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                              onError={() => handleImageError(`addon-${addon.id}`)}
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
                          <p className="font-medium text-[#3d2c1e]">{addon.name}</p>
                          {addon.description && (
                            <p className="text-xs text-[#6b4c30]">{addon.description}</p>
                          )}
                          {isOutOfStock && (
                            <span className="text-red-500 text-xs font-medium">Out of Stock</span>
                          )}
                        </div>
                        <span className="text-[#7a4f2e] font-medium">
                          +₱{addon.price.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Delivery Option */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {addons.length > 0 ? "4" : "3"}
                </span>
                Delivery Option
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                Choose how you want to receive your mini pot.
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
              
              {deliveryType === "home" && (
                <div className="ml-10 mt-4">
                  <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                    Delivery Location *
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedLocation(value);
                      if (value === "_other") {
                        setDeliveryType("pickup");
                      }
                    }}
                    className="w-full sm:w-80 border border-[#d4b896] rounded-xl px-4 py-2.5 text-[#3d2c1e] bg-white focus:outline-none focus:ring-2 focus:ring-[#7a4f2e] focus:border-transparent"
                    required={deliveryType === "home"}
                  >
                    <option value="">Select location...</option>
                    {Object.keys(deliveryLocationsMap)
                      .map((loc) => (
                        <option key={loc} value={loc}>
                          {loc} (₱{deliveryLocationsMap[loc]})
                        </option>
                      ))}
                    {showOtherOption && <option value="_other">Other (Not Listed)</option>}
                  </select>
                  {selectedLocation === "_other" && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        Home delivery is not available for that address. Please choose pickup.
                      </p>
                    </div>
                  )}
                  {selectedLocation && selectedLocation !== "_other" && (
                    <p className="text-xs text-[#a07850] mt-1">
                      Delivery fee: ₱{deliveryLocationsMap[selectedLocation]}
                      {deliveryLocationsMap[selectedLocation] === 0 && " (Free)"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 5: Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#7a4f2e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {addons.length > 0 ? (deliveryType === "home" ? "6" : "5") : (deliveryType === "home" ? "5" : "4")}
                </span>
                Your Details
              </h2>
              <p className="text-[#6b4c30] text-sm mb-5 ml-10">
                So we know where to send your mini pot.
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
                {deliveryType === "home" && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#3d2c1e] mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="123 Main St, Apt 4B&#10;[Barangay], [Municipality] 5700"
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
                🪴 Your Mini Pot
              </h3>

              {selectedPotObj ? (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#e8d5be]">
                  {isValidImageUrl(selectedPotObj.imageUrl) && !imageErrors[`summary-pot-${selectedPotObj.id}`] ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#e8d5be] flex-shrink-0">
                      <Image
                        src={selectedPotObj.imageUrl!}
                        alt={selectedPotObj.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                        onError={() => handleImageError(`summary-pot-${selectedPotObj.id}`)}
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
                        ₱
                        {(
                          (f.salePrice ?? f.price) * quantities[f.id]
                        ).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#6b4c30] text-sm">
                    {totalFlowers} fuzzy wire flower{totalFlowers !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[#3d2c1e]">
                    ₱{totalPrice.toFixed(2)}
                  </span>
                </div>
                
                {deliveryType === "home" && selectedLocation && selectedLocation !== "_other" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6b4c30]">
                      Delivery to {selectedLocation}
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
                disabled={submitting || !selectedPot || totalFlowers === 0}
                className="w-full bg-[#7a4f2e] text-white py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? "Placing Order..." : "Place Order 🪴"}
              </button>

              <p className="text-xs text-[#a07850] text-center mt-3">
                We will confirm your order via Facebook Messenger
              </p>
            </div>
          </div>
        </div>
      </form>
      {LightboxComponent()}
    </div>
  );
}
