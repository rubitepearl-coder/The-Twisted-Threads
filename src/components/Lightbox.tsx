"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

export type LightboxImage = {
  src: string;
  alt: string;
};

function LightboxModal({ 
  images, 
  isOpen, 
  currentIndex, 
  onClose, 
  onPrev, 
  onNext 
}: { 
  images: LightboxImage[]; 
  isOpen: boolean; 
  currentIndex: number; 
  onClose: () => void; 
  onPrev?: () => void; 
  onNext?: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50" onClick={onClose}>×</button>
      {images.length > 1 && (
        <>
          <button className="absolute left-4 text-white text-6xl hover:text-gray-300 z-50" onClick={(e) => { e.stopPropagation(); onPrev?.(); }}>‹</button>
          <button className="absolute right-4 text-white text-6xl hover:text-gray-300 z-50" onClick={(e) => { e.stopPropagation(); onNext?.(); }}>›</button>
        </>
      )}
      <div className="max-w-[95vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <Image src={images[currentIndex]?.src || ''} alt={images[currentIndex]?.alt || ''} width={1000} height={1000} className="max-w-[95vw] max-h-[90vh] object-contain" unoptimized priority />
      </div>
      {images.length > 1 && <div className="absolute bottom-4 text-white">{currentIndex + 1} / {images.length}</div>}
    </div>
  );
}

export function useImageLightbox(images: LightboxImage[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    if (images.length > 0) {
      setCurrentIndex(Math.min(index, images.length - 1));
      setIsOpen(true);
    }
  }, [images.length]);

  const closeLightbox = useCallback(() => setIsOpen(false), []);
  const prevImage = useCallback(() => setCurrentIndex(i => i > 0 ? i - 1 : images.length - 1), [images.length]);
  const nextImage = useCallback(() => setCurrentIndex(i => i < images.length - 1 ? i + 1 : 0), [images.length]);

  return {
    isOpen,
    currentIndex,
    openLightbox,
    closeLightbox,
    prevImage,
    nextImage,
    LightboxComponent: () => (
      <LightboxModal
        images={images}
        isOpen={isOpen}
        currentIndex={currentIndex}
        onClose={closeLightbox}
        onPrev={images.length > 1 ? prevImage : undefined}
        onNext={images.length > 1 ? nextImage : undefined}
      />
    )
  };
}

export default function Lightbox({ images }: { images: LightboxImage[] }) {
  const { isOpen, currentIndex, openLightbox, closeLightbox, prevImage, nextImage, LightboxComponent } = useImageLightbox(images);
  return (
    <>
      {images.map((img, idx) => (
        <button key={idx} onClick={() => openLightbox(idx)} className="cursor-pointer">
          Click image {idx}
        </button>
      ))}
      <LightboxComponent />
    </>
  );
}