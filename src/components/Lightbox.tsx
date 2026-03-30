"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export type LightboxImage = {
  src: string;
  alt: string;
};

export function useSingleImageLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const openLightbox = (src: string, alt: string = '') => {
    setImageSrc(src);
    setImageAlt(alt);
    setIsOpen(true);
  };

  const closeLightbox = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const LightboxComponent = () => {
    if (!isOpen || !imageSrc) return null;
    
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" 
        onClick={closeLightbox}
      >
        <button 
          className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50 w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10"
          onClick={closeLightbox}
        >
          ×
        </button>
        <div 
          className="max-w-[95vw] max-h-[90vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Image 
            src={imageSrc} 
            alt={imageAlt} 
            width={1000} 
            height={1000} 
            className="max-w-[95vw] max-h-[90vh] object-contain" 
            unoptimized 
            priority 
          />
        </div>
      </div>
    );
  };

  return {
    isOpen,
    openLightbox,
    closeLightbox,
    LightboxComponent
  };
}

export function useImageLightbox(_images?: LightboxImage[]) {
  return useSingleImageLightbox();
}