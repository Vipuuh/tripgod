import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, MessageSquare, Sparkles, MapPin, Star,
  Bed, Trees, ShieldAlert, Check, X, ShieldCheck, Map, Phone, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../supabase';

export default function Hotels({ currentCity, openBookingModal }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Swipe gesture support
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
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && selectedHotel?.images?.length > 1) {
      setActiveImgIdx(prev => (prev + 1) % selectedHotel.images.length);
    } else if (isRightSwipe && selectedHotel?.images?.length > 1) {
      setActiveImgIdx(prev => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length);
    }
  };

  // Fallback demo stays
  const demoStays = [
    {
      id: 'demo-hotel-1',
      name: 'Valley View Cottage',
      address: 'Near Ram Jhula, Rishikesh',
      price: 2200,
      images: ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=600'],
      description: 'A cozy property nestled in the hills of Rishikesh near Ram Jhula. Enjoy panoramic mountain views, modern amenities, free WiFi, and warm hospitality.',
      amenities: { wifi: true, ac: true, mountain_view: true, geyser: true },
      rules: { unmarried_couples: true, pets: false, smoking: false },
      landmarks: ['Ram Jhula - 1.2 KM', 'Parmarth Niketan - 2 KM'],
      rating: 4.6,
      reviewsCount: 145
    },
    {
      id: 'demo-hotel-2',
      name: 'Ganga View Resort',
      address: 'Near Laxman Jhula, Rishikesh',
      price: 4500,
      images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600'],
      description: 'Experience luxury on the banks of the holy Ganges. Features directly river-facing balconies, in-house yoga sessions, rooftop organic restaurant, and swimming pool.',
      amenities: { wifi: true, ac: true, river_view: true, restaurant: true, room_service: true },
      rules: { unmarried_couples: true, pets: true, smoking: false },
      landmarks: ['Laxman Jhula - 500 Meters', 'Little Buddha Cafe - 400 Meters'],
      rating: 4.8,
      reviewsCount: 288
    }
  ];

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        let query = supabase.from('hotels').select('*, vendors(*)');
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map((item, idx) => ({
            ...item,
            rating: item.vendors?.star_rating || item.rating || Number((4.5 + ((idx * 7) % 5) / 10).toFixed(1)),
            reviewsCount: item.reviews_count || (120 + ((idx * 83) % 250))
          }));
          setHotels(mapped);
        } else {
          setHotels(demoStays);
        }
      } catch (err) {
        console.error('Error fetching hotels from Supabase:', err);
        setHotels(demoStays);
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
    <div className="w-full min-h-[80vh] bg-white flex flex-col py-16 font-sans">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        
        {/* Title Section */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 text-xs font-black uppercase tracking-widest rounded-full">
            <Sparkles size={12} className="stroke-[2.5]" /> Premium Stays
          </span>
          <h1 className="text-3xl md:text-5xl font-black font-display text-black uppercase tracking-tight">
            RESORTS & HOTEL STAYS
          </h1>
          <div className="w-20 h-1 bg-[#FF5F00] mx-auto mt-4" />
          <p className="text-gray-500 max-w-lg mx-auto text-xs sm:text-sm font-medium pt-2 leading-relaxed">
            Choose from the finest boutique cottages, ashrams, and luxury riverside resorts in {currentCity?.name || 'Rishikesh'}.
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

      {/* Hotel Details Modal */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => {
                setSelectedHotel(null);
                setActiveImgIdx(0);
              }}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl z-10 p-6 md:p-8 space-y-6 text-left border border-black/5 scrollbar-thin"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1.5 max-w-[85%]">
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
                  <h3 className="text-xl md:text-2xl font-black font-display text-black uppercase leading-tight tracking-tight">
                    {selectedHotel.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <div className="flex items-center gap-1 text-xs text-black font-black">
                      <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                      <span>{selectedHotel.rating}</span>
                      <span className="text-gray-500 font-bold">({selectedHotel.reviewsCount} reviews)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5 mt-1">
                    <MapPin size={12} className="text-[#FF5F00]" /> {selectedHotel.address}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedHotel(null);
                    setActiveImgIdx(0);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-all cursor-pointer border-none bg-transparent"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Image Gallery / Slider */}
              {selectedHotel.images && selectedHotel.images.length > 0 ? (
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative h-48 sm:h-72 w-full rounded-2xl overflow-hidden bg-gray-100 group border border-black/5 cursor-grab active:cursor-grabbing"
                >
                  <img
                    src={selectedHotel.images[activeImgIdx]}
                    alt={`${selectedHotel.name} view`}
                    className="w-full h-full object-cover transition-all duration-300 pointer-events-none select-none"
                  />

                  {selectedHotel.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImgIdx(prev => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-black border-none cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setActiveImgIdx(prev => (prev + 1) % selectedHotel.images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-black border-none cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={16} />
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
                </div>
              ) : (
                <div className="h-48 sm:h-72 w-full rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Building2 size={36} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">No images uploaded</span>
                </div>
              )}

              {/* Details Section */}
              <div className="grid grid-cols-3 gap-2.5 border-b border-gray-100 pb-4 text-[10px] sm:text-xs font-semibold">
                <div className="p-3 bg-orange-50/40 border border-orange-100 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1">Price / Night</span>
                  <div className="flex items-center gap-1.5 justify-center">
                    {selectedHotel.original_price && Number(selectedHotel.original_price) > Number(selectedHotel.price) && (
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                        ₹{Number(selectedHotel.original_price).toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-sm sm:text-base font-black text-[#FF5F00]">₹{Number(selectedHotel.price).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50/50 border border-black/5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1">Check-in</span>
                  <span className="text-xs sm:text-sm text-black font-extrabold">{selectedHotel.check_in || '12:00 PM'}</span>
                </div>
                <div className="p-3 bg-gray-50/50 border border-black/5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-1">Check-out</span>
                  <span className="text-xs sm:text-sm text-black font-extrabold">{selectedHotel.check_out || '11:00 AM'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-black tracking-wider">About the Property</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  {selectedHotel.description}
                </p>
              </div>

              {/* Amenities */}
              {selectedHotel.amenities && Object.keys(selectedHotel.amenities).length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase text-black tracking-wider">Amenities Provided</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedHotel.amenities)
                      .filter(([_, val]) => !!val)
                      .map(([key]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-black/5 text-gray-700 text-xs font-bold rounded-xl capitalize"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F00]" />
                          {key.replace('_', ' ')}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Landmarks */}
              {selectedHotel.landmarks && selectedHotel.landmarks.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase text-black tracking-wider">Nearby Landmarks</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-gray-600">
                    {selectedHotel.landmarks.map((landmark, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-xl border border-black/5">
                        <MapPin size={12} className="text-[#FF5F00] shrink-0" />
                        <span>{landmark}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules & Cancellation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-100 pt-4">
                {selectedHotel.rules && Object.keys(selectedHotel.rules).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-black tracking-wider">House Rules</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 font-semibold">
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
                          <div key={key} className="flex items-center gap-1.5 p-1.5 bg-slate-50/50 rounded-lg border border-black/5">
                            {val ? (
                              <Check size={12} className="text-emerald-600 shrink-0 stroke-[2.5]" />
                            ) : (
                              <X size={12} className="text-rose-600 shrink-0 stroke-[2.5]" />
                            )}
                            <span className="truncate text-[10px] sm:text-xs">{ruleLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-black uppercase text-black tracking-wider">Cancellation Policy</h4>
                  <div className="p-3.5 bg-amber-50/40 border border-amber-200/50 rounded-2xl text-[11px] text-amber-800 leading-relaxed font-semibold">
                    {selectedHotel.cancellation_policy || 'No refund within 24 hours of check-in.'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                {selectedHotel.maps_link && (
                  <a
                    href={selectedHotel.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 border border-gray-200 rounded-xl text-xs font-black bg-white text-black hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2 text-decoration-none"
                  >
                    <Map size={14} />
                    <span>View on Google Maps</span>
                  </a>
                )}
                <button
                  onClick={() => {
                    const hotelToBook = selectedHotel;
                    setSelectedHotel(null);
                    setActiveImgIdx(0);
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
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer text-center font-display flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} />
                  <span>Book Hotel Room</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
