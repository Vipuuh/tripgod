import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, BellCheck, Compass, CheckCircle2 } from 'lucide-react';

const destinationsData = [
  {
    id: 'haridwar',
    name: 'HARIDWAR',
    tagline: 'Spiritual Gateway & Ganga Ghats',
    image: '/destinations/haridwar.jpg',
    status: 'Coming Soon',
    infoText: 'We are currently onboarding 100% verified local operators and Ganga Ghat tour partners in Haridwar.'
  },
  {
    id: 'mussoorie',
    name: 'MUSSOORIE',
    tagline: 'Queen of Hills & Valleys',
    image: '/destinations/mussoorie.jpg',
    status: 'Coming Soon',
    infoText: 'Luxury resort partnerships & scenic hill stays in Mussoorie are currently under verification.'
  },
  {
    id: 'nainital',
    name: 'NAINITAL',
    tagline: 'City of Lakes & Serenity',
    image: '/destinations/nainital.jpg',
    status: 'Coming Soon',
    infoText: 'Naini Lake boating, eco-caves & boutique lake stays launching soon on TripGod.'
  },
  {
    id: 'auli',
    name: 'AULI',
    tagline: 'Himalayan Ski & Snow Resort',
    image: '/destinations/auli.jpg',
    status: 'Coming Soon',
    infoText: 'Snow skiing equipment, cable car packages & wooden chalet stays onboarding for Auli.'
  },
  {
    id: 'tehri',
    name: 'TEHRI',
    tagline: 'Water Sports & Dam Lake',
    image: '/destinations/tehri.jpg',
    status: 'Coming Soon',
    infoText: 'Jet ski rentals, banana rides & floating huts in Tehri Lake opening soon.'
  }
];

export default function ExploreDestinations() {
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isNotified, setIsNotified] = useState(false);

  return (
    <section className="py-8 sm:py-12 bg-white text-slate-900 font-sans border-b border-slate-100 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Ultra-Premium Section Header (No Arrow Buttons, Pure Elegance) */}
        <div className="flex flex-col items-start gap-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-xs">
            <Sparkles size={11} className="text-[#FF6B00]" />
            <span>Expanding Across Uttarakhand</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <div className="w-1.5 h-7 sm:h-8 bg-gradient-to-b from-[#FF7A00] to-[#FF3E00] rounded-full shrink-0" />
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black font-display tracking-tight uppercase bg-gradient-to-r from-slate-900 via-neutral-800 to-slate-700 bg-clip-text text-transparent">
              EXPLORE TOP DESTINATIONS
            </h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-medium pl-4 max-w-lg">
            Discover upcoming adventure hubs, verified stays, and local tour partners expanding soon.
          </p>
        </div>

        {/* Horizontal Scrolling Destination Cards (Swipeable, No Side Arrow Buttons) */}
        <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x snap-mandatory scroll-smooth">
          {destinationsData.map((dest, idx) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              onClick={() => {
                setSelectedDestination(dest);
                setIsNotified(false);
              }}
              className="snap-start flex-shrink-0 w-[165px] sm:w-[215px] h-[220px] sm:h-[260px] rounded-3xl relative overflow-hidden group cursor-pointer shadow-[0_6px_25px_rgba(0,0,0,0.08)] border border-slate-100 bg-slate-900 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              {/* Background Cover Image (Using User Uploaded Authentic Photos) */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${dest.image})` }}
              />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:from-black/95 transition-colors" />

              {/* Top "Coming Soon" Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#FF6B00] border border-[#FF6B00]/40 shadow-sm">
                  {dest.status}
                </span>
              </div>

              {/* Bottom Destination Title & Tagline */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 z-10 flex flex-col justify-end">
                <h3 className="text-base sm:text-xl font-black font-display tracking-tight text-white uppercase drop-shadow-md leading-none">
                  {dest.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-200 font-medium mt-1 line-clamp-1">
                  {dest.tagline}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Coming Soon Interactive Pop-up Modal */}
      <AnimatePresence>
        {selectedDestination && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl relative border border-slate-100 font-sans"
            >
              {/* Destination Cover Preview */}
              <div className="h-40 rounded-2xl overflow-hidden relative mb-4 bg-slate-900 shadow-md">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedDestination.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

                {/* Prominent & Easy to Tap Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDestination(null)}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer border border-white/25 shadow-lg active:scale-95"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-[#FF6B00] text-white tracking-wider">
                    {selectedDestination.status}
                  </span>
                  <h4 className="text-xl font-black font-display tracking-tight uppercase mt-1">
                    {selectedDestination.name}
                  </h4>
                </div>
              </div>

              {/* Modal Body */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#FF5F00] font-black text-xs uppercase tracking-wider">
                  <Compass size={16} />
                  <span>Launching Soon on TripGod</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {selectedDestination.infoText}
                </p>

                {/* Status Callout */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                  <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 font-bold leading-tight">
                    Rishikesh bookings are currently 100% active. {selectedDestination.name} packages will open very soon!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotified(true);
                      setTimeout(() => {
                        setSelectedDestination(null);
                      }, 1200);
                    }}
                    className={`flex-1 py-3 px-4 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer border-none flex items-center justify-center gap-2 ${
                      isNotified
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-102 text-white shadow-md'
                    }`}
                  >
                    {isNotified ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Notified!</span>
                      </>
                    ) : (
                      <>
                        <BellCheck size={16} />
                        <span>Notify Me On Launch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
