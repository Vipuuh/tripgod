import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import MediaDisplay from './MediaDisplay';

export default function VendorImageCarousel({
  images = [],
  alt = 'Vendor Photo',
  className = 'w-full h-full relative overflow-hidden bg-slate-900 group',
  imageClassName = 'w-full h-full object-cover',
  interval = 3000,
  autoSlide = false,
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
      const trimmed = images.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(img => typeof img === 'string' && img.trim().length > 0);
          }
        } catch (e) {
          // ignore parse error
        }
      }
      if (trimmed.includes('|||')) {
        return trimmed.split('|||').map(s => s.trim()).filter(Boolean);
      }
      return [trimmed];
    }
    return [];
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Keep index within bounds if images change
  useEffect(() => {
    if (currentIndex >= normalizedImages.length) {
      setCurrentIndex(0);
    }
  }, [normalizedImages, currentIndex]);

  // Auto-advance slideshow (only if autoSlide is true)
  useEffect(() => {
    if (!autoSlide || normalizedImages.length <= 1 || isHovered || isDragging) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % normalizedImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoSlide, normalizedImages.length, isHovered, isDragging, interval]);

  const handleNext = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (normalizedImages.length <= 1) return;
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % normalizedImages.length);
  };

  const handlePrev = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (normalizedImages.length <= 1) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + normalizedImages.length) % normalizedImages.length);
  };

  const handleDotClick = (index, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handleTouchStart = (e) => {
    if (normalizedImages.length <= 1) return;
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    if (normalizedImages.length <= 1 || !touchStart) return;
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e) => {
    if (normalizedImages.length <= 1 || !touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;

    if (Math.abs(distanceX) > 35 && Math.abs(distanceX) > Math.abs(distanceY)) {
      if (e && e.stopPropagation) e.stopPropagation();
      if (distanceX > 0) {
        handleNext(e);
      } else {
        handlePrev(e);
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (normalizedImages.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-800 text-slate-500`}>
        <div className="flex flex-col items-center gap-1">
          <ImageIcon size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">No Media</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated Media Slide */}
      <div className="w-full h-full relative overflow-hidden touch-pan-y">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0.4, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.4, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.25 }}
            drag={normalizedImages.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, { offset, velocity }) => {
              setIsDragging(false);
              const swipeThreshold = 40;
              if (offset.x < -swipeThreshold || velocity.x < -250) {
                handleNext(e);
              } else if (offset.x > swipeThreshold || velocity.x > 250) {
                handlePrev(e);
              }
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          >
            <MediaDisplay
              src={normalizedImages[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className={`w-full h-full pointer-events-none ${imageClassName}`}
              showSoundToggle={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Children overlay (Badges, labels, etc.) */}
      {children}

      {/* Image Counter Badge (Top Right) */}
      {showBadgeCount && normalizedImages.length > 1 && (
        <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/10 tracking-wider pointer-events-none">
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
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Navigation Dots Indicator (Bottom Center) */}
      {showDots && normalizedImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/10">
          {normalizedImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              aria-label={`Go to slide ${idx + 1}`}
              className="p-1 cursor-pointer flex items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-4 bg-[#FF5F00]'
                    : 'w-1.5 bg-white/60 hover:bg-white'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
