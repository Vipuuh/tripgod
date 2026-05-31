import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MapPin, Check, X, ShieldCheck, 
  HeartCrack, Info, Play, Calendar, Clock, Sparkles, ChevronLeft
} from 'lucide-react';

export default function ActivityDetail({ 
  id,
  title, 
  category, 
  price, 
  heroImage, 
  tagline, 
  description, 
  highlights = [], 
  inclusions = [], 
  exclusions = [], 
  eligibility = [], 
  notSuitableFor = [], 
  location = '', 
  cancellation = '100% refund 24hrs before',
  openBookingModal
}) {
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const images = Array.isArray(heroImage) ? heroImage : [heroImage];

  useEffect(() => {
    setCurrentImgIdx(0);
  }, [id]);

  const reviews = [
    { name: 'Amit Sharma', stars: 5, text: `Amazing experience! Booking with TripGod was seamless. They sent the location and driver details over WhatsApp immediately.` },
    { name: 'Pooja V.', stars: 5, text: `Professional operators, certified gear. I felt 100% safe during the activity. The 10% advance feature is a lifesaver!` },
    { name: 'Sameer S.', stars: 5, text: `Simply awesome! Highly recommend TripGod if you are visiting Rishikesh. Excellent support.` }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReviewIdx((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white pb-24 pt-6">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        
        {/* Title Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-black text-[#FF6B00] font-black tracking-widest px-2 py-0.5 rounded uppercase">
                {category}
              </span>
              <span className="text-[10px] bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 font-black tracking-widest px-2 py-0.5 rounded uppercase flex items-center gap-1">
                <Sparkles size={10} /> BEST IN CLASS
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-black">{title}</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={12} className="text-black" /> {location}
            </p>
          </div>

          <div className="text-left sm:text-right bg-[#FF5F00]/5 border border-[#FF5F00]/15 p-3 rounded-xl flex flex-col">
            <span className="text-[10px] font-bold text-gray-600 uppercase">Package Price</span>
            <span className="text-2xl font-black text-black">₹{price.toLocaleString('en-IN')}</span>
            <span className="text-[9px] font-bold text-[#FF5F00] uppercase mt-0.5">
              Pay 10% (₹{Math.round(price * 0.1)}) to book!
            </span>
          </div>
        </div>

        {/* Slider / Image Gallery */}
        <div className="h-48 sm:h-72 w-full rounded-2xl overflow-hidden relative border border-black/10 group">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImgIdx}
              src={images[currentImgIdx]} 
              alt={`${title} view ${currentImgIdx + 1}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover absolute inset-0"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />
          
          {/* Left/Right Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md hover:bg-black/75 z-10"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentImgIdx((prev) => (prev + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md hover:bg-black/75 z-10"
              >
                <ChevronLeft size={16} className="rotate-180" />
              </button>

              {/* Bottom Slide Indicators (Dots) */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
                {images.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentImgIdx(dotIdx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer border-none ${dotIdx === currentImgIdx ? 'bg-white w-3' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Specs overlay on image */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs bg-black/65 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex gap-4">
              {highlights.map((hl, idx) => (
                <div key={idx}>
                  <span className="block text-gray-400 text-[10px] uppercase font-bold">{hl.label}</span>
                  <span className="font-bold">{hl.value}</span>
                </div>
              ))}
            </div>
            <div className="px-3 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 font-bold rounded-lg flex items-center gap-1">
              <ShieldCheck size={12} /> Safe & Verified
            </div>
          </div>
        </div>

        {/* Pay 10% Banner */}
        <div className="bg-[#FFF0E5] border-2 border-[#FF6B00] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-black">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-black flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm uppercase tracking-tight">SECURE YOUR SLOT FOR 10% ADVANCE</h4>
              <p className="text-xs text-gray-600 font-medium">Pay only ₹{Math.round(price * 0.1)} online to reserve slot. 100% refund guarantee up to 24h prior.</p>
            </div>
          </div>
          <button
            onClick={() => openBookingModal({
              id,
              name: title,
              price,
              category
            })}
            className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
          >
            Book Now
          </button>
        </div>

        {/* Reviews */}
        <div className="border border-black/5 bg-gray-50 rounded-xl p-6 relative overflow-hidden min-h-[110px] flex items-center">
          <div className="space-y-2 w-full">
            <div className="flex text-yellow-400 gap-0.5">
              {[...Array(reviews[activeReviewIdx].stars)].map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm font-medium italic text-black pr-16">
              "{reviews[activeReviewIdx].text}"
            </p>
            <span className="text-xs font-bold text-gray-500">— {reviews[activeReviewIdx].name}</span>
          </div>
          <span className="absolute right-6 text-[10px] bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 font-bold px-2 py-0.5 rounded">Verified Guest</span>
        </div>

        {/* About details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-display text-black uppercase tracking-tight">About this Experience</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {description} This adventure booking includes highly certified guides, standard operating safety protocols, and standard equipment sanitized after every use. Book online via TripGod for guaranteed slot bookings.
          </p>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-black/5">
          <div className="space-y-3">
            <h4 className="font-bold text-sm font-display text-black uppercase tracking-wider flex items-center gap-1.5">
              <Check size={16} className="text-green-600 stroke-[3]" /> Inclusions
            </h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600">
              {inclusions.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">• {item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm font-display text-black uppercase tracking-wider flex items-center gap-1.5">
              <X size={16} className="text-red-600 stroke-[3]" /> Exclusions
            </h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600">
              {exclusions.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Health Warns */}
        {(eligibility.length > 0 || notSuitableFor.length > 0) && (
          <div className="p-6 border border-red-100 bg-red-50/50 rounded-2xl space-y-4">
            <h4 className="font-bold text-sm font-display text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              <HeartCrack size={16} className="text-red-700" /> Eligibility & Health Restrictions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-gray-700">
              {eligibility.length > 0 && (
                <div className="space-y-2">
                  <span className="block font-bold text-red-800">Who is Eligible:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {eligibility.map((el, idx) => <li key={idx}>{el}</li>)}
                  </ul>
                </div>
              )}
              {notSuitableFor.length > 0 && (
                <div className="space-y-2">
                  <span className="block font-bold text-red-800">NOT Suitable For:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {notSuitableFor.map((ns, idx) => <li key={idx}>{ns}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-black/5">
          <div className="space-y-2">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Pickup Point / Address</span>
            <p className="text-sm font-semibold text-black flex items-center gap-1">
              <MapPin size={16} /> {location}
            </p>
            <p className="text-xs text-gray-500">Exact coordinates and booking operator contact info will be dispatched over WhatsApp upon 10% advance clearance.</p>
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Cancellation Policy</span>
            <p className="text-sm font-semibold text-black flex items-center gap-1">
              <Info size={16} /> {cancellation}
            </p>
            <p className="text-xs text-gray-500">Cancel up to 24 hours prior to activity starting time to obtain 100% refund of your booking advance.</p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 z-40 flex items-center justify-between max-w-4xl mx-auto rounded-t-xl shadow-xl">
        <div>
          <span className="block text-[10px] text-gray-500 uppercase font-bold">{title}</span>
          <span className="text-lg font-black text-black">
            ₹{price.toLocaleString('en-IN')}<span className="text-xs text-gray-500 font-semibold">/person</span>
          </span>
        </div>
        <button
          onClick={() => openBookingModal({
            id,
            name: title,
            price,
            category
          })}
          className="py-3.5 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
