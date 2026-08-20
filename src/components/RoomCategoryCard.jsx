import React from 'react';
import { motion } from 'framer-motion';

/**
 * RoomCategoryCard displays a room category with a carousel of images.
 * Props:
 *   - room: { name, price, original_price?, images: [] }
 *   - isSelected: boolean
 *   - onSelect: () => void
 */
export default function RoomCategoryCard({ room, isSelected, onSelect }) {
  const images = (room.images && room.images.length > 0) ? room.images : [];
  const [currentIdx, setCurrentIdx] = React.useState(0);

  const [touchStart, setTouchStart] = React.useState(null);
  const [touchEnd, setTouchEnd] = React.useState(null);

  const prevSlide = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const nextSlide = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
    if (displayImages.length <= 1) return;
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    if (displayImages.length <= 1 || !touchStart) return;
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e) => {
    if (displayImages.length <= 1 || !touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;

    if (Math.abs(distanceX) > 35 && Math.abs(distanceX) > Math.abs(distanceY)) {
      if (e && e.stopPropagation) e.stopPropagation();
      if (distanceX > 0) {
        nextSlide(e);
      } else {
        prevSlide(e);
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const displayImages = images.length > 0 ? images : [];

  return (
    <motion.button
      onClick={onSelect}
      className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
        isSelected ? 'bg-white border-[#FF5F00] shadow-md scale-[1.01]' : 'bg-white border-slate-200 hover:border-slate-350 hover:shadow-xs'
      }`}
    >
      <div className="flex-1 space-y-1">
        <span className="block text-xs font-black text-slate-850 uppercase tracking-wide">{room.name}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-black text-slate-900">₹{Number(room.price).toLocaleString('en-IN')}</span>
          {room.original_price && Number(room.original_price) > Number(room.price) && (
            <span className="text-[10px] text-gray-450 line-through">₹{Number(room.original_price).toLocaleString('en-IN')}</span>
          )}
        </div>
        <span className="block text-[8px] font-black uppercase text-[#FF5F00] tracking-wide mt-1">Upgrade Room</span>
      </div>
      {/* Image carousel */}
      {displayImages.length > 0 && (
        <div
          className="relative w-full h-32 overflow-hidden rounded-md bg-gray-100 group touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={displayImages[currentIdx]}
            alt={`${room.name} view ${currentIdx + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
          />
          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center border-none shadow cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
              >◀</button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center border-none shadow cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
              >▶</button>
            </>
          )}
        </div>
      )}
    </motion.button>
  );
}
