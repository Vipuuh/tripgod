import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ChevronLeft, ChevronRight, ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';

const destinationsData = [
  {
    id: 'haridwar',
    name: 'Haridwar',
    tagline: 'Spiritual Gateway & Ganga Ghats',
    footfall: 'Highest Footfall',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop',
    status: 'Verified Operators',
    statusColor: 'bg-emerald-500/90 text-white',
    packagesCount: '25+ Stays & Transfers',
    route: 'tours',
    searchCity: 'Haridwar'
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    tagline: 'Adventure & Yoga Capital of India',
    footfall: 'Top Adventure Hub',
    image: '/rafting-hero.jpg',
    status: 'Active Marketplace',
    statusColor: 'bg-[#FF5F00] text-white',
    packagesCount: '40+ Activities & Stays',
    route: 'tours',
    searchCity: 'Rishikesh'
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    tagline: 'Queen of Hills & Scenic Valleys',
    footfall: 'Popular Hill Station',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop',
    status: 'Verified Stay Partners',
    statusColor: 'bg-indigo-600/90 text-white',
    packagesCount: '15+ Luxury Stays',
    route: 'hotels',
    searchCity: 'Mussoorie'
  },
  {
    id: 'nainital',
    name: 'Nainital',
    tagline: 'City of Lakes & Serene Views',
    footfall: 'Top Family Getaway',
    image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=800&auto=format&fit=crop',
    status: 'Booking Open',
    statusColor: 'bg-blue-600/90 text-white',
    packagesCount: '12+ Lake Resorts',
    route: 'tours',
    searchCity: 'Nainital'
  },
  {
    id: 'auli',
    name: 'Auli',
    tagline: 'Snow Slopes & Himalayan Skiing',
    footfall: 'Winter Ski Paradise',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop',
    status: 'Winter Special',
    statusColor: 'bg-cyan-600/90 text-white',
    packagesCount: '8+ Ski Packages',
    route: 'tours',
    searchCity: 'Auli'
  },
  {
    id: 'tehri',
    name: 'Tehri',
    tagline: 'Water Sports & Dam Lake Resort',
    footfall: 'Lake & Water Sports',
    image: '/paragliding-hero.jpg',
    status: 'Water Sports Hub',
    statusColor: 'bg-teal-600/90 text-white',
    packagesCount: '10+ Jet Ski & Floating Huts',
    route: 'tours',
    searchCity: 'Tehri'
  }
];

export default function ExploreDestinations({ setRoute }) {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-14 sm:py-20 bg-neutral-950 text-white relative overflow-hidden border-t border-white/10 font-sans">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#FF5F00]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">
              <MapPin size={12} className="text-[#FF6B00]" />
              <span>Explore Top Destinations</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white uppercase">
              DISCOVER UTTARAKHAND
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm max-w-xl font-medium">
              Handpicked travel experiences, verified local operators, and zero hidden charges across Uttarakhand's most visited cities.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Destination Cards */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto pb-6 pt-2 no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {destinationsData.map((dest, idx) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              onClick={() => {
                if (setRoute) setRoute(dest.route);
              }}
              className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] h-[400px] rounded-3xl relative overflow-hidden group cursor-pointer border border-white/10 bg-neutral-900 shadow-2xl hover:border-[#FF5F00]/50 transition-all duration-500"
            >
              {/* Background Cover Image with Hover Zoom */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${dest.image})` }}
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 group-hover:from-black group-hover:via-black/50 transition-all duration-500" />

              {/* Top Badges (Zero Emojis, Pure Premium Look) */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md backdrop-blur-md ${dest.statusColor}`}>
                  {dest.status}
                </span>

                <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-black/60 backdrop-blur-md text-gray-300 border border-white/10 flex items-center gap-1">
                  <ShieldCheck size={10} className="text-emerald-400" />
                  <span>Verified</span>
                </span>
              </div>

              {/* Bottom Card Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">
                    {dest.footfall}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#FF6B00] border border-white/20 text-white flex items-center justify-center transition-all duration-300 group-hover:rotate-45">
                    <ArrowUpRight size={16} />
                  </div>
                </div>

                <h3 className="text-2xl font-black font-display tracking-tight text-white uppercase group-hover:text-[#FF6B00] transition-colors">
                  {dest.name}
                </h3>

                <p className="text-xs text-gray-300 font-medium line-clamp-2 leading-relaxed">
                  {dest.tagline}
                </p>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 font-bold">
                  <span>{dest.packagesCount}</span>
                  <span className="text-white group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Explore Packages &rarr;
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
