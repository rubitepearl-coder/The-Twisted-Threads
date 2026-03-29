"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type OrderItem = {
  productId?: number;
  name: string;
  quantity: number;
  price: number;
  imageEmoji?: string;
  imageUrl?: string;
};

const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

function LightboxGallery({ images, children, title }: { images: { src: string; alt: string }[]; children: (open: (index: number) => void) => React.ReactNode; title?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeLightbox = () => setIsOpen(false);
  const prevImage = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  const nextImage = () => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));

  return (
    <>
      {children(openLightbox)}
      {isOpen && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center" onClick={closeLightbox}>
          <button className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300" onClick={closeLightbox}>×</button>
          {images.length > 1 && (
            <>
              <button className="absolute left-4 text-white text-6xl hover:text-gray-300" onClick={(e) => { e.stopPropagation(); prevImage(); }}>‹</button>
              <button className="absolute right-4 text-white text-6xl hover:text-gray-300" onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button>
            </>
          )}
          <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Image src={images[currentIndex].src} alt={images[currentIndex].alt} width={800} height={800} className="max-w-[90vw] max-h-[80vh] object-contain" unoptimized />
          </div>
          {images.length > 1 && <div className="absolute bottom-4 text-white">{currentIndex + 1} / {images.length}</div>}
          {title && <div className="absolute top-4 left-4 text-white text-lg">{title}</div>}
        </div>
      )}
    </>
  );
}

