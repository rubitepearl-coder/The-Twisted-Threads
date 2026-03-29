"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export type LightboxImage = {
  src: string;
  alt: string;
};

export function useLightbox(initialImages: LightboxImage[] = []) {
  const [images, setImages] = useState<LightboxImage[]>(initialImages);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const openLightbox = (index: number) => {
    if (images.length > 0) {
      setCurrentIndex(index);
      setIsOpen(true);
    }
  };

  const closeLightbox = () => setIsOpen(false);

  const prevImage = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return {
    images,
    isOpen,
    currentIndex,
    openLightbox,
    closeLightbox,
    prevImage,
    nextImage,
  };
}

export function LightboxModal({ 
  images, 
  isOpen, 
  currentIndex, 
  onClose, 
  onPrev, 
  onNext,
  title 
}: { 
  images: LightboxImage[]; 
  isOpen: boolean; 
  currentIndex: number; 
  onClose: () => void; 
  onPrev?: () => void; 
  onNext?: () => void;
  title?: string;
}) {
  if (!isOpen || images.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center cursor-pointer"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 cursor-pointer z-50"
        onClick={onClose}
      >
        ×
      </button>
      
      {images.length > 1 && onPrev && onNext && (
        <>
          <button 
            className="absolute left-4 text-white text-6xl hover:text-gray-300 cursor-pointer z-50"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
          >
            ‹
          </button>
          <button 
            className="absolute right-4 text-white text-6xl hover:text-gray-300 cursor-pointer z-50"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
          >
            ›
          </button>
        </>
      )}
      
      <div 
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          width={800}
          height={800}
          className="max-w-[90vw] max-h-[80vh] object-contain"
          unoptimized
        />
      </div>
      
      {images.length > 1 && (
        <div className="absolute bottom-4 text-white text-lg">
          {currentIndex + 1} / {images.length}
        </div>
      )}
      
      {title && (
        <div className="absolute top-4 left-4 text-white text-lg font-medium">
          {title}
        </div>
      )}
    </div>
  );
}

export function ClickableImage({ 
  src, 
  alt, 
  width = 80, 
  height = 80, 
  className = "",
  onClick,
  rounded = true,
}: { 
  src: string; 
  alt: string; 
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  rounded?: boolean;
}) {
  return (
    <div 
      className={`relative overflow-hidden cursor-pointer ${rounded ? 'rounded-xl' : ''} ${className}`}
      onClick={onClick}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover"
        unoptimized
      />
    </div>
  );
}
