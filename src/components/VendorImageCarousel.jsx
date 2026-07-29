import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

export default function VendorImageCarousel({
  images = [],
  alt = 'Vendor Photo',
  className = 'w-full h-full relative overflow-hidden bg-slate-900 group',
  imageClassName = 'w-full h-full object-cover',
  interval = 3000,
  showControls = true,
  showDots = true,
  showBadgeCount = true,
  children = null
}) {
  // Normalize images input
  const normalizedImages = React.useMemo(() => {
    if (Array.isArray(images)) {
      return images.filter(img => typeof img === 'string' && img.trim().length > 0);
    }
    if (typeof images === 'string' && images.trim().length > 0) {
      return [images];
    }
    return [];
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Keep index within bounds if images change
  useEffect(() => {
    if (currentIndex >= normalizedImages.length) {
      setCurrentIndex(0);
    }
  }, [normalizedImages, currentIndex]);

  // Auto-advance slideshow every 3 seconds (or specified interval)
  useEffect(() => {
    if (normalizedImages.length <= 1 || isHovered || isDragging) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % normalizedImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [normalizedImages.length, isHovered, isDragging, interval]);

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (normalizedImages.length <= 1) return;
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % normalizedImages.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (normalizedImages.length <= 1) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + normalizedImages.length) % normalizedImages.length);
  };

  const handleDotClick = (index, e) => {
    if (e) e.stopPropagation();
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  if (normalizedImages.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-800 text-slate-500`}>
        <div className="flex flex-col items-center gap-1">
          <ImageIcon size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">No Photo</span>
        </div>
        {children}
      </div>
    );
  }

  // Animation variants for smooth sliding
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (dir) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0.8,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
    >
      {/* Animated Image Slide */}
      <div className="w-full h-full relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={currentIndex}
            src={normalizedImages[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={normalizedImages.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, { offset, velocity }) => {
              setIsDragging(false);
              const swipeThreshold = 50;
              if (offset.x < -swipeThreshold || velocity.x < -300) {
                handleNext();
              } else if (offset.x > swipeThreshold || velocity.x > 300) {
                handlePrev();
              }
            }}
            className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none ${imageClassName}`}
          />
        </AnimatePresence>
      </div>

      {/* Children overlay (Badges, labels, etc.) */}
      {children}

      {/* Image Counter Badge (Top Right) */}
      {showBadgeCount && normalizedImages.length > 1 && (
        <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/10 tracking-wider">
          📷 {currentIndex + 1}/{normalizedImages.length}
        </div>
      )}

      {/* Manual Slide Arrows (Left & Right) */}
      {showControls && normalizedImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Navigation Dots Indicator (Bottom Center) */}
      {showDots && normalizedImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full border border-white/10">
          {normalizedImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'w-4 bg-[#FF5F00]'
                  : 'w-1.5 bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
