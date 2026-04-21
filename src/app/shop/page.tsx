"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useImageLightbox, LightboxImage } from "@/components/Lightbox";

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  subcategory: string | null;
  price: number;
  salePrice: number | null;
  stockQuantity: number | null;
  inStock: boolean;
  imageEmoji: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// Helper function to validate image URL
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

export default function ShopPage() {
  const [finishedGoods, setFinishedGoods] = useState<Product[]>([]);
  const [flowers, setFlowers] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  // Customer form state
  const [customerName, setCustomerName] = useState(""); // Full legal name
  const [facebookName, setFacebookName] = useState(""); // Facebook name for contact
  const [deliveryType, setDeliveryType] = useState<"pickup" | "home">("pickup");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [error, setError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [finalOrderTotal, setFinalOrderTotal] = useState(0);
  const [finalDeliveryFee, setFinalDeliveryFee] = useState(0);
  const [deliveryLocationsMap, setDeliveryLocationsMap] = useState<Record<string, number>>({});
  const [showOtherOption, setShowOtherOption] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const router = useRouter();

  // Fetch products on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const goods = await fetch("/api/products?category=finished_good").then(res => res.json());
        const flowersData = await fetch("/api/products?category=flower").then(res => res.json());
        setFinishedGoods(goods || []);
        setFlowers(flowersData || []);
      } catch (e) {
        console.error("Failed to fetch products:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();

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
  });

  const addToCart = (product: Product, showCartAfterAdd: boolean = false) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      // Only check stock if stockQuantity is explicitly set
      if (product.stockQuantity !== null && existing.quantity < product.stockQuantity) {
        setCart(cart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      // Only add to cart if stock is unlimited (NULL) or > 0
      if (product.stockQuantity === null || product.stockQuantity > 0) {
        setCart([...cart, { product, quantity: 1 }]);
      }
    }
    // Show cart after adding if requested
    if (showCartAfterAdd) {
      setShowCart(true);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty <= 0) return item;
        // Only check stock if stockQuantity is explicitly set
        if (item.product.stockQuantity !== null && newQty > item.product.stockQuantity) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const { openLightbox: openShopLightbox, LightboxComponent } = useImageLightbox();

  const handleCheckout = async () => {
    setError("");
    
    // Validation
    if (!customerName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!facebookName.trim()) {
      setError("Please enter your Facebook name for contact.");
      return;
    }
    if (deliveryType === "home" && !selectedLocation) {
      setError("Please enter your delivery location for home delivery.");
      return;
    }

    setOrdering(true);

    try {
      // Calculate delivery fee - ₱10 for home delivery
      const deliveryFee = deliveryType === "home" && selectedLocation && selectedLocation !== "_other" 
    ? deliveryLocationsMap[selectedLocation] ?? 10 
    : 0;

      // Create shop items array
      const shopItems = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.salePrice || item.product.price,
        imageUrl: item.product.imageUrl,
        imageEmoji: item.product.imageEmoji,
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          facebookName: facebookName.trim(),
          customerAddress: customerAddress.trim() || undefined,
          deliveryType,
          deliveryLocation: selectedLocation === "_other" ? undefined : selectedLocation,
          deliveryFee,
          orderType: "shop",
          shopItems: JSON.stringify(shopItems),
          totalPrice: cartTotal + deliveryFee,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to place order");
      }

      const data = await response.json();
      setOrderId(data.orderId);
      setFinalOrderTotal(cartTotal);
      setFinalDeliveryFee(deliveryFee);
      setOrderSuccess(true);
      setCart([]);
    } catch (err: any) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <div className="text-[#7a4f2e] text-xl">Loading products...</div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-[#d4b896]">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-[#3d2c1e] mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-[#6b4c30] mb-2">
            Thank you for your order, <strong>{customerName}</strong>!
          </p>
          <p className="text-[#6b4c30] mb-4">
            Order ID: <span className="font-bold">#{orderId}</span>
          </p>
           {deliveryType === "home" ? (
             <p className="text-[#6b4c30] mb-4">
               Your order will be delivered to: <strong>{selectedLocation}</strong>
             </p>
           ) : (
             <p className="text-[#6b4c30] mb-4">
               Your order will be available for pickup!
             </p>
           )}

           {/* Receipt Section */}
           <div className="bg-[#f5ede0] rounded-lg p-4 mb-6 border border-[#e8d5be]">
             <h3 className="font-semibold text-[#3d2c1e] mb-3 text-center">Order Receipt</h3>
             <div className="space-y-2 text-sm">
               <div className="flex justify-between">
                 <span className="text-[#6b4c30]">Order Total:</span>
                 <span className="font-medium text-[#3d2c1e]">₱{finalOrderTotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-[#6b4c30]">Delivery Fee:</span>
                 <span className="font-medium text-[#3d2c1e]">₱{finalDeliveryFee.toFixed(2)}</span>
               </div>
               <hr className="border-[#e8d5be] my-2" />
               <div className="flex justify-between font-bold text-base">
                 <span className="text-[#3d2c1e]">Total Payment:</span>
                 <span className="text-[#3d2c1e]">₱{(finalOrderTotal + finalDeliveryFee).toFixed(2)}</span>
               </div>
             </div>
           </div>

           <Link
             href="/"
             className="inline-block bg-[#7a4f2e] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
           >
           Back to Home
           </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#faf7f2]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#f5ede0] to-[#ede0d0] py-12 px-4 text-center border-b border-[#d4b896]">
        <div className="text-5xl mb-4">🛍️</div>
        <h1 className="text-4xl font-bold text-[#3d2c1e] mb-3">
          The Twisted Threads Shop
        </h1>
        <p className="text-[#6b4c30] text-lg max-w-xl mx-auto">
          Browse our handcrafted flowers — from individual yarn and fuzzy wire stems to
          finished bouquets and more.
        </p>
        {cart.length > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className="mt-4 bg-[#7a4f2e] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
          >
            🛒 View Cart ({cart.length} items - ₱{cartTotal.toFixed(2)})
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {(finishedGoods.length === 0 && flowers.length === 0) ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-2xl font-bold text-[#3d2c1e] mb-3">
              Shop Coming Soon!
            </h2>
            <p className="text-[#6b4c30] mb-6">
              Our catalog is being lovingly prepared. In the meantime, build
              your own custom bouquet!
            </p>
            <Link
              href="/bouquet-builder"
              className="bg-[#7a4f2e] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
            >
              Build a Bouquet
            </Link>
          </div>
        ) : (
          <>
            {/* Finished Goods */}
            {finishedGoods.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-[#3d2c1e] mb-6 flex items-center gap-2">
                  🎁 Ready-Made Goods
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finishedGoods.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={() => addToCart(product, true)}
                      onImageClick={() => openShopLightbox(product.imageUrl as string, product.name)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Individual Flowers */}
            {flowers.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-[#3d2c1e] mb-2 flex items-center gap-2">
                  🌸 Individual Flowers
                </h2>
                <p className="text-[#6b4c30] text-sm mb-6">
                  Want to mix and match? Choose from yarn (crochet) and fuzzy wire stems.{" "}
                  <Link
                    href="/bouquet-builder"
                    className="text-[#7a4f2e] underline hover:text-[#5c3a1e]"
                  >
                    Build a custom bouquet →
                  </Link>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {flowers.map((flower) => (
                    <div
                      key={flower.id}
                      className="bg-white rounded-2xl overflow-hidden border border-[#e8d5be] hover:shadow-md transition-shadow flex flex-col"
                    >
                      {/* Square image */}
                      <div className="aspect-square w-full overflow-hidden bg-[#f5ede0]">
                        {isValidImageUrl(flower.imageUrl) && !imageErrors[flower.id] ? (
                          <Image
                            src={flower.imageUrl!}
                            alt={flower.name}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover"
                            unoptimized
                            onError={() => setImageErrors(prev => ({ ...prev, [flower.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">
                            {flower.imageEmoji}
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center flex-1 flex flex-col">
                        <h3 className="font-semibold text-[#3d2c1e] mb-1 text-sm">
                          {flower.name}
                        </h3>
                        {flower.description && (
                          <p className="text-xs text-[#a07850] mb-2 line-clamp-2">
                            {flower.description}
                          </p>
                        )}
                        <p className="text-[#7a4f2e] font-bold text-sm">
                          {flower.salePrice ? (
                            <span>
                              <span className="text-green-600">₱{flower.salePrice.toFixed(2)}</span>
                              <span className="text-xs font-normal text-[#a07850] line-through ml-1">
                                ₱{flower.price.toFixed(2)}
                              </span>
                            </span>
                          ) : (
                            <span>₱{flower.price.toFixed(2)}</span>
                          )}
                          <span className="text-xs font-normal text-[#a07850]">
                            {" "}
                            / flower
                          </span>
                        </p>
                        {flower.stockQuantity !== null && flower.stockQuantity === 0 ? (
                          <span className="inline-block mt-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            Sold Out
                          </span>
                        ) : flower.stockQuantity !== null && flower.stockQuantity <= 5 ? (
                          <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Only {flower.stockQuantity} left!
                          </span>
                        ) : (
                          <button
                            onClick={() => addToCart(flower, true)}
                            className="mt-2 bg-[#7a4f2e] text-white text-xs py-1.5 px-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
                          >
                            Add to Cart 🛒
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <div className="bg-[#f5ede0] rounded-3xl p-8 text-center border border-[#d4b896]">
              <div className="text-4xl mb-3">🌺</div>
              <h3 className="text-2xl font-bold text-[#3d2c1e] mb-2">
                Want Something Custom?
              </h3>
              <p className="text-[#6b4c30] mb-5">
                Design your own bouquet with exactly the flowers you love.
              </p>
              <Link
                href="/bouquet-builder"
                className="bg-[#7a4f2e] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
              >
                Build Your Bouquet
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#3d2c1e]">Your Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-[#6b4c30] hover:text-[#3d2c1e] text-2xl"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-[#6b4c30] text-center py-8">Your cart is empty.</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4 bg-[#faf7f2] p-3 rounded-xl">
                        <div className="w-16 h-16 bg-[#f5ede0] rounded-lg overflow-hidden flex-shrink-0">
                          {isValidImageUrl(item.product.imageUrl) && !imageErrors[item.product.id] ? (
                            <Image
                              src={item.product.imageUrl!}
                              alt={item.product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                              onError={() => setImageErrors(prev => ({ ...prev, [item.product.id]: true }))}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {item.product.imageEmoji}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#3d2c1e]">{item.product.name}</h3>
                          <p className="text-[#7a4f2e] font-bold">
                            ₱{((item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-8 h-8 rounded-full bg-[#e8d5be] text-[#3d2c1e] hover:bg-[#d4b896] transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-semibold text-[#3d2c1e]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-8 h-8 rounded-full bg-[#e8d5be] text-[#3d2c1e] hover:bg-[#d4b896] transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#d4b896] pt-4 mb-6">
                    <div className="flex justify-between items-center text-xl font-bold text-[#3d2c1e]">
                      <span>Total:</span>
                      <span>₱{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowCart(false);
                      setIsCheckingOut(true);
                    }}
                    className="w-full bg-[#7a4f2e] text-white py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors mb-3"
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={() => setShowCart(false)}
                    className="w-full bg-[#e8d5be] text-[#3d2c1e] py-3 rounded-full font-semibold hover:bg-[#d4b896] transition-colors"
                  >
                    Add More Items 🛒
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#3d2c1e]">Checkout</h2>
                <button
                  onClick={() => setIsCheckingOut(false)}
                  className="text-[#6b4c30] hover:text-[#3d2c1e] text-2xl"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[#3d2c1e] font-medium mb-1">
                    Full Name <span className="text-red-500">*</span> <span className="text-xs text-[#a07850]">(for shipping records)</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 border border-[#d4b896] rounded-lg focus:outline-none focus:border-[#7a4f2e]"
                    placeholder="e.g., Juan dela Cruz"
                  />
                </div>

                <div>
                  <label className="block text-[#3d2c1e] font-medium mb-1">
                    Facebook Name <span className="text-red-500">*</span> <span className="text-xs text-[#a07850]">(for contact via Messenger)</span>
                  </label>
                  <input
                    type="text"
                    value={facebookName}
                    onChange={(e) => setFacebookName(e.target.value)}
                    className="w-full px-4 py-2 border border-[#d4b896] rounded-lg focus:outline-none focus:border-[#7a4f2e]"
                    placeholder="e.g., pearl.rubite"
                  />
                </div>
                <div>
                  <label className="block text-[#3d2c1e] font-medium mb-2">
                    Delivery Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryType"
                        checked={deliveryType === "pickup"}
                        onChange={() => setDeliveryType("pickup")}
                        className="w-4 h-4 text-[#7a4f2e]"
                      />
                      <span className="text-[#3d2c1e]">Pickup</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryType"
                        checked={deliveryType === "home"}
                        onChange={() => setDeliveryType("home")}
                        className="w-4 h-4 text-[#7a4f2e]"
                      />
                      <span className="text-[#3d2c1e]">Home Delivery</span>
                    </label>
                  </div>
                </div>

                {deliveryType === "home" && (
                  <div>
                    <label className="block text-[#3d2c1e] font-medium mb-1">
                      Delivery Location <span className="text-red-500">*</span>
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
                      className="w-full px-4 py-2 border border-[#d4b896] rounded-lg focus:outline-none focus:border-[#7a4f2e]"
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

                {deliveryType === "pickup" && (
                  <div>
                    <label className="block text-[#3d2c1e] font-medium mb-1">
                      Your Address <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-[#d4b896] rounded-lg focus:outline-none focus:border-[#7a4f2e]"
                      placeholder="Your address for reference"
                    />
                  </div>
                )}

                <div className="bg-[#faf7f2] p-4 rounded-xl">
                  <h3 className="font-semibold text-[#3d2c1e] mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between">
                        <span className="text-[#6b4c30]">
                          {item.product.name} x{item.quantity}
                        </span>
                        <span className="text-[#3d2c1e] font-medium">
                          ₱{((item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-[#d4b896] pt-2 mt-2 flex justify-between font-bold">
                      <span className="text-[#3d2c1e]">Total</span>
                      <span className="text-[#7a4f2e]">₱{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={ordering}
                  className="w-full bg-[#7a4f2e] text-white py-3 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors disabled:opacity-50"
                >
                  {ordering ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    <LightboxComponent />
  </>
  );
}

function ProductCard({
  product,
  onAddToCart,
  showCartAfterAdd = false,
  onImageClick,
}: {
  product: Product;
  onAddToCart: () => void;
  showCartAfterAdd?: boolean;
  onImageClick?: () => void;
}) {
  const isAvailable = product.stockQuantity === null || product.stockQuantity > 0;
  const [imageError, setImageError] = useState(false);

  // Check if imageUrl is valid (non-empty string starting with http)
  const hasValidImage = product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http');

  return (
    <div className="bg-white rounded-2xl border border-[#e8d5be] overflow-hidden hover:shadow-lg transition-shadow">
      {/* Square image */}
      <div className="aspect-square w-full overflow-hidden bg-[#f5ede0]" onClick={onImageClick}>
        {hasValidImage && !imageError ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={400}
            className="w-full h-full object-cover"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">
            {product.imageEmoji}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-[#3d2c1e] text-lg mb-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-[#6b4c30] mb-3">{product.description}</p>
        )}
        <div className="flex items-center justify-between mb-3">
          {product.salePrice ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-green-600">
                ₱{product.salePrice.toFixed(2)}
              </span>
              <span className="text-sm text-[#a07850] line-through">
                ₱{product.price.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-[#7a4f2e]">
              ₱{product.price.toFixed(2)}
            </span>
          )}
          {isAvailable ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              In Stock
            </span>
          ) : (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
              Sold Out
            </span>
          )}
        </div>
        {isAvailable ? (
          <button
            onClick={onAddToCart}
            className="w-full bg-[#7a4f2e] text-white py-2 rounded-full font-semibold hover:bg-[#5c3a1e] transition-colors"
          >
            Add to Cart 🛒
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-2 rounded-full font-semibold cursor-not-allowed"
          >
            Sold Out
          </button>
        )}
      </div>
    </div>
  );
}
