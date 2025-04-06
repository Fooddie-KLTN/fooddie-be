"use client";

import { useState, useRef, useEffect, TouchEvent } from 'react';
import Image from 'next/image';

interface FoodImageProps {
  imageUrls: string[];
  name: string;
  status?: string;
  discountPercent?: number;
}

export default function FoodImage({ imageUrls, name, status, discountPercent }: FoodImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  // Use fallback image if imageUrls is empty
  const images = imageUrls && imageUrls.length > 0 
    ? imageUrls 
    : ['/placeholder-food.jpg']; // Replace with your default image

  // Auto-rotate images
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isTransitioning && !isDragging) {
        goToNext();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentIndex, images.length, isTransitioning, isDragging]);

  // Handle transitions
  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Touch handlers for mobile swiping with visual feedback
  const handleTouchStart = (e: TouchEvent) => {
    setIsDragging(true);
    setTouchStart(e.targetTouches[0].clientX);
    setTranslateX(0);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate drag distance as percentage of container width
    const containerWidth = slideRef.current?.offsetWidth || 1;
    const dragDistance = currentTouch - touchStart;
    const dragPercentage = (dragDistance / containerWidth) * 100;
    
    // Limit drag to reasonable amount (30% of width)
    const limitedDrag = Math.max(Math.min(dragPercentage, 30), -30);
    setTranslateX(limitedDrag);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (!touchStart || !touchEnd) {
      setTranslateX(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
    
    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
    setTranslateX(0);
  };

  return (
    <div className="relative rounded-xl overflow-hidden aspect-video md:aspect-square w-full group">
      {/* Main image container */}
      <div 
        className="relative w-full h-full bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        ref={slideRef}
      >
        {images.map((image, index) => (
          <div 
            key={index}
            style={{
              transform: index === currentIndex ? `translateX(${translateX}%)` : 'none'
            }}
            className={`absolute inset-0 transition-all duration-500 ${
              index === currentIndex 
                ? 'opacity-100 z-10' 
                : index === (currentIndex + 1) % images.length 
                  ? 'opacity-0 translate-x-full z-5' 
                  : index === (currentIndex - 1 + images.length) % images.length 
                    ? 'opacity-0 -translate-x-full z-5' 
                    : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={image}
              alt={`${name} - image ${index + 1}`}
              fill
              className="object-cover"
              onLoad={() => setIsLoading(false)}
              priority={index === currentIndex}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
        
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse z-20" />
        )}
      </div>

      {/* Navigation buttons with improved animation */}
      {images.length > 1 && (
        <>
          <button 
            onClick={goToPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white/90 p-2 rounded-full shadow-md transition-all duration-300 transform hover:scale-110 opacity-0 group-hover:opacity-90 focus:opacity-90"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          <button 
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white/90 p-2 rounded-full shadow-md transition-all duration-300 transform hover:scale-110 opacity-0 group-hover:opacity-90 focus:opacity-90"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Improved dots navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsTransitioning(false), 500);
                }
              }}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex 
                  ? 'w-6 h-2 bg-white' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Status badge */}
      {status && status !== 'available' && (
        <div className="absolute top-3 left-3 z-30">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white uppercase">
            {status}
          </span>
        </div>
      )}

      {/* Discount badge */}
      {discountPercent && discountPercent > 0 && (
        <div className="absolute top-3 right-3 z-30">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500 text-white">
            -{discountPercent}%
          </span>
        </div>
      )}
      
      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-3 left-3 z-30 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}