export default function OrderConfirmationClient({
  order, bouquetItems, miniPotItems, shopItems
}: {
  order: any;
  bouquetItems: OrderItem[];
  miniPotItems: OrderItem[];
  shopItems: OrderItem[];
}) {
  const isBouquetOrder = order.orderType === "bouquet";
  const isMiniPotOrder = order.orderType === "mini_pot";
  const isShopOrder = order.orderType === "shop";

  // Collect all images for lightbox
  const allImages: { src: string; alt: string }[] = [];
  
  if (isMiniPotOrder && order.potImageUrl) allImages.push({ src: order.potImageUrl, alt: order.potName || "Pot" });
  miniPotItems.forEach(item => { if (isValidImageUrl(item.imageUrl)) allImages.push({ src: item.imageUrl!, alt: item.name }); });
  bouquetItems.forEach(item => { if (isValidImageUrl(item.imageUrl)) allImages.push({ src: item.imageUrl!, alt: item.name }); });
  shopItems.forEach(item => { if (isValidImageUrl(item.imageUrl)) allImages.push({ src: item.imageUrl!, alt: item.name }); });
  if (order.wrapperColorImageUrl) allImages.push({ src: order.wrapperColorImageUrl, alt: order.wrapperColorName || "Wrapper" });

  const openImage = (index: number) => {
    if (allImages.length === 0) return;
    const modal = document.getElementById('lightbox-modal') as HTMLDialogElement;
    if (modal) {
      (modal as any).currentIndex = index;
      modal.showModal();
    }
  };

  const renderItemImage = (item: OrderItem, idx: number, onClick?: () => void) => (
    <div key={idx} className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be] bg-[#f5ede0]" onClick={onClick}>
      {isValidImageUrl(item.imageUrl) ? (
        <Image src={item.imageUrl!} alt={item.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl">{item.imageEmoji ?? "🌸"}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="text-[#7a4f2e] hover:underline mb-6 inline-block">← Back to Home</Link>
        
        <h1 className="text-3xl font-bold text-[#3d2c1e] mb-2">Order Confirmed! 🎉</h1>
        <p className="text-[#6b4c30] mb-8">Thank you for your order. We&apos;ll contact you on Facebook Messenger when it&apos;s ready!</p>

        <div className="bg-white rounded-2xl border border-[#e8d5be] p-6 mb-6">
          <h2 className="text-xl font-bold text-[#3d2c1e] mb-4">Order #{order.id}</h2>
          <p className="text-sm text-[#a07850] mb-6">
            {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>

          {isMiniPotOrder && order.potName && (
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[#e8d5be]">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be] bg-[#f5ede0]" onClick={() => allImages.length > 0 && openImage(0)}>
                {order.potImageUrl ? (
                  <Image src={order.potImageUrl} alt={order.potName} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🪴</div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#3d2c1e]">{order.potName}</p>
                <p className="text-sm text-[#a07850]">Mini Pot</p>
              </div>
            </div>
          )}

          {isMiniPotOrder && miniPotItems.length > 0 && (
            <div className="space-y-3 mb-4">
              {miniPotItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {renderItemImage(item, i, allImages.length > 0 ? () => openImage(i + (order.potImageUrl ? 1 : 0)) : undefined)}
                  <div className="flex-1">
                    <p className="font-medium text-[#3d2c1e]">{item.name}</p>
                    <p className="text-xs text-[#a07850]">Quantity: {item.quantity}</p>
                  </div>
                  <p className="text-[#3d2c1e] font-medium">₱{item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {isBouquetOrder && (
            <div className="space-y-3 mb-4">
              {bouquetItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {renderItemImage(item, i, allImages.length > 0 ? () => openImage(i) : undefined)}
                  <div className="flex-1">
                    <p className="font-medium text-[#3d2c1e]">{item.name}</p>
                    <p className="text-xs text-[#a07850]">Quantity: {item.quantity}</p>
                  </div>
                  <p className="text-[#3d2c1e] font-medium">₱{item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {isBouquetOrder && order.wrapperColorName && (
            <div className="flex items-center gap-3 py-3 border-t border-[#e8d5be]">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#e8d5be]" onClick={() => allImages.length > 0 && openImage(allImages.length - 1)}>
                {order.wrapperColorImageUrl ? (
                  <Image src={order.wrapperColorImageUrl} alt={order.wrapperColorName} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl" style={{ backgroundColor: order.wrapperColorHex }} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#3d2c1e]">{order.wrapperColorName}</p>
                <p className="text-sm text-[#a07850]">Wrapper</p>
              </div>
            </div>
          )}

          {isShopOrder && shopItems.length > 0 && (
            <div className="space-y-3 mb-4">
              {shopItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {renderItemImage(item, i, allImages.length > 0 ? () => openImage(i) : undefined)}
                  <div className="flex-1">
                    <p className="font-medium text-[#3d2c1e]">{item.name}</p>
                    <p className="text-xs text-[#a07850]">Quantity: {item.quantity} × ₱{item.price.toFixed(2)}</p>
                  </div>
                  <p className="text-[#3d2c1e] font-medium">₱{(item.quantity * item.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#e8d5be]">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-[#6b4c30]">Subtotal</span>
              <span className="text-[#3d2c1e]">₱{order.totalPrice.toFixed(2)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-[#6b4c30]">Delivery Fee</span>
                <span className="text-[#3d2c1e]">₱{order.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-[#e8d5be]">
              <span className="text-[#3d2c1e]">Total</span>
              <span className="text-[#3d2c1e]">₱{(order.totalPrice + order.deliveryFee).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8d5be] p-6">
          <h3 className="font-bold text-[#3d2c1e] mb-3">Contact Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="text-[#a07850] w-20 flex-shrink-0">Name</span>
              <span className="text-[#3d2c1e]">{order.customerName}</span>
            </div>
            {order.facebookName && (
              <div className="flex gap-3">
                <span className="text-[#a07850] w-20 flex-shrink-0">Facebook</span>
                <span className="text-[#3d2c1e]">{order.facebookName}</span>
              </div>
            )}
            {order.deliveryType === "home" && order.customerAddress && (
              <div className="flex gap-3">
                <span className="text-[#a07850] w-20 flex-shrink-0">Address</span>
                <span className="text-[#3d2c1e] whitespace-pre-line">[Delivery address on file]</span>
              </div>
            )}
          </div>
          {order.deliveryType === "pickup" && (
            <p className="text-[#6b4c30] text-sm mt-4">📍 Your order will be available for pickup. We&apos;ll contact you when it&apos;s ready!</p>
          )}
        </div>

        {/* Lightbox Modal */}
        <dialog id="lightbox-modal" className="modal">
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
            <form method="dialog">
              <button className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300">×</button>
            </form>
            {allImages.length > 1 && (
              <>
                <button className="absolute left-4 text-white text-6xl hover:text-gray-300" onClick={() => { const m = document.getElementById('lightbox-modal') as any; m.currentIndex = (m.currentIndex || 0) - 1; m.querySelector('img')?.setAttribute('src', allImages[m.currentIndex].src); }}>‹</button>
                <button className="absolute right-4 text-white text-6xl hover:text-gray-300" onClick={() => { const m = document.getElementById('lightbox-modal') as any; m.currentIndex = ((m.currentIndex || 0) + 1) % allImages.length; m.querySelector('img')?.setAttribute('src', allImages[m.currentIndex].src); }}>›</button>
              </>
            )}
            <img id="lightbox-img" src={allImages[0]?.src} alt="Preview" className="max-w-[90vw] max-h-[80vh] object-contain" />
          </div>
        </dialog>
      </div>
    </div>
  );
}
