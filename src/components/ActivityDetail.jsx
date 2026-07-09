import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MapPin, Check, X, ShieldCheck, 
  HeartCrack, Info, Play, Calendar, Clock, Sparkles, ChevronLeft
} from 'lucide-react';
import OperatorSelector from './OperatorSelector';


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
  rating = 4.8,
  reviewsCount = 380,
  openBookingModal,
  operators = [],
  is_closed = false,
  closed_reason = '',
  closed_from = '',
  closed_until = '',
  free_video_type = 'none'
}) {
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  const checkIfClosed = () => {
    if (is_closed) {
      return { closed: true, reason: closed_reason || 'Monsoon season / government advisory', reopenDate: closed_until };
    }
    if (closed_from && closed_until) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const from = new Date(closed_from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(closed_until);
        to.setHours(0, 0, 0, 0);
        if (today >= from && today <= to) {
          return { closed: true, reason: closed_reason || 'Monsoon season / government advisory', reopenDate: closed_until };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return { closed: false };
  };
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [showOperatorModal, setShowOperatorModal] = useState(false);

  const handleBookClick = () => {
    const isVideo = title?.toLowerCase().includes('with video') || title?.toLowerCase().includes('with dslr video') || false;
    if (operators && operators.length > 0) {
      setShowOperatorModal(true);
    } else {
      openBookingModal({
        id,
        name: title,
        price,
        category,
        videoIncluded: isVideo,
        free_video_type: free_video_type || 'none',
        is_closed,
        closed_reason,
        closed_from,
        closed_until
      });
    }
  };


  const images = Array.isArray(heroImage) ? heroImage : [heroImage];

  useEffect(() => {
    setCurrentImgIdx(0);
  }, [id]);

  // Auto-play image gallery slideshow (slides every 4 seconds)
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length, currentImgIdx]);

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
        {checkIfClosed().closed && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex flex-col gap-1.5 text-left shadow-sm">
            <span className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5 text-red-700">
              ⚠️ TEMPORARILY CLOSED
            </span>
            <p className="text-xs font-semibold leading-relaxed">
              This {category || 'activity'} is currently closed: {checkIfClosed().reason}
            </p>
            {checkIfClosed().reopenDate && (
              <span className="text-[10px] bg-red-100 text-red-700 font-black uppercase px-2.5 py-1 rounded-lg mt-1 w-max">
                Expected Reopening: {new Date(checkIfClosed().reopenDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        )}

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
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <div className="flex items-center gap-1 text-xs text-black font-black">
                <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                <span>{rating}</span>
                <span className="text-gray-500 font-bold">({reviewsCount} reviews)</span>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-black" /> {location}
            </p>
          </div>

          <div className="text-left sm:text-right bg-[#FF5F00]/5 border border-[#FF5F00]/15 p-3 rounded-xl flex flex-col">
            <span className="text-[10px] font-bold text-gray-600 uppercase">Package Price</span>
            <span className="text-2xl font-black text-black">₹{price.toLocaleString('en-IN')}</span>
            <span className="text-[9px] font-bold text-[#FF5F00] uppercase mt-0.5">
              Book with Token Advance
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
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
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
        </div>

        {/* Specs card below image */}
        <div className="flex flex-col xs:flex-row gap-2.5 xs:items-center justify-between text-white text-[11px] sm:text-xs bg-black/85 p-3.5 sm:p-4 rounded-2xl border border-white/5 shadow-sm">
          <div className="flex gap-4 flex-wrap">
            {highlights.map((hl, idx) => (
              <div key={idx} className="min-w-[60px]">
                <span className="block text-gray-400 text-[9px] sm:text-[10px] uppercase font-bold">{hl.label}</span>
                <span className="font-bold text-white">{hl.value}</span>
              </div>
            ))}
          </div>
          <div className="self-start xs:self-auto px-2.5 py-1 bg-[#FF5F00]/15 text-[#FF5F00] border border-[#FF5F00]/30 font-bold rounded-lg flex items-center gap-1 text-[10px] sm:text-xs flex-shrink-0">
            <ShieldCheck size={12} /> Safe & Verified
          </div>
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
            <p className="text-xs text-gray-500">Exact coordinates and booking operator contact info will be dispatched over WhatsApp upon advance clearance.</p>
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Cancellation Policy</span>
            <p className="text-sm font-semibold text-black flex items-center gap-1">
              <Info size={16} /> {cancellation}
            </p>
            <p className="text-xs text-gray-500">Cancel up to 24 hours prior to activity starting time to obtain 100% refund of your booking advance.</p>
          </div>
        </div>

        {/* Pay 10% Banner */}
        <div className="bg-[#FFF0E5] border-2 border-[#FF6B00] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-black mt-6">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-black flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm uppercase tracking-tight">SECURE YOUR SLOT WITH TOKEN ADVANCE</h4>
              <p className="text-xs text-gray-600 font-medium">Pay a partial token advance online today to reserve your slot. 100% refund guarantee up to 24h prior.</p>
            </div>
          </div>
          {checkIfClosed().closed ? (
            <button
              disabled
              className="w-full sm:w-auto py-3 px-6 bg-gray-300 text-gray-500 text-xs font-black uppercase rounded-xl border-none cursor-not-allowed font-display"
            >
              Closed Temporarily
            </button>
          ) : (
            <button
              onClick={handleBookClick}
              className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
            >
              Book Now
            </button>
          )}
        </div>

        {/* Reviews */}
        <div className="border border-black/5 bg-gray-50 rounded-xl p-6 relative overflow-hidden min-h-[130px] flex items-center mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReviewIdx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="space-y-2 w-full"
            >
              <div className="flex text-yellow-400 gap-0.5">
                {[...Array(reviews[activeReviewIdx].stars)].map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm font-medium italic text-black pr-16 leading-relaxed">
                "{reviews[activeReviewIdx].text}"
              </p>
              <span className="text-xs font-bold text-gray-500">— {reviews[activeReviewIdx].name}</span>
            </motion.div>
          </AnimatePresence>
          <span className="absolute right-6 top-6 text-[10px] bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 font-bold px-2 py-0.5 rounded">Verified Guest</span>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-black/10 p-4 z-40 flex items-center justify-between max-w-4xl mx-auto rounded-t-xl shadow-xl">
        <div>
          <span className="block text-[10px] text-gray-500 uppercase font-bold">{title}</span>
          <span className="text-lg font-black text-black">
            ₹{price.toLocaleString('en-IN')}<span className="text-xs text-gray-500 font-semibold">/person</span>
          </span>
        </div>
        {checkIfClosed().closed ? (
          <button
            disabled
            className="py-3.5 px-6 bg-gray-300 text-gray-500 text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-not-allowed font-display"
          >
            Closed
          </button>
        ) : (
          <button
            onClick={handleBookClick}
            className="py-3.5 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
          >
            Book Now
          </button>
        )}
      </div>

      {/* Operator Selection Modal */}
      <AnimatePresence>
        {showOperatorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg p-6 md:p-8 max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative font-sans text-black scrollbar-thin"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowOperatorModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={18} />
              </button>

              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Choose Your Booking Option
                  </h3>
                  <span className="text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {operators.length} Options Available
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  All operators provide the same adventure. Simply choose the option that works best for you.
                </p>
              </div>

              {/* Operator List Container */}
              <div className="pt-2 text-left">
                <OperatorSelector
                  operators={operators.map(op => ({
                    id: op.id,
                    vendorName: op.vendors?.name || op.name || 'Local Operator',
                    shopImage: op.vendors?.shop_image || null,
                    starRating: op.vendors?.star_rating !== undefined ? op.vendors.star_rating : 4.5,
                    landmark: op.vendors?.landmark || op.vendors?.address || 'Rishikesh',
                    price: Number(op.price || price),
                    originalPrice: op.original_price ? Number(op.original_price) : null,
                    isLimitedOffer: !!op.is_limited_offer,
                    commissionPercentage: op.commission_percentage || op.vendors?.commission_percentage || 10,
                    
                    // Pass stretch route and distance if available
                    stretchRoute: op.route || null,
                    distanceKm: op.distance_km || null,

                    // Pass new fields
                    operatorLogo: op.operator_logo || null,
                    yearsOfExperience: op.years_of_experience !== undefined ? op.years_of_experience : null,
                    isGovtApproved: op.is_govt_approved !== undefined ? !!op.is_govt_approved : false,
                    safetyRating: op.safety_rating !== undefined && op.safety_rating !== null ? Number(op.safety_rating) : 4.5,
                    fullPaymentUpiDiscount: op.full_payment_upi_discount !== undefined && op.full_payment_upi_discount !== null ? Number(op.full_payment_upi_discount) : 0,

                    _raw: op
                  }))}
                  onBookOperator={(op) => {
                    setShowOperatorModal(false);
                    const raw = op._raw;
                    const isVideo = title?.toLowerCase().includes('with video') || title?.toLowerCase().includes('with dslr video') || raw.name?.toLowerCase().includes('with video') || false;
                    openBookingModal({
                      id: raw.id || id,
                      name: `${title} - ${op.vendorName}`,
                      price: op.price,
                      category: category,
                      city_id: raw.city_id,
                      vendor_id: raw.vendor_id,
                      commission_percentage: raw.commission_percentage || raw.vendors?.commission_percentage,
                      vendors: raw.vendors,
                      videoIncluded: isVideo,
                      free_video_type: raw.free_video_type || free_video_type || 'none'
                    });
                  }}
                  activityName={title}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
