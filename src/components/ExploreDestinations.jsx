import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

const destinationsData = [
  {
    id: 'haridwar',
    name: 'HARIDWAR',
    tagline: 'Spiritual Gateway & Ganga Ghats',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop',
    status: 'Verified Operators',
    route: 'tours'
  },
  {
    id: 'rishikesh',
    name: 'RISHIKESH',
    tagline: 'Adventure & Yoga Capital',
    image: '/rafting-hero.jpg',
    status: 'Top Choice',
    route: 'tours'
  },
  {
    id: 'mussoorie',
    name: 'MUSSOORIE',
    tagline: 'Queen of Hills',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop',
    status: 'Verified Stays',
    route: 'hotels'
  },
  {
    id: 'nainital',
    name: 'NAINITAL',
    tagline: 'City of Lakes',
    image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=800&auto=format&fit=crop',
    status: 'Booking Open',
    route: 'tours'
  },
  {
    id: 'auli',
    name: 'AULI',
    tagline: 'Snow Ski Slopes',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop',
    status: 'Winter Special',
    route: 'tours'
  },
  {
    id: 'tehri',
    name: 'TEHRI',
    tagline: 'Water Sports & Lake',
    image: '/paragliding-hero.jpg',
    status: 'Water Sports',
    route: 'tours'
  }
];

export default function ExploreDestinations({ setRoute }) {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 sm:py-12 bg-white text-slate-900 font-sans border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5">
        
        {/* Section Header with Left Red/Orange Accent Line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 sm:h-7 bg-[#FF5F00] rounded-full shrink-0" />
            <h2 className="text-lg sm:text-2xl font-black font-display tracking-tight uppercase text-slate-900">
              Explore Top Destinations
            </h2>
          </div>

          {/* Compact Carousel Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer border-none"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer border-none"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Destination Cards - Compact & Responsive */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {destinationsData.map((dest, idx) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => {
                if (setRoute) setRoute(dest.route);
              }}
              className="snap-start flex-shrink-0 w-[160px] sm:w-[210px] h-[210px] sm:h-[250px] rounded-3xl relative overflow-hidden group cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 bg-slate-900 transition-all duration-300 hover:shadow-xl"
            >
              {/* Background Cover Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${dest.image})` }}
              />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 group-hover:from-black/90 transition-colors" />

              {/* Top Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-black/50 backdrop-blur-md text-white border border-white/20">
                  {dest.status}
                </span>
              </div>

              {/* Bottom Card Title Overlay (Matching Reference Image) */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 z-10 flex flex-col justify-end">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-base sm:text-xl font-black font-display tracking-tight text-white uppercase drop-shadow-md leading-none">
                      {dest.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-200 font-medium mt-1 line-clamp-1">
                      {dest.tagline}
                    </p>
                  </div>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 group-hover:bg-[#FF5F00] text-white flex items-center justify-center transition-all duration-300 shrink-0 ml-1">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
