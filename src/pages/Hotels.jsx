import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Star, MapPin, Check, X, ShieldCheck, 
  ChevronLeft, ChevronRight, MessageSquare, ShieldAlert, Map,
  Wifi, Wind, Car, Utensils, Tv, Mountain, Waves, Bell, Zap, Flame,
  Lock, CalendarCheck, RefreshCw, HelpCircle, Eye
} from 'lucide-react';
import { supabase } from '../supabase';

const AMENITY_ICONS = {
  wifi: Wifi,
  ac: Wind,
  parking: Car,
  restaurant: Utensils,
  tv: Tv,
  mountain_view: Mountain,
  river_view: Waves,
  room_service: Bell,
  power_backup: Zap,
  geyser: Flame
};

export default function Hotels({ currentCity, openBookingModal }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImgIdx, setLightboxImgIdx] = useState(0);

  // Swipe gesture support for gallery
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !selectedHotel || !selectedHotel.images) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && selectedHotel.images.length > 1) {
      setActiveImgIdx(prev => (prev + 1) % selectedHotel.images.length);
    } else if (isRightSwipe && selectedHotel.images.length > 1) {
      setActiveImgIdx(prev => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length);
    }
  };

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        let query = supabase.from('hotels')
          .select('*, vendors(*)');
        
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        
        const { data, error } = await query;
        if (error) throw error;

        if (data) {
          const mapped = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            original_price: item.original_price ? Number(item.original_price) : null,
            address: item.address,
            maps_link: item.maps_link,
            check_in: item.check_in,
            check_out: item.check_out,
            cancellation_policy: item.cancellation_policy,
            images: item.images && item.images.length > 0 ? item.images : [
              'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=1200',
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200'
            ],
            amenities: typeof item.amenities === 'string' ? JSON.parse(item.amenities) : (item.amenities || {}),
            rules: typeof item.rules === 'string' ? JSON.parse(item.rules) : (item.rules || {}),
            landmarks: item.landmarks || [],
            city_id: item.city_id,
            vendor_id: item.vendor_id,
            vendors: item.vendors,
            rating: item.rating !== null && item.rating !== undefined ? Number(item.rating) : 4.5,
            reviewsCount: item.reviews_count !== null && item.reviews_count !== undefined ? Number(item.reviews_count) : 100,
            is_limited_offer: !!item.is_limited_offer,
            why_guests_love: item.why_guests_love || [],
            rooms_left: item.rooms_left !== null && item.rooms_left !== undefined ? Number(item.rooms_left) : 5,
            high_demand: !!item.high_demand,
            attractions: Array.isArray(item.attractions) ? item.attractions : []
          }));
          setHotels(mapped);
        }
      } catch (err) {
        console.error('Error fetching hotels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [currentCity]);

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(`*ENQUIRY ABOUT STAYS - TRIPGOD*\nHello! I am planning a trip to Rishikesh and want to book accommodations. Please let me know what options are available.`);
    window.open(`https://wa.me/919837371137?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-black space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#FF5F00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <span className="text-[10px] uppercase font-black tracking-widest text-[#FF5F00]">Loading Accommodations...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {!selectedHotel ? (
          /* SECTION A: LISTING VIEW */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-[80vh] bg-white flex flex-col py-16 font-sans"
          >
            <div className="max-w-6xl mx-auto px-6 space-y-12">
              {/* Title Section */}
              <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 text-xs font-black uppercase tracking-widest rounded-full">
                  Stay Premium
                </span>
                <h1 className="text-3xl md:text-5xl font-black font-display text-black uppercase tracking-tight">
                  RESORTS & HOTEL STAYS
                </h1>
                <div className="w-20 h-1 bg-[#FF5F00] mx-auto mt-4" />
                <p className="text-gray-500 max-w-lg mx-auto text-xs sm:text-sm font-medium pt-2 leading-relaxed">
                  Choose from the finest boutique cottages, ashrams, and luxury resorts in {currentCity?.name || 'Rishikesh'}.
                </p>
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hotels.map(hotel => {
                  const thumbnail = hotel.images && hotel.images.length > 0 ? hotel.images[0] : 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=600';
                  
                  return (
                    <motion.div
                      key={hotel.id}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedHotel(hotel)}
                      className="border border-black/5 bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    >
                      <div>
                        {/* Image */}
                        <div className="h-48 bg-gray-100 overflow-hidden relative">
                          <img 
                            src={thumbnail} 
                            alt={hotel.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          {hotel.is_limited_offer && (
                            <span className="absolute top-3 left-3 bg-[#FF5F00] text-white text-[8px] font-black py-1 px-2.5 rounded-full shadow-[0_4px_10px_rgba(255,95,0,0.25)] tracking-wider">
                              LIMITED TIME OFFER
                            </span>
                          )}
                        </div>

                        {/* Info details */}
                        <div className="p-5 space-y-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-bold text-lg font-display text-black leading-snug group-hover:text-[#FF5F00] transition-colors truncate max-w-[70%]">
                              {hotel.name}
                            </h3>
                            {hotel.vendors?.name && (
                              <span className="text-[9px] bg-slate-50 border border-black/5 text-[#FF5F00] font-black px-2 py-0.5 rounded truncate max-w-[28%]">
                                {hotel.vendors.name}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-black font-bold">
                            <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                            <span>{hotel.rating}</span>
                            <span className="text-gray-500 font-semibold">({hotel.reviewsCount} reviews)</span>
                          </div>
                          
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                              <MapPin size={12} className="text-[#FF5F00]" /> {hotel.address}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              {hotel.original_price && Number(hotel.original_price) > Number(hotel.price) && (
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{Number(hotel.original_price).toLocaleString('en-IN')}
                                </span>
                              )}
                              <span className="text-sm font-black text-[#FF5F00]">
                                ₹{Number(hotel.price).toLocaleString('en-IN')}/night
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                            {hotel.description}
                          </p>

                          {/* Landmarks list preview */}
                          {hotel.landmarks && hotel.landmarks.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {hotel.landmarks.slice(0, 2).map((landmark, idx) => (
                                <span key={idx} className="text-[9px] bg-gray-50 border border-black/5 text-gray-500 font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
                                  <MapPin size={10} className="text-gray-400" /> {landmark}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Amenities list */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {Object.entries(hotel.amenities || {}).filter(([_, val]) => !!val).map(([key]) => (
                              <span key={key} className="text-[9px] bg-slate-50 border border-black/5 text-gray-600 font-bold px-2 py-0.5 rounded capitalize">
                                {key.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* View Details Action */}
                      <div className="px-5 pb-5 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHotel(hotel);
                          }}
                          className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer text-center font-display"
                        >
                          View Stay Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Offline Notice Banner */}
              <div className="max-w-xl mx-auto p-5 border border-black/10 rounded-3xl space-y-4 bg-gray-50 text-center shadow-sm">
                <div className="flex items-center gap-2 text-yellow-800 text-xs font-semibold leading-relaxed justify-center">
                  <ShieldAlert size={16} className="flex-shrink-0" />
                  <span>Need custom packages or direct group bookings? Our local team is available 24/7.</span>
                </div>

                <button
                  onClick={handleContactWhatsApp}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer font-display"
                >
                  <MessageSquare size={16} />
                  <span>Enquire Stays on WhatsApp</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* SECTION B: DETAILED VIEW */
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="pb-24 pt-6 bg-white w-full"
          >
            <div className="max-w-4xl mx-auto px-6 space-y-6 text-left">
              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedHotel(null);
                  setActiveImgIdx(0);
                }}
                className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-650 hover:text-black hover:border-black transition-colors bg-white cursor-pointer"
              >
                <ChevronLeft size={16} /> Back to Hotel Stays
              </button>

              {/* Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FF5F00]/10 text-[#FF5F00] text-[9px] font-black uppercase tracking-wider rounded-md border border-[#FF5F00]/20">
                      Stay Details
                    </span>
                    {selectedHotel.is_limited_offer && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded-md">
                        Limited Time Offer
                      </span>
                    )}
                    {selectedHotel.vendors?.name && (
                      <span className="text-[9px] bg-slate-50 border border-black/5 text-[#FF5F00] font-black px-2 py-0.5 rounded">
                        Operator: {selectedHotel.vendors.name}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl md:text-2xl font-black font-display text-black uppercase leading-tight tracking-tight">
                    {selectedHotel.name}
                  </h1>
                  
                  {/* Stars Rating & Reviews */}
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <div className="flex items-center gap-1 text-xs text-black font-black">
                      <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                      <span>{selectedHotel.rating}</span>
                      <span className="text-gray-500 font-bold">({selectedHotel.reviewsCount} reviews)</span>
                    </div>

                    {/* Badge / Scarcity alerts */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-800 border border-amber-500/20 text-[10px] font-black rounded-lg">
                        <ShieldCheck size={12} className="text-amber-600" />
                        TripGod Verified Stay
                      </span>
                      {selectedHotel.rooms_left !== null && selectedHotel.rooms_left > 0 && selectedHotel.rooms_left <= 8 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-black rounded-lg animate-pulse">
                          ⚠️ Only {selectedHotel.rooms_left} Rooms Left!
                        </span>
                      )}
                      {selectedHotel.high_demand && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-black rounded-lg">
                          🔥 High Demand
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clickable Address Header */}
                  {selectedHotel.maps_link ? (
                    <a 
                      href={selectedHotel.maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-600 hover:text-[#FF5F00] font-semibold flex items-center gap-1.5 mt-2 group transition-colors text-decoration-none"
                    >
                      <MapPin size={12} className="text-[#FF5F00] group-hover:scale-110 transition-transform" /> 
                      <span className="underline underline-offset-2">{selectedHotel.address}</span>
                      <span className="text-[9px] bg-[#FF5F00]/10 text-[#FF5F00] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ml-1">Open Map</span>
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5 mt-2">
                      <MapPin size={12} className="text-[#FF5F00]" /> {selectedHotel.address}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right bg-[#FF5F00]/5 border border-[#FF5F00]/15 p-3.5 rounded-2xl flex flex-col w-fit shrink-0">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Price / Night</span>
                  <div className="flex items-baseline gap-1.5">
                    {selectedHotel.original_price && Number(selectedHotel.original_price) > Number(selectedHotel.price) && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{Number(selectedHotel.original_price).toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-xl font-black text-black">₹{Number(selectedHotel.price).toLocaleString('en-IN')}</span>
                  </div>
                  {selectedHotel.original_price && Number(selectedHotel.original_price) > Number(selectedHotel.price) && (
                    <span className="text-[9px] text-emerald-600 font-bold">
                      Saved ₹{(selectedHotel.original_price - selectedHotel.price).toLocaleString('en-IN')} per night
                    </span>
                  )}
                </div>
              </div>

              {/* Image Gallery / Slider */}
              {selectedHotel.images && selectedHotel.images.length > 0 ? (
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative h-56 sm:h-96 w-full rounded-3xl overflow-hidden bg-gray-100 group border border-black/5 cursor-grab active:cursor-grabbing"
                >
                  <img
                    src={selectedHotel.images[activeImgIdx]}
                    alt={`${selectedHotel.name} view`}
                    onClick={() => {
                      setLightboxImgIdx(activeImgIdx);
                      setIsLightboxOpen(true);
                    }}
                    className="w-full h-full object-cover transition-all duration-300 select-none cursor-pointer"
                  />

                  {selectedHotel.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImgIdx(prev => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-black border-none cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setActiveImgIdx(prev => (prev + 1) % selectedHotel.images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-black border-none cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={18} />
                      </button>

                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                        {selectedHotel.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImgIdx(idx)}
                            className={`w-1.5 h-1.5 rounded-full border-none cursor-pointer transition-all ${
                              activeImgIdx === idx ? 'bg-[#FF5F00] w-3' : 'bg-white/60 hover:bg-white'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Photo counter overlay */}
                  <button
                    onClick={() => {
                      setLightboxImgIdx(activeImgIdx);
                      setIsLightboxOpen(true);
                    }}
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/85 text-white text-[10px] font-black py-1.5 px-3 rounded-xl flex items-center gap-1 border border-white/10 shadow-lg cursor-pointer transition-colors"
                  >
                    <Eye size={12} />
                    <span>{activeImgIdx + 1} / {selectedHotel.images.length} Photos</span>
                  </button>
                </div>
              ) : (
                <div className="h-48 sm:h-72 w-full rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Building2 size={36} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">No images uploaded</span>
                </div>
              )}

              {/* Checkin / Checkout Specs Card */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-white text-[11px] sm:text-xs bg-slate-950 p-4 rounded-2xl border border-white/5 shadow-sm">
                <div className="flex gap-8 flex-wrap">
                  <div>
                    <span className="block text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Check-in Time</span>
                    <span className="font-bold text-white text-xs sm:text-sm">{selectedHotel.check_in || '12:00 PM'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Check-out Time</span>
                    <span className="font-bold text-white text-xs sm:text-sm">{selectedHotel.check_out || '11:00 AM'}</span>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/25 font-black rounded-lg flex items-center gap-1 text-[10px] uppercase tracking-wider">
                  ⚡ INSTANT BOOK
                </div>
              </div>

              {/* Why Guests Love This Stay Highlights */}
              {selectedHotel.why_guests_love && selectedHotel.why_guests_love.length > 0 && (
                <div className="p-5 bg-gradient-to-br from-[#FF5F00]/5 to-orange-500/5 border border-[#FF5F00]/10 rounded-2xl space-y-3.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FF5F00]/10 flex items-center justify-center text-[#FF5F00]">
                      <Star size={14} className="fill-[#FF5F00]" />
                    </div>
                    <h4 className="text-xs font-black uppercase text-black tracking-wider font-display">Why Guests Love This Stay</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 font-semibold">
                    {selectedHotel.why_guests_love.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-black/5 hover:bg-white transition-colors shadow-2xs">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-black tracking-wider font-display">About the Property</h4>
                <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-medium">
                  {selectedHotel.description}
                </p>
              </div>

              {/* Amenities */}
              {selectedHotel.amenities && Object.keys(selectedHotel.amenities).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-black tracking-wider font-display">Amenities Provided</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(selectedHotel.amenities)
                      .filter(([_, val]) => !!val)
                      .map(([key]) => {
                        const IconComponent = AMENITY_ICONS[key] || Building2;
                        return (
                          <div
                            key={key}
                            className="flex flex-col items-center justify-center p-4 bg-slate-50/70 border border-black/5 rounded-2xl text-center hover:bg-white hover:border-[#FF5F00]/20 hover:shadow-md transition-all duration-300 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-black/5 text-gray-500 group-hover:text-[#FF5F00] group-hover:bg-[#FF5F00]/5 transition-colors mb-2 shadow-sm">
                              <IconComponent size={18} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 capitalize tracking-tight leading-none group-hover:text-black">
                              {key.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Property Location section inside page content */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-black/5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Property Location</h4>
                  <p className="text-xs font-bold text-black">{selectedHotel.address}</p>
                </div>
                {selectedHotel.maps_link && (
                  <a 
                    href={selectedHotel.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-white border border-black/10 hover:border-[#FF5F00]/30 hover:text-[#FF5F00] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm text-decoration-none shrink-0"
                  >
                    <Map size={13} />
                    <span>Get Directions</span>
                  </a>
                )}
              </div>

              {/* Nearby Attractions */}
              {((selectedHotel.attractions && selectedHotel.attractions.length > 0) || (selectedHotel.landmarks && selectedHotel.landmarks.length > 0)) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-black tracking-wider font-display">Nearby Attractions & Landmarks</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Render attractions if they exist */}
                    {selectedHotel.attractions && selectedHotel.attractions.length > 0 ? (
                      selectedHotel.attractions.map((attraction, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-2xl border border-black/5 hover:border-[#FF5F00]/20 hover:bg-white transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#FF5F00]/5 flex items-center justify-center border border-[#FF5F00]/10 text-[#FF5F00]">
                              <MapPin size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-black leading-snug">{attraction.name}</p>
                              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{attraction.distance}</p>
                            </div>
                          </div>
                          {attraction.maps_url && (
                            <a 
                              href={attraction.maps_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-black text-[#FF5F00] hover:text-[#FF3E00] flex items-center gap-1 bg-white border border-black/5 hover:border-[#FF5F00]/25 px-2.5 py-1.5 rounded-lg transition-colors text-decoration-none shadow-3xs"
                            >
                              <Map size={11} />
                              <span>View Map</span>
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      /* Fallback to original landmarks array if attractions JSON is empty */
                      selectedHotel.landmarks.map((landmark, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-black/5">
                          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center border border-black/5 text-gray-400">
                            <MapPin size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-black leading-snug">{landmark}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* House Rules & Cancellation Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-100 pt-5">
                {selectedHotel.rules && Object.keys(selectedHotel.rules).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-black tracking-wider font-display">House Rules</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-655 font-bold">
                      {Object.entries(selectedHotel.rules).map(([key, val]) => {
                        const labelMap = {
                          unmarried_couples: 'Couples Allowed',
                          pets: 'Pets Allowed',
                          smoking: 'Smoking Allowed',
                          id_required: 'Govt ID Required',
                          min_age_18: '18+ Age Limit',
                          alcohol_allowed: 'Alcohol Allowed',
                          visitors_allowed: 'Outside Visitors'
                        };
                        const ruleLabel = labelMap[key] || key.replace(/_/g, ' ');
                        return (
                          <div key={key} className="flex items-center gap-1.5 p-2 bg-slate-50/40 rounded-xl border border-black/5">
                            {val ? (
                              <Check size={12} className="text-emerald-600 shrink-0 stroke-[2.5]" />
                            ) : (
                              <X size={12} className="text-rose-600 shrink-0 stroke-[2.5]" />
                            )}
                            <span className="truncate text-[10px] sm:text-xs leading-none">{ruleLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-black uppercase text-black tracking-wider font-display">Cancellation Policy</h4>
                  <div className="p-3.5 bg-amber-50/40 border border-amber-200/50 rounded-2xl text-[11px] text-amber-800 leading-relaxed font-semibold">
                    {selectedHotel.cancellation_policy || 'No refund within 24 hours of check-in.'}
                  </div>
                </div>
              </div>

              {/* TripGod Booking Benefits */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider font-display mb-4">TripGod Booking Benefits</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  {[
                    { title: 'Secure Payment', desc: 'Protected by Razorpay SECURE payment gate', icon: Lock, color: 'bg-indigo-50 text-indigo-600' },
                    { title: 'Instant Booking', desc: 'Hotel room voucher sent immediately', icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-600' },
                    { title: 'Easy Refund', desc: 'No-hassle cancellation & quick refunds', icon: RefreshCw, color: 'bg-amber-50 text-amber-600' },
                    { title: 'Local Support', desc: '24/7 on-ground assistance & guide network', icon: HelpCircle, color: 'bg-rose-50 text-rose-600' }
                  ].map((benefit, idx) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={idx} className="p-4 bg-slate-50/50 border border-black/5 rounded-2xl flex flex-col items-center text-center">
                        <div className={`w-9 h-9 rounded-full ${benefit.color} flex items-center justify-center mb-2.5 shadow-3xs`}>
                          <Icon size={16} />
                        </div>
                        <p className="text-xs font-bold text-black mb-1 leading-tight">{benefit.title}</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">{benefit.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Book Actions button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    const hotelToBook = selectedHotel;
                    openBookingModal({
                      id: hotelToBook.id,
                      name: hotelToBook.name,
                      price: hotelToBook.price,
                      category: 'hotels',
                      city_id: hotelToBook.city_id,
                      vendor_id: hotelToBook.vendor_id,
                      slots: ['Standard Stay (Check-in 12:00 PM)', 'Early Check-in (Subject to Availability)']
                    });
                  }}
                  className="w-full py-4 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer text-center font-display flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} />
                  <span>Book Hotel Room</span>
                </button>
              </div>
            </div>

            {/* Sticky Bottom Bar for booking stay */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-black/10 p-3 sm:p-4 z-40 flex items-center justify-between max-w-4xl mx-auto rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
              <div>
                <span className="block text-[9px] text-gray-500 uppercase font-black tracking-wider truncate max-w-[150px] sm:max-w-[250px]">{selectedHotel.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black text-black">
                    ₹{Number(selectedHotel.price).toLocaleString('en-IN')}
                  </span>
                  {selectedHotel.original_price && Number(selectedHotel.original_price) > Number(selectedHotel.price) && (
                    <>
                      <span className="text-xs text-gray-400 line-through">
                        ₹{Number(selectedHotel.original_price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                        {Math.round(((selectedHotel.original_price - selectedHotel.price) / selectedHotel.original_price) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[9px] text-gray-450 font-semibold block -mt-0.5">per night + taxes</span>
              </div>
              <button
                onClick={() => {
                  const hotelToBook = selectedHotel;
                  openBookingModal({
                    id: hotelToBook.id,
                    name: hotelToBook.name,
                    price: hotelToBook.price,
                    category: 'hotels',
                    city_id: hotelToBook.city_id,
                    vendor_id: hotelToBook.vendor_id,
                    slots: ['Standard Stay (Check-in 12:00 PM)', 'Early Check-in (Subject to Availability)']
                  });
                }}
                className="py-3 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
              >
                Book Now
              </button>
            </div>

            {/* Full screen lightbox modal */}
            <AnimatePresence>
              {isLightboxOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-6"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center text-white">
                    <span className="text-xs font-bold tracking-widest uppercase">
                      {lightboxImgIdx + 1} / {selectedHotel.images.length} Photos
                    </span>
                    <button
                      onClick={() => setIsLightboxOpen(false)}
                      className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white cursor-pointer flex items-center justify-center"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Main Image */}
                  <div className="relative flex-1 flex items-center justify-center">
                    {selectedHotel.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setLightboxImgIdx(prev => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length)}
                          className="absolute left-4 w-10 h-10 rounded-full bg-black/55 hover:bg-black border border-white/10 flex items-center justify-center text-white cursor-pointer shadow-md"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={() => setLightboxImgIdx(prev => (prev + 1) % selectedHotel.images.length)}
                          className="absolute right-4 w-10 h-10 rounded-full bg-black/55 hover:bg-black border border-white/10 flex items-center justify-center text-white cursor-pointer shadow-md"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                    <img
                      src={selectedHotel.images[lightboxImgIdx]}
                      alt="Full screen view"
                      className="max-w-full max-h-[75vh] object-contain rounded-xl select-none"
                    />
                  </div>

                  {/* Thumbnail strip */}
                  <div className="flex justify-center gap-2 overflow-x-auto py-4">
                    {selectedHotel.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLightboxImgIdx(idx)}
                        className={`w-14 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          lightboxImgIdx === idx ? 'border-[#FF5F00] scale-105' : 'border-white/20 hover:border-white/50'
                        }`}
                      >
                        <img src={img} alt="thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
