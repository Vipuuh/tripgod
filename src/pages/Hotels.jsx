import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Star, MapPin, Check, X, ShieldCheck, 
  ChevronLeft, ChevronRight, MessageSquare, ShieldAlert, Map,
  Wifi, Wind, Car, Utensils, Tv, Mountain, Waves, Bell, Zap, Flame,
  Lock, CalendarCheck, RefreshCw, HelpCircle, Eye,
  Share2, Heart, Phone, Compass, Smile, ThumbsUp, Users, Award, Sparkles,
  Coffee, CircleDollarSign
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

const HIGHLIGHT_ICONS = {
  Waves, Wifi, Car, Utensils, Tv, Mountain, Bell, Zap, Flame, ShieldCheck, Check, Heart, MapPin, Compass, Coffee, Sparkles, Smile, ThumbsUp, CalendarCheck, Lock, RefreshCw, HelpCircle, Star
};

const BENEFIT_ICONS = {
  Lock, CalendarCheck, RefreshCw, HelpCircle, ShieldCheck, CircleDollarSign, Award, Sparkles
};

const parseHighlight = (highlight) => {
  if (!highlight) return { icon: 'Star', text: '' };
  if (typeof highlight === 'object' && highlight !== null) {
    return {
      icon: highlight.icon || 'Star',
      text: highlight.text || ''
    };
  }
  if (typeof highlight === 'string') {
    const trimmed = highlight.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          icon: parsed.icon || 'Star',
          text: parsed.text || ''
        };
      } catch (e) {
        // ignore
      }
    }
    return {
      icon: 'Star',
      text: highlight
    };
  }
  return { icon: 'Star', text: String(highlight) };
};

const getUpiDiscountForHotel = (hotel) => {
  if (hotel.upi_discount !== null && hotel.upi_discount !== undefined) {
    return Number(hotel.upi_discount);
  }
  const price = Number(hotel.price);
  if (price <= 1000) return 50;
  if (price <= 2000) return 120;
  if (price <= 4000) return 150;
  if (price <= 6000) return 210;
  return 250;
};

const formatExternalUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const getMapsEmbedUrl = (mapsLink, address) => {
  if (!mapsLink) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  
  const cleanLink = mapsLink.trim();
  
  if (cleanLink.startsWith('<iframe')) {
    const srcMatch = cleanLink.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
  }
  
  if (cleanLink.includes('google.com/maps/embed') || cleanLink.includes('maps/embed')) {
    return cleanLink;
  }
  
  if (cleanLink.includes('maps.app.goo.gl') || cleanLink.includes('goo.gl/maps')) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  
  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  
  return `https://maps.google.com/maps?q=${encodeURIComponent(cleanLink)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
};

// Airbnb-Style Image Carousel Sub-component
function HotelCardCarousel({ images, hotelName, onSelect }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
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

    if (isLeftSwipe) {
      setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const fallbacks = [
    'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=600',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600'
  ];
  const displayImages = images && images.length > 0 ? images : fallbacks;

  return (
    <div 
      className="h-48 bg-gray-100 overflow-hidden relative group/carousel select-none cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={onSelect}
    >
      {/* Images container */}
      <div className="w-full h-full relative">
        <img 
          src={displayImages[currentIdx]} 
          alt={`${hotelName} view ${currentIdx + 1}`} 
          className="w-full h-full object-cover transition-all duration-300" 
        />
      </div>

      {/* Navigation Chevrons */}
      {displayImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-black flex items-center justify-center border-none shadow cursor-pointer transition-all opacity-0 group-hover/carousel:opacity-100 z-10 hover:scale-105"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-black flex items-center justify-center border-none shadow cursor-pointer transition-all opacity-0 group-hover/carousel:opacity-100 z-10 hover:scale-105"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {displayImages.slice(0, 5).map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                currentIdx === idx ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Hotels({ currentCity, openBookingModal }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImgIdx, setLightboxImgIdx] = useState(0);
  const [wishlistedHotels, setWishlistedHotels] = useState({});
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [sortBy, setSortBy] = useState('rating-desc');

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

  // Direct dynamic routing mount and back/forward browser history sync
  useEffect(() => {
    const handleRouteSync = async () => {
      const path = window.location.pathname;
      if (path.startsWith('/hotels/')) {
        const hotelId = path.substring('/hotels/'.length);
        if (selectedHotel && selectedHotel.id === hotelId) {
          return;
        }

        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('hotels')
            .select('*, vendors(*)')
            .eq('id', hotelId)
            .single();

          if (error) throw error;
          if (data) {
            const mapped = {
              id: data.id,
              name: data.name,
              description: data.description,
              price: Number(data.price),
              original_price: data.original_price ? Number(data.original_price) : null,
              address: data.address,
              maps_link: data.maps_link,
              check_in: data.check_in,
              check_out: data.check_out,
              cancellation_policy: data.cancellation_policy,
              images: data.images && data.images.length > 0 ? data.images : [
                'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=1200',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200'
              ],
              amenities: typeof data.amenities === 'string' ? JSON.parse(data.amenities) : (data.amenities || {}),
              rules: typeof data.rules === 'string' ? JSON.parse(data.rules) : (data.rules || {}),
              landmarks: data.landmarks || [],
              city_id: data.city_id,
              vendor_id: data.vendor_id,
              vendors: data.vendors,
              rating: data.rating !== null && data.rating !== undefined ? Number(data.rating) : 4.5,
              reviewsCount: data.reviews_count !== null && data.reviews_count !== undefined ? Number(data.reviews_count) : 100,
              is_limited_offer: !!data.is_limited_offer,
              why_guests_love: data.why_guests_love || [],
              rooms_left: data.rooms_left !== null && data.rooms_left !== undefined ? Number(data.rooms_left) : 5,
              high_demand: !!data.high_demand,
              attractions: Array.isArray(data.attractions) ? data.attractions : [],
              is_verified: data.is_verified !== undefined ? !!data.is_verified : true,
              bookings_count: data.bookings_count !== null && data.bookings_count !== undefined ? Number(data.bookings_count) : 18,
              popular_badge_text: data.popular_badge_text || '18 bookings this week',
              property_type: data.property_type || 'Hotel',
              room_type: data.room_type || 'Deluxe Double Room',
              best_for: data.best_for || [],
              perfect_for: data.perfect_for || [],
              benefits: data.benefits || [],
              phone_number: data.phone_number || '+919837371137',
              whatsapp_number: data.whatsapp_number || '919837371137',
              featured_image: data.featured_image || '',
              payment_mode: data.payment_mode || 'commission_advance',
              commission_percentage: data.commission_percentage !== null && data.commission_percentage !== undefined ? Number(data.commission_percentage) : 10,
              fixed_advance_amount: data.fixed_advance_amount !== null && data.fixed_advance_amount !== undefined ? Number(data.fixed_advance_amount) : 0,
              upi_discount: data.upi_discount !== null && data.upi_discount !== undefined ? Number(data.upi_discount) : null
            };
            setSelectedHotel(mapped);
            setActiveImgIdx(0);
            setIsDescExpanded(false);
          }
        } catch (err) {
          console.error('Error fetching dynamic single hotel:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setSelectedHotel(null);
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, []);

  const handleSelectHotel = (hotel) => {
    window.history.pushState(null, '', `/hotels/${hotel.id}`);
    setSelectedHotel(hotel);
    setActiveImgIdx(0);
    setIsDescExpanded(false);
    window.scrollTo(0, 0);
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

        // Apply sorting
        if (sortBy === 'price-asc') {
          query = query.order('price', { ascending: true });
        } else if (sortBy === 'price-desc') {
          query = query.order('price', { ascending: false });
        } else {
          query = query.order('rating', { ascending: false });
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
            attractions: Array.isArray(item.attractions) ? item.attractions : [],
            is_verified: item.is_verified !== undefined ? !!item.is_verified : true,
            bookings_count: item.bookings_count !== null && item.bookings_count !== undefined ? Number(item.bookings_count) : 18,
            popular_badge_text: item.popular_badge_text || '18 bookings this week',
            property_type: item.property_type || 'Hotel',
            room_type: item.room_type || 'Deluxe Double Room',
            best_for: item.best_for || [],
            perfect_for: item.perfect_for || [],
            benefits: item.benefits || [],
            phone_number: item.phone_number || '+919837371137',
            whatsapp_number: item.whatsapp_number || '919837371137',
            featured_image: item.featured_image || '',
            payment_mode: item.payment_mode || 'commission_advance',
            commission_percentage: item.commission_percentage !== null && item.commission_percentage !== undefined ? Number(item.commission_percentage) : 10,
            fixed_advance_amount: item.fixed_advance_amount !== null && item.fixed_advance_amount !== undefined ? Number(item.fixed_advance_amount) : 0,
            upi_discount: item.upi_discount !== null && item.upi_discount !== undefined ? Number(item.upi_discount) : null
          }));

          const hasKeyword = (h, keywords) => {
            const textToSearch = `${h.name} ${h.address} ${(h.landmarks || []).join(' ')}`.toLowerCase();
            return keywords.some(kw => textToSearch.includes(kw.toLowerCase()));
          };

          if (sortBy === 'near-ramjhula') {
            mapped.sort((a, b) => {
              const aNear = hasKeyword(a, ['ram jhula', 'ramjhula']);
              const bNear = hasKeyword(b, ['ram jhula', 'ramjhula']);
              if (aNear && !bNear) return -1;
              if (!aNear && bNear) return 1;
              return 0;
            });
          } else if (sortBy === 'near-laxmanjhula') {
            mapped.sort((a, b) => {
              const aNear = hasKeyword(a, ['laxman jhula', 'laxmanjhula', 'janki jhula', 'jankijhula']);
              const bNear = hasKeyword(b, ['laxman jhula', 'laxmanjhula', 'janki jhula', 'jankijhula']);
              if (aNear && !bNear) return -1;
              if (!aNear && bNear) return 1;
              return 0;
            });
          } else if (sortBy === 'near-yognagri') {
            mapped.sort((a, b) => {
              const aNear = hasKeyword(a, ['yog nagri', 'yognagri', 'yog nagari', 'yognagari', 'railway station', 'station']);
              const bNear = hasKeyword(b, ['yog nagri', 'yognagri', 'yog nagari', 'yognagari', 'railway station', 'station']);
              if (aNear && !bNear) return -1;
              if (!aNear && bNear) return 1;
              return 0;
            });
          } else if (sortBy === 'near-busstand') {
            mapped.sort((a, b) => {
              const aNear = hasKeyword(a, ['bus stand', 'busstand', 'bus stop', 'shrinagar bypass', 'roadways']);
              const bNear = hasKeyword(b, ['bus stand', 'busstand', 'bus stop', 'shrinagar bypass', 'roadways']);
              if (aNear && !bNear) return -1;
              if (!aNear && bNear) return 1;
              return 0;
            });
          }

          setHotels(mapped);
        }
      } catch (err) {
        console.error('Error fetching hotels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [currentCity, sortBy]);

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(`*ENQUIRY ABOUT STAYS - TRIPGOD*\nHello! I am planning a trip to Rishikesh and want to book accommodations. Please let me know what options are available.`);
    window.open(`https://wa.me/919837371137?text=${text}`, '_blank');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
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

              {/* Sorting Controls */}
              <div className="flex justify-end items-center -mb-2 relative z-10 px-2">
                <div className="flex items-center gap-2 bg-white border border-black/10 rounded-xl px-3.5 py-2 shadow-sm">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-black focus:outline-none focus:ring-0 cursor-pointer p-0 pr-6 appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23FF5F00'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/></svg>")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right center',
                      backgroundSize: '12px'
                    }}
                  >
                    <option value="rating-desc">Top Rated</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="near-ramjhula">Near Ram Jhula</option>
                    <option value="near-laxmanjhula">Near Laxman Jhula</option>
                    <option value="near-yognagri">Near Yog Nagri Station</option>
                    <option value="near-busstand">Near Bus Stand</option>
                  </select>
                </div>
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hotels.map(hotel => {
                  const taxes = Math.round(Number(hotel.price) * 0.12);
                  const ratingLabel = hotel.rating >= 4.5 ? 'Excellent' : 
                                      hotel.rating >= 4.0 ? 'Very Good' : 
                                      hotel.rating >= 3.5 ? 'Good' : 'Recommended';
                  return (
                    <motion.div
                      key={hotel.id}
                      whileHover={{ y: -5 }}
                      onClick={() => handleSelectHotel(hotel)}
                      className="border border-black/5 bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    >
                      <div>
                        {/* Airbnb-style Image Carousel */}
                        <div className="relative">
                          <HotelCardCarousel 
                            images={hotel.images} 
                            hotelName={hotel.name} 
                            onSelect={() => handleSelectHotel(hotel)} 
                          />
                          {hotel.is_limited_offer && (
                            <span className="absolute top-3 left-3 bg-[#FF5F00] text-white text-[8px] font-black py-1 px-2.5 rounded-full shadow-[0_4px_10px_rgba(255,95,0,0.25)] tracking-wider pointer-events-none z-10">
                              LIMITED TIME OFFER
                            </span>
                          )}
                        </div>

                        {/* MakeMyTrip Style Card Content */}
                        <div className="p-5 space-y-4">
                          {/* Rating Row */}
                          <div className="flex items-center gap-2">
                            <span className="bg-[#FF5F00] text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">
                              {hotel.rating.toFixed(1)}
                            </span>
                            <span className="text-xs font-black text-black leading-none">
                              {ratingLabel}
                            </span>
                            <span className="text-[11px] text-gray-400 font-semibold leading-none">
                              ({hotel.reviewsCount} Ratings)
                            </span>
                          </div>

                          {/* Title & Verification Badge */}
                          <div className="flex items-start gap-1.5">
                            {hotel.is_verified && (
                              <ShieldCheck size={16} className="text-[#FF5F00] shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base font-display text-black leading-snug group-hover:text-[#FF5F00] transition-colors line-clamp-2" title={hotel.name}>
                                {hotel.name}
                              </h3>
                            </div>
                          </div>

                          {/* Split Row for Info and Pricing */}
                          <div className="flex justify-between items-start gap-4 pt-1 border-t border-gray-100/50">
                            {/* Left Column: Location & Room Details */}
                            <div className="space-y-2 flex-1 min-w-0">
                              <p className="text-xs text-gray-500 font-semibold flex items-start gap-1">
                                <MapPin size={12} className="text-[#FF5F00] shrink-0 mt-0.5" />
                                <span className="break-words text-left">
                                  {hotel.address.replace(', Rishikesh', '')} {hotel.landmarks && hotel.landmarks[0] ? `| ${hotel.landmarks[0]}` : ''}
                                </span>
                              </p>
                              
                              <div className="border-l-2 border-[#FF5F00]/30 pl-2 py-0.5">
                                <p className="text-[11px] text-gray-700 font-bold leading-normal truncate">
                                  {hotel.room_type}
                                </p>
                              </div>

                              {/* Amenities List */}
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(hotel.amenities || {})
                                  .filter(([_, val]) => !!val)
                                  .slice(0, 2)
                                  .map(([key]) => (
                                    <span key={key} className="text-[9px] bg-gray-50 border border-black/5 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                                      {key.replace('_', ' ')}
                                    </span>
                                  ))}
                              </div>
                            </div>

                            {/* Right Column: Pricing */}
                            <div className="text-right shrink-0">
                              <div className="flex flex-col items-end">
                                {hotel.original_price && Number(hotel.original_price) > Number(hotel.price) && (
                                  <span className="text-xs text-gray-400 line-through font-medium">
                                    ₹{Number(hotel.original_price).toLocaleString('en-IN')}
                                  </span>
                                )}
                                <span className="text-xl font-black text-black leading-none">
                                  ₹{Number(hotel.price).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[9px] text-gray-500 font-semibold mt-1">
                                  + ₹{taxes} taxes & fees
                                </span>
                                <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wider">
                                  Per Night
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Highlight Review Snippet */}
                          {hotel.why_guests_love && hotel.why_guests_love.length > 0 && (() => {
                            const parsed = parseHighlight(hotel.why_guests_love[0]);
                            if (!parsed.text) return null;
                            const IconComponent = HIGHLIGHT_ICONS[parsed.icon] || Sparkles;
                            return (
                              <div className="bg-[#FF5F00]/5 border border-[#FF5F00]/10 rounded-xl p-3 flex items-start gap-2 text-xs text-black leading-relaxed">
                                <IconComponent size={13} className="text-[#FF5F00] shrink-0 mt-0.5" />
                                <p className="font-semibold text-gray-700 italic text-left">
                                  "{parsed.text}"
                                </p>
                              </div>
                            );
                          })()}

                          {/* Exclusive UPI Discount Banner */}
                          <div className="bg-black/5 border border-black/5 rounded-xl p-2.5 flex items-center justify-between text-[10px] text-gray-600 font-bold">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-[#FF5F00]/10 border border-[#FF5F00]/20 flex items-center justify-center shrink-0 text-[#FF5F00] text-[9px] font-black">%</span>
                              <span>Pay via UPI & get flat ₹{getUpiDiscountForHotel(hotel)} instant discount</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* View Details Action */}
                      <div className="px-5 pb-5 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectHotel(hotel);
                          }}
                          className="w-full py-3 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer text-center font-display"
                        >
                          View Stay Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
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
                  window.history.pushState(null, '', '/hotels');
                  setSelectedHotel(null);
                  setActiveImgIdx(0);
                  setIsDescExpanded(false);
                  window.scrollTo(0, 0);
                }}
                className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-650 hover:text-black hover:border-black transition-colors bg-white cursor-pointer"
              >
                <ChevronLeft size={16} /> Back to Hotel Stays
              </button>

              {/* SECTION 2: HOTEL HEADER */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FF5F00]/10 text-[#FF5F00] text-[9px] font-black uppercase tracking-wider rounded-md border border-[#FF5F00]/25">
                    Stay Details
                  </span>
                  {selectedHotel.is_limited_offer && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded-md">
                      Limited Time Offer
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black font-display text-[#0d1b2a] uppercase leading-tight tracking-tight">
                  {selectedHotel.name}
                </h1>
                
                {/* Badges / Rating row */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Rating Badge */}
                  <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-800 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs font-black">
                    <Star size={12} className="text-amber-600 fill-amber-600" />
                    <span>{selectedHotel.rating} {selectedHotel.rating >= 4.5 ? 'Excellent' : selectedHotel.rating >= 4.0 ? 'Very Good' : 'Good'}</span>
                  </div>

                  {/* Review Count */}
                  <span className="text-xs text-gray-500 font-bold">
                    ({selectedHotel.reviewsCount}+ Reviews)
                  </span>

                  {/* TripGod Verified badge */}
                  {selectedHotel.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black rounded-lg">
                      <ShieldCheck size={12} className="text-emerald-600" />
                      TripGod Verified Stay
                    </span>
                  )}

                  {/* Bookings alert count */}
                  {selectedHotel.bookings_count > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-black rounded-lg">
                      🔥 {selectedHotel.popular_badge_text || `${selectedHotel.bookings_count} bookings this week`}
                    </span>
                  )}

                  {/* Room scarcity alert count */}
                  {selectedHotel.rooms_left !== null && selectedHotel.rooms_left > 0 && selectedHotel.rooms_left <= 8 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-black rounded-lg animate-pulse">
                      ⚠️ Only {selectedHotel.rooms_left} Rooms Left!
                    </span>
                  )}
                </div>

                {/* Location */}
                {selectedHotel.maps_link ? (
                  <a 
                    href={selectedHotel.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-655 hover:text-[#FF5F00] font-semibold flex items-center gap-1.5 mt-2 group transition-colors text-decoration-none"
                  >
                    <MapPin size={13} className="text-[#FF5F00] group-hover:scale-110 transition-transform" /> 
                    <span className="underline underline-offset-2">{selectedHotel.address}</span>
                    <span className="text-[9px] bg-[#FF5F00]/10 text-[#FF5F00] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ml-1">Open Map</span>
                  </a>
                ) : (
                  <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5 mt-2">
                    <MapPin size={13} className="text-[#FF5F00]" /> {selectedHotel.address}
                  </p>
                )}
              </div>

              {/* SECTION 1: HERO GALLERY */}
              <div className="space-y-3">
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative h-60 sm:h-[420px] w-full rounded-3xl overflow-hidden bg-gray-100 group border border-black/5 shadow-md"
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

                  {/* Top-right action buttons (Share / Wishlist) */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {/* Share button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 hover:text-[#FF5F00] flex items-center justify-center border-none shadow-md cursor-pointer transition-all relative"
                      title="Share Stay"
                    >
                      <Share2 size={16} />
                      {shareFeedback && (
                        <span className="absolute -bottom-8 right-0 bg-black text-white text-[8px] font-black uppercase py-1 px-2.5 rounded shadow tracking-wider whitespace-nowrap z-20">
                          Link Copied!
                        </span>
                      )}
                    </button>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWishlistedHotels(prev => ({
                          ...prev,
                          [selectedHotel.id]: !prev[selectedHotel.id]
                        }));
                      }}
                      className="w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center border-none shadow-md cursor-pointer transition-all"
                      title="Add to Wishlist"
                    >
                      <Heart 
                        size={16} 
                        className={wishlistedHotels[selectedHotel.id] ? 'text-rose-550 fill-rose-500' : 'text-slate-800'} 
                      />
                    </button>
                  </div>

                  {selectedHotel.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImgIdx(prev => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-black border-none cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100 z-10"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setActiveImgIdx(prev => (prev + 1) % selectedHotel.images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-black border-none cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100 z-10"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  {/* Counter badge & View all photos button overlays */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
                    <span className="bg-black/60 text-white text-[10px] font-black py-1.5 px-3 rounded-xl border border-white/10 shadow-lg tracking-wider">
                      {activeImgIdx + 1} / {selectedHotel.images.length} Photos
                    </span>
                    
                    <button
                      onClick={() => {
                        setLightboxImgIdx(activeImgIdx);
                        setIsLightboxOpen(true);
                      }}
                      className="bg-[#FF5F00] hover:bg-[#FF3E00] text-white text-[10px] font-black py-1.5 px-3 rounded-xl flex items-center gap-1 border border-white/10 shadow-lg cursor-pointer transition-colors"
                    >
                      <Eye size={12} />
                      <span>View All Photos</span>
                    </button>
                  </div>
                </div>

                {/* Thumbnails preview strip below slider */}
                {selectedHotel.images && selectedHotel.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-1 pr-2 scrollbar-none">
                    {selectedHotel.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImgIdx(idx)}
                        className={`w-16 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                          activeImgIdx === idx ? 'border-[#FF5F00] scale-105 shadow-md' : 'border-black/5 hover:border-black/20'
                        }`}
                      >
                        <img src={img} alt="stay thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: PRICE & SAVINGS BOX */}
              <div className="p-5 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 border border-emerald-500/20 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md tracking-wider">Special Discount Applied</span>
                  <div className="flex items-baseline gap-2.5 pt-1">
                    <span className="text-3xl font-black text-black">₹{Number(selectedHotel.price).toLocaleString('en-IN')}</span>
                    {selectedHotel.original_price && Number(selectedHotel.original_price) > Number(selectedHotel.price) && (
                      <>
                        <span className="text-sm text-gray-400 line-through font-semibold">
                          ₹{Number(selectedHotel.original_price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          {Math.round(((selectedHotel.original_price - selectedHotel.price) / selectedHotel.original_price) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-550 font-bold block">per night + taxes (with breakfast options)</span>
                </div>
                
                {selectedHotel.original_price && Number(selectedHotel.original_price) > Number(selectedHotel.price) && (
                  <div className="bg-emerald-600 text-white font-black text-xs uppercase px-4 py-3 rounded-2xl tracking-wider text-center border-none shadow-sm flex items-center gap-1.5 w-fit">
                    <ShieldCheck size={14} className="stroke-[2.5]" />
                    <span>Save ₹{(selectedHotel.original_price - selectedHotel.price).toLocaleString('en-IN')}!</span>
                  </div>
                )}
              </div>

              {/* SECTION 4: WHY GUESTS LOVE THIS STAY HIGHLIGHT CARDS */}
              {selectedHotel.why_guests_love && selectedHotel.why_guests_love.length > 0 && (
                <div className="p-5 bg-gradient-to-br from-[#FF5F00]/5 to-orange-500/5 border border-[#FF5F00]/10 rounded-3xl space-y-4 shadow-3xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FF5F00]/10 flex items-center justify-center text-[#FF5F00]">
                      <Star size={14} className="fill-[#FF5F00]" />
                    </div>
                    <h4 className="text-xs font-black uppercase text-black tracking-wider font-display">Why Guests Love This Stay</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedHotel.why_guests_love.map((rawHighlight, idx) => {
                      const highlight = parseHighlight(rawHighlight);
                      if (!highlight.text) return null;
                      const IconComponent = HIGHLIGHT_ICONS[highlight.icon] || Star;
                      return (
                        <div key={idx} className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-black/5 hover:border-[#FF5F00]/25 transition-all shadow-3xs group">
                          <div className="w-8 h-8 rounded-xl bg-orange-500/5 text-[#FF5F00] flex items-center justify-center border border-[#FF5F00]/10 group-hover:scale-105 transition-transform">
                            <IconComponent size={15} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 leading-snug">{highlight.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 5: QUICK FACTS CARD */}
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-4 shadow-3xs">
                <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display">Quick Facts</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-700 font-bold">
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center shadow-3xs">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 block font-black">⏰ Check-In</span>
                    <span className="text-black text-xs sm:text-sm">{selectedHotel.check_in || '12:00 PM'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center shadow-3xs">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 block font-black">⏰ Check-Out</span>
                    <span className="text-black text-xs sm:text-sm">{selectedHotel.check_out || '11:00 AM'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center shadow-3xs">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 block font-black">🏨 Property Type</span>
                    <span className="text-[#FF5F00] text-xs sm:text-sm capitalize">{selectedHotel.property_type || 'Hotel'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center shadow-3xs">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 block font-black">🛏 Room Type</span>
                    <span className="text-[#FF5F00] text-xs sm:text-sm truncate">{selectedHotel.room_type || 'Deluxe Double Room'}</span>
                  </div>
                </div>

                {/* Best For facts pills */}
                {selectedHotel.best_for && selectedHotel.best_for.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-150 items-center">
                    <span className="text-[9px] text-gray-450 uppercase tracking-wider flex items-center font-black">Recommended For:</span>
                    {selectedHotel.best_for.map((fact, idx) => (
                      <span key={idx} className="bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700 text-[10px] font-bold shadow-3xs">
                        {fact}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 8: ABOUT PROPERTY */}
              <div className="space-y-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display">About the Property</h4>
                <div className="text-xs sm:text-sm text-gray-650 leading-relaxed font-medium space-y-2">
                  <p className={isDescExpanded ? 'line-clamp-none' : 'line-clamp-4'}>
                    {selectedHotel.description}
                  </p>
                  
                  {selectedHotel.description && selectedHotel.description.length > 250 && (
                    <button
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="py-1 px-3 border border-[#FF5F00]/20 hover:border-[#FF5F00]/40 text-[#FF5F00] bg-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer mt-1"
                    >
                      {isDescExpanded ? 'Read Less' : 'Read More'}
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION 9: AMENITIES */}
              {selectedHotel.amenities && Object.keys(selectedHotel.amenities).length > 0 && (
                <div className="space-y-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                  <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display">Amenities Provided</h4>
                  <div 
                    className="flex overflow-x-auto gap-3 pb-2 scroll-smooth no-scrollbar"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <style dangerouslySetInnerHTML={{__html: `
                      .no-scrollbar::-webkit-scrollbar { display: none; }
                    `}} />
                    {Object.entries(selectedHotel.amenities)
                      .filter(([_, val]) => !!val)
                      .map(([key]) => {
                        const IconComponent = AMENITY_ICONS[key] || Building2;
                        return (
                          <div
                            key={key}
                            className="flex flex-col items-center justify-center p-4 bg-slate-50/70 border border-black/5 rounded-2xl text-center hover:bg-white hover:border-[#FF5F00]/25 hover:shadow-md transition-all duration-300 group min-w-[100px] max-w-[100px] shrink-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-black/5 text-gray-500 group-hover:text-[#FF5F00] group-hover:bg-[#FF5F00]/5 transition-colors mb-2 shadow-sm">
                              <IconComponent size={18} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 capitalize tracking-tight leading-none group-hover:text-black truncate w-full">
                              {key.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* SECTION 10: PERFECT FOR TARGET TRAVELERS */}
              <div className="space-y-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display">Perfect For</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(selectedHotel.perfect_for && selectedHotel.perfect_for.length > 0
                    ? selectedHotel.perfect_for
                    : ['Couples', 'Families', 'Backpackers', 'Adventure Travelers']
                  ).map(pf => {
                    const iconsMap = {
                      Couples: Heart,
                      Families: Users,
                      Backpackers: Compass,
                      Riders: Car,
                      'Adventure Travelers': Sparkles
                    };
                    const Icon = iconsMap[pf] || Sparkles;
                    return (
                      <div key={pf} className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-[#FF5F00]/20 transition-all shadow-3xs">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/5 text-[#FF5F00] flex items-center justify-center border border-[#FF5F00]/10 shrink-0">
                          <Icon size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate">{pf}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 7: PROPERTY LOCATION */}
              <div className="space-y-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display">Property Location</h4>
                    <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                      📍 {selectedHotel.address.split(',')[0] || selectedHotel.address}
                    </span>
                  </div>
                  {selectedHotel.maps_link && (
                    <a 
                      href={formatExternalUrl(selectedHotel.maps_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-sm text-decoration-none w-fit shrink-0"
                    >
                      <Map size={12} />
                      <span>Get Directions</span>
                    </a>
                  )}
                </div>

                {/* Map Preview containing Google Maps Embed */}
                <div className="w-full h-60 rounded-2xl overflow-hidden border border-black/10 relative bg-gray-50 shadow-inner">
                  <iframe
                    title="Google Maps Embed Location"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={getMapsEmbedUrl(selectedHotel.maps_link, selectedHotel.address)}
                  />
                </div>
              </div>

              {/* SECTION 6: LOCATION HIGHLIGHTS NEARBY ATTRACTIONS */}
              {((selectedHotel.attractions && selectedHotel.attractions.length > 0) || (selectedHotel.landmarks && selectedHotel.landmarks.length > 0)) && (
                <div className="space-y-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                  <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display">Location Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Render attractions if they exist */}
                    {selectedHotel.attractions && selectedHotel.attractions.length > 0 ? (
                      selectedHotel.attractions.map((attraction, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-2xl border border-black/5 hover:border-[#FF5F00]/25 hover:bg-white transition-all shadow-3xs">
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
                              href={formatExternalUrl(attraction.maps_url)} 
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
                        <div key={idx} className="flex items-center gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-black/5 shadow-3xs">
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

              {/* SECTION 11: HOUSE RULES & SECTION 12: CANCELLATION POLICY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-100 pt-5">
                {selectedHotel.rules && Object.keys(selectedHotel.rules).length > 0 && (
                  <div className="space-y-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                    <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display">House Rules</h4>
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

                <div className="space-y-3 bg-amber-50/30 p-5 border border-amber-200/50 rounded-3xl shadow-3xs">
                  <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider font-display flex items-center gap-1">
                    <ShieldCheck size={13} className="text-amber-700" />
                    <span>Cancellation Policy</span>
                  </h4>
                  <div className="text-[11px] text-amber-900 leading-relaxed font-semibold">
                    {selectedHotel.cancellation_policy || 'No refund within 24 hours of check-in.'}
                  </div>
                </div>
              </div>

              {/* SECTION 13: TRIPGOD TRUST BENEFITS */}
              <div className="border-t border-gray-100 pt-6 pb-2">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider font-display mb-4">TripGod Trust Benefits</h4>
                <div className="flex flex-col gap-3">
                  {(selectedHotel.benefits && selectedHotel.benefits.length > 0 ? selectedHotel.benefits : [
                    { icon: 'Lock', title: 'Secure Payment', desc: 'Protected by Razorpay SECURE payment gateway' },
                    { icon: 'CalendarCheck', title: 'Instant Booking', desc: 'Hotel room voucher sent immediately to WhatsApp/Email' },
                    { icon: 'RefreshCw', title: 'Easy Refund', desc: 'No-hassle cancellation & quick automatic refunds' },
                    { icon: 'HelpCircle', title: '24×7 Support', desc: '24/7 on-ground assistance & direct guide network' },
                    { icon: 'ShieldCheck', title: 'Verified Partners', desc: 'Every stay is handpicked, inspected, and verified' },
                  ]).map((benefit, idx) => {
                    const Icon = BENEFIT_ICONS[benefit.icon] || ShieldCheck;
                    return (
                      <div key={idx} className="flex flex-row items-start gap-3.5 p-3.5 bg-slate-50/50 border border-black/5 rounded-2xl shadow-3xs">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-3xs shrink-0">
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-black text-black leading-none mb-1">{benefit.title}</span>
                          <span className="text-[10px] text-gray-500 font-semibold leading-relaxed">{benefit.desc}</span>
                        </div>
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
                      payment_mode: hotelToBook.payment_mode,
                      commission_percentage: hotelToBook.commission_percentage,
                      fixed_advance_amount: hotelToBook.fixed_advance_amount,
                      upi_discount: hotelToBook.upi_discount,
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
                <span className="block text-[9px] text-gray-550 uppercase font-black tracking-wider truncate max-w-[120px] sm:max-w-[220px]">{selectedHotel.name}</span>
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
              
              <div className="flex items-center gap-2 shrink-0">
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
                      payment_mode: hotelToBook.payment_mode,
                      commission_percentage: hotelToBook.commission_percentage,
                      fixed_advance_amount: hotelToBook.fixed_advance_amount,
                      upi_discount: hotelToBook.upi_discount,
                      slots: ['Standard Stay (Check-in 12:00 PM)', 'Early Check-in (Subject to Availability)']
                    });
                  }}
                  className="py-3 px-5 sm:px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
                >
                  Book Now
                </button>
              </div>
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
