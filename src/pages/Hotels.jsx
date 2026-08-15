import React, { useState, useEffect } from 'react';
import RoomCategoryCard from '../components/RoomCategoryCard';
import DiningAndMealPanel from '../components/DiningAndMealPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Star, MapPin, Check, X, ShieldCheck, 
  ChevronLeft, ChevronRight, MessageSquare, ShieldAlert, Map, AlertCircle,
  Wifi, Wind, Car, Utensils, Tv, Mountain, Waves, Bell, Zap, Flame,
  Lock, CalendarCheck, RefreshCw, HelpCircle, Eye,
  Share2, Heart, Phone, Compass, Smile, ThumbsUp, Users, Award, Sparkles,
  Coffee, CircleDollarSign, Clock, Baby
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

const parseAmenities = (rawAmenities, stayDetails, rules) => {
  let input = rawAmenities;
  if (!input || (typeof input === 'object' && Object.keys(input).length === 0)) {
    if (rules && rules.amenities) {
      input = rules.amenities;
    } else if (stayDetails && stayDetails.amenities) {
      input = stayDetails.amenities;
    }
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        input = JSON.parse(trimmed);
      } catch (e) {
        input = trimmed;
      }
    }
  }

  const result = {};

  if (Array.isArray(input)) {
    input.forEach(item => {
      if (typeof item === 'string') {
        const key = item.trim().toLowerCase().replace(/[\s-]+/g, '_');
        if (key) result[key] = true;
      } else if (typeof item === 'object' && item !== null) {
        const val = item.name || item.key || item.label;
        if (val) {
          const key = String(val).trim().toLowerCase().replace(/[\s-]+/g, '_');
          if (key) result[key] = true;
        }
      }
    });
  } else if (typeof input === 'string' && input.length > 0) {
    input.split(',').forEach(item => {
      const key = item.trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (key) result[key] = true;
    });
  } else if (typeof input === 'object' && input !== null) {
    Object.entries(input).forEach(([k, v]) => {
      const isTrue = v === true || v === 'true' || v === 1 || v === '1' || v === 'yes';
      const key = k.trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (isTrue && key) result[key] = true;
    });
  }

  return result;
};

const getAmenityIcon = (key) => {
  const k = key.toLowerCase();
  if (AMENITY_ICONS[k]) return AMENITY_ICONS[k];
  if (k.includes('wifi') || k.includes('internet')) return Wifi;
  if (k.includes('ac') || k.includes('air')) return Wind;
  if (k.includes('parking') || k.includes('car')) return Car;
  if (k.includes('restaurant') || k.includes('food') || k.includes('dining')) return Utensils;
  if (k.includes('tv') || k.includes('television')) return Tv;
  if (k.includes('mountain')) return Mountain;
  if (k.includes('river') || k.includes('lake') || k.includes('water')) return Waves;
  if (k.includes('service') || k.includes('room')) return Bell;
  if (k.includes('power') || k.includes('backup') || k.includes('generator')) return Zap;
  if (k.includes('geyser') || k.includes('hot_water') || k.includes('heater')) return Flame;
  if (k.includes('pool')) return Waves;
  if (k.includes('breakfast') || k.includes('coffee')) return Coffee;
  return Building2;
};

const formatAmenityLabel = (key) => {
  const k = key.toLowerCase();
  if (k === 'wifi' || k === 'free_wifi') return 'WiFi';
  if (k === 'ac') return 'AC';
  if (k === 'tv') return 'TV';
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const HIGHLIGHT_ICONS = {
  Waves, Wifi, Car, Utensils, Tv, Mountain, Bell, Zap, Flame, ShieldCheck, Check, Heart, MapPin, Compass, Coffee, Sparkles, Smile, ThumbsUp, CalendarCheck, Lock, RefreshCw, HelpCircle, Star
};

const BENEFIT_ICONS = {
  Lock, CalendarCheck, RefreshCw, HelpCircle, ShieldCheck, CircleDollarSign, Award, Sparkles
};

const parseHighlight = (highlight) => {
  let result = { icon: 'Star', text: '' };
  if (!highlight) return result;

  // 1. If it's an array, recursively parse the first element
  if (Array.isArray(highlight)) {
    if (highlight.length === 0) return result;
    return parseHighlight(highlight[0]);
  }

  // 2. If it's an object (and not null/array), check fields
  if (typeof highlight === 'object') {
    result = {
      icon: highlight.icon || 'Star',
      text: highlight.text || ''
    };
  } else if (typeof highlight === 'string') {
    let trimmed = highlight.trim();

    // 3. If the string is a JSON array or object representation, parse it
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
        (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseHighlight(parsed);
      } catch (e) {
        // Fall back to treating it as raw string
      }
    }
    
    // Otherwise, treat as raw text
    result = { icon: 'Star', text: trimmed };
  } else {
    result = { icon: 'Star', text: String(highlight) };
  }

  // Sanitize text at the end
  result.text = sanitizeHighlightText(result.text);
  return result;
};

const sanitizeHighlightText = (text) => {
  if (!text) return '';
  let str = String(text).trim();
  
  // Recursively unpack arrays/objects string representations if any remain
  while ((str.startsWith('[') && str.endsWith(']')) || 
         (str.startsWith('{') && str.endsWith('}'))) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0) {
          str = String(parsed[0]).trim();
        } else {
          str = '';
          break;
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        str = String(parsed.text || parsed.icon || '').trim();
      } else {
        str = String(parsed).trim();
      }
    } catch (e) {
      // If parsing fails but it's wrapped in brackets, strip them
      if (str.startsWith('[') && str.endsWith(']')) {
        str = str.slice(1, -1).trim();
      } else if (str.startsWith('{') && str.endsWith('}')) {
        str = str.slice(1, -1).trim();
      } else {
        break;
      }
    }
  }

  // Strip leading/trailing quotes (single, double, backticks) recursively/repeatedly
  let prevStr;
  do {
    prevStr = str;
    str = str.replace(/^['"`\s]+|['"`\s]+$/g, '');
    str = str.replace(/^[•\-\*\s]+/, '');
  } while (str !== prevStr);

  return str.trim();
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
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=600', // Room
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600', // Bathroom
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=600', // View
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=600', // Restaurant
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600'  // Exterior
  ];
  const displayImages = images && images.length > 0 ? images : fallbacks;

  return (
    <div 
      className="aspect-video w-full bg-gray-100 overflow-hidden relative group/carousel select-none cursor-pointer"
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

  const checkIfClosed = (item) => {
    if (!item) return { closed: false };
    if (item.is_closed || item.is_available === false) {
      return { closed: true, reason: item.closed_reason || 'Property currently offline / Not taking bookings', reopenDate: item.closed_until };
    }
    if (item.closed_from && item.closed_until) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const from = new Date(item.closed_from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(item.closed_until);
        to.setHours(0, 0, 0, 0);
        if (today >= from && today <= to) {
          return { closed: true, reason: item.closed_reason || 'Monsoon season / government advisory', reopenDate: item.closed_until };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return { closed: false };
  };

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(null);
  const [selectedMeals, setSelectedMeals] = useState({ breakfast: false, lunch: false, dinner: false });
  const [numRooms, setNumRooms] = useState(1);
  const [numAdults, setNumAdults] = useState(2);
  const [numKids, setNumKids] = useState(0);
  const [childAges, setChildAges] = useState([]);

  useEffect(() => {
    setSelectedRoomIdx(null);
    setSelectedMeals({ breakfast: false, lunch: false, dinner: false });
    setNumRooms(1);
    setNumAdults(2);
    setNumKids(0);
    setChildAges([]);
  }, [selectedHotel]);

  useEffect(() => {
    setChildAges(prev => {
      if (prev.length < numKids) {
        const added = Array(numKids - prev.length).fill(3);
        return [...prev, ...added];
      }
      return prev.slice(0, numKids);
    });
  }, [numKids]);

  // Auto-adjust room count when guests exceed max capacity per room
  useEffect(() => {
    if (!selectedHotel) return;
    const maxPerRoom = selectedHotel.rules?.max_guests_per_room || 3;
    const totalGuests = numAdults + numKids;
    const minRoomsNeeded = Math.max(1, Math.ceil(totalGuests / maxPerRoom));
    if (numRooms < minRoomsNeeded) {
      setNumRooms(minRoomsNeeded);
    }
  }, [numAdults, numKids, selectedHotel, numRooms]);

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImgIdx, setLightboxImgIdx] = useState(0);
  const [wishlistedHotels, setWishlistedHotels] = useState({});
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [sortBy, setSortBy] = useState('all');

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
    if (!touchStart || !touchEnd || !selectedHotel) return;
    const activeImages = (selectedRoomIdx !== null && selectedHotel.rules?.room_categories?.[selectedRoomIdx]?.images?.length > 0)
      ? selectedHotel.rules.room_categories[selectedRoomIdx].images
      : (selectedHotel.images || []);
    if (activeImages.length === 0) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && activeImages.length > 1) {
      setActiveImgIdx(prev => (prev + 1) % activeImages.length);
    } else if (isRightSwipe && activeImages.length > 1) {
      setActiveImgIdx(prev => (prev - 1 + activeImages.length) % activeImages.length);
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
              competitor_name: data.competitor_name || 'MakeMyTrip',
              competitor_price: data.competitor_price ? Number(data.competitor_price) : null,
              mmt_url: data.mmt_url || null,
              address: data.address,
              maps_link: data.maps_link,
              check_in: data.check_in,
              check_out: data.check_out,
              cancellation_policy: data.cancellation_policy,
              images: data.images && data.images.length > 0 ? data.images : [
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200', // Room
                'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200', // Bathroom
                'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200', // View
                'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200', // Restaurant
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200'  // Exterior
              ],
              amenities: parseAmenities(data.amenities, data.stay_details, data.rules),
              rules: typeof data.rules === 'string' ? JSON.parse(data.rules) : (data.rules || {}),
              landmarks: data.landmarks || [],
              city_id: data.city_id,
              vendor_id: data.vendor_id,
              vendors: data.vendors,
              rating: data.rating !== null && data.rating !== undefined ? Number(data.rating) : 4.5,
              reviewsCount: data.reviews_count !== null && data.reviews_count !== undefined ? Number(data.reviews_count) : 100,
              is_limited_offer: !!data.is_limited_offer,
              why_guests_love: (() => {
                const val = data.why_guests_love;
                if (!val) return [];
                if (typeof val === 'string') {
                  try {
                    const parsed = JSON.parse(val);
                    return Array.isArray(parsed) ? parsed : [parsed];
                  } catch (e) {
                    return [val];
                  }
                }
                return Array.isArray(val) ? val : [val];
              })(),
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
              phone_number: data.phone_number || data.vendors?.phone || '+919410572857',
              whatsapp_number: data.whatsapp_number || data.vendors?.whatsapp || data.vendors?.phone || data.phone_number || '919410572857',
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
        let query = supabase.from('hotels').select('*');
        
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }

        let { data, error } = await query;
        if (error) throw error;

        // Fallback: If city_id query returned 0 hotels, fetch all hotels so newly added hotels are never hidden
        if ((!data || data.length === 0) && currentCity && currentCity.id !== 'default') {
          const { data: allHotels } = await supabase.from('hotels').select('*');
          if (allHotels && allHotels.length > 0) {
            data = allHotels;
          }
        }

        if (data && data.length > 0) {
          // Fetch vendors gracefully
          const vendorIds = [...new Set(data.map(h => h.vendor_id).filter(Boolean))];
          let vendorsMap = {};
          if (vendorIds.length > 0) {
            const { data: vData } = await supabase.from('vendors').select('*').in('id', vendorIds);
            if (vData && vData.length > 0) {
              vData.forEach(v => { vendorsMap[v.id] = v; });
            }
          }

          const mapped = data.map(item => {
            const vendorBase = item.net_price !== null && item.net_price !== undefined ? Number(item.net_price) : Number(item.price || 0);
            const isFlat = (item.commission_type || 'flat') === 'flat';
            const commVal = item.commission_value !== null && item.commission_value !== undefined ? Number(item.commission_value) : (item.commission_percentage || 0);
            const commAmt = item.commission_amount !== null && item.commission_amount !== undefined
              ? Number(item.commission_amount)
              : (isFlat ? commVal : Math.round((vendorBase * commVal) / 100));

            const displayPrice = Math.max(Number(item.price || 0), vendorBase + commAmt);

            return {
              ...item,
              id: item.id,
              name: item.name,
              description: item.description,
              price: displayPrice,
              net_price: vendorBase,
              commission_amount: commAmt,
              original_price: item.original_price ? Number(item.original_price) : null,
              competitor_name: item.competitor_name || 'MakeMyTrip',
              competitor_price: item.competitor_price ? Number(item.competitor_price) : null,
              mmt_url: item.mmt_url || null,
            address: item.address,
            maps_link: item.maps_link,
            check_in: item.check_in,
            check_out: item.check_out,
            cancellation_policy: item.cancellation_policy,
            images: item.images && item.images.length > 0 ? item.images : [
              'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200',
              'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200',
              'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200',
              'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200',
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200'
            ],
            amenities: parseAmenities(item.amenities, item.stay_details, item.rules),
            rules: typeof item.rules === 'string' ? JSON.parse(item.rules) : (item.rules || {}),
            landmarks: item.landmarks || [],
            city_id: item.city_id,
            vendor_id: item.vendor_id,
            vendors: vendorsMap[item.vendor_id] || item.vendors || null,
            rating: item.rating !== null && item.rating !== undefined ? Number(item.rating) : 4.5,
            reviewsCount: item.reviews_count !== null && item.reviews_count !== undefined ? Number(item.reviews_count) : 100,
            is_limited_offer: !!item.is_limited_offer,
            why_guests_love: (() => {
              const val = item.why_guests_love;
              if (!val) return [];
              if (typeof val === 'string') {
                try {
                  const parsed = JSON.parse(val);
                  return Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                  return [val];
                }
              }
              return Array.isArray(val) ? val : [val];
            })(),
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
            phone_number: item.phone_number || (vendorsMap[item.vendor_id]?.phone) || '+919410572857',
            whatsapp_number: item.whatsapp_number || (vendorsMap[item.vendor_id]?.whatsapp) || '+919410572857',
            featured_image: item.featured_image || '',
            display_order: item.display_order !== null && item.display_order !== undefined ? Number(item.display_order) : (item.rules?.display_order !== null && item.rules?.display_order !== undefined ? Number(item.rules.display_order) : 0),
            payment_mode: item.payment_mode || 'commission_advance',
            commission_percentage: item.commission_percentage !== null && item.commission_percentage !== undefined ? Number(item.commission_percentage) : 10,
            fixed_advance_amount: item.fixed_advance_amount !== null && item.fixed_advance_amount !== undefined ? Number(item.fixed_advance_amount) : 0,
            upi_discount: item.upi_discount !== null && item.upi_discount !== undefined ? Number(item.upi_discount) : null
          };
        });

          const hasKeyword = (h, keywords) => {
            const textToSearch = `${h.name || ''} ${h.address || ''} ${h.description || ''} ${(h.landmarks || []).join(' ')} ${h.property_type || ''} ${(h.best_for || []).join(' ')} ${(h.perfect_for || []).join(' ')} ${h.vendors?.address || ''} ${h.vendors?.landmark || ''} ${h.vendors?.name || ''}`.toLowerCase();
            return keywords.some(kw => textToSearch.includes(kw.toLowerCase()));
          };

          // Fetch curated order from homepage_sections for 'hotels_listing'
          let sectionOrderMap = {};
          try {
            const { data: sectionRows } = await supabase
              .from('homepage_sections')
              .select('item_id, display_order')
              .eq('section', 'hotels_listing')
              .order('display_order', { ascending: true });

            if (sectionRows && sectionRows.length > 0) {
              sectionRows.forEach((row, idx) => {
                sectionOrderMap[row.item_id] = idx + 1;
              });
            }
          } catch (secErr) {
            console.warn('Could not fetch homepage_sections for hotels_listing:', secErr);
          }

          // Sort by homepage_sections order first, then display_order
          mapped.sort((a, b) => {
            const rankA = sectionOrderMap[a.id] !== undefined ? sectionOrderMap[a.id] : (a.display_order !== undefined && a.display_order !== null && Number(a.display_order) > 0 ? Number(a.display_order) : 99999);
            const rankB = sectionOrderMap[b.id] !== undefined ? sectionOrderMap[b.id] : (b.display_order !== undefined && b.display_order !== null && Number(b.display_order) > 0 ? Number(b.display_order) : 99999);
            return rankA - rankB;
          });

          let finalMapped = [...mapped];

          if (sortBy === 'all') {
            finalMapped = [...mapped];
          } else if (sortBy === 'local-id') {
            finalMapped = mapped.filter(h => {
              const ruleLocalId = h.rules?.accepts_local_id !== false;
              const textMatch = hasKeyword(h, ['local id', 'local_id', 'local id accepted']);
              return ruleLocalId || textMatch;
            });
          } else if (sortBy === 'couple-friendly') {
            finalMapped = mapped.filter(h => {
              const ruleCouple = h.rules?.unmarried_couples === true;
              const textMatch = hasKeyword(h, ['couple', 'unmarried', 'couples']);
              return ruleCouple || textMatch;
            });
          } else if (sortBy === 'near-ramjhula') {
            finalMapped = mapped.filter(h => hasKeyword(h, ['ram jhula', 'ramjhula', 'swargashram', 'swarg ashram', 'geeta bhawan', 'parmarth']));
          } else if (sortBy === 'near-tapovan') {
            finalMapped = mapped.filter(h => hasKeyword(h, ['tapovan', 'balaknath', 'badrinath road', 'shisham bari', 'upper tapovan']));
          } else if (sortBy === 'near-laxmanjhula') {
            finalMapped = mapped.filter(h => hasKeyword(h, ['laxman jhula', 'laxmanjhula', 'lakshman jhula', 'laxman']));
          } else if (sortBy === 'near-jankisetui') {
            finalMapped = mapped.filter(h => hasKeyword(h, ['janki setu', 'jankisetui', 'janki jhula', 'jankijhula', 'pashulok', 'sita pul', 'sita jhula', 'janki', 'setu']));
          } else if (sortBy === 'near-trivenighat') {
            finalMapped = mapped.filter(h => hasKeyword(h, ['triveni ghat', 'trivenighat', 'triveni', 'main market', 'ghat', 'railway station']));
          } else if (sortBy === 'near-busstand') {
            finalMapped = mapped.filter(h => hasKeyword(h, ['bus stand', 'busstand', 'bus stop', 'isbt', 'shrinagar bypass', 'roadways', 'nataraj']));
          }

          // Always apply display_order priority first (1, 2, 3...)
          finalMapped.sort((a, b) => {
            const orderA = a.display_order !== undefined && a.display_order !== null && Number(a.display_order) > 0 ? Number(a.display_order) : 99999;
            const orderB = b.display_order !== undefined && b.display_order !== null && Number(b.display_order) > 0 ? Number(b.display_order) : 99999;
            if (orderA !== orderB) return orderA - orderB;

            if (sortBy === 'most-booked') return (b.bookings_count || 0) - (a.bookings_count || 0);
            if (sortBy === 'top-rated') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
            if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
            return (b.rating || 0) - (a.rating || 0);
          });

          setHotels(finalMapped);
        } else {
          setHotels([]);
        }
      } catch (err) {
        console.error('Error fetching hotels:', err);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [currentCity, sortBy]);

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(`*ENQUIRY ABOUT STAYS - TRIPGOD*\nHello! I am planning a trip to Rishikesh and want to book accommodations. Please let me know what options are available.`);
    window.open(`https://wa.me/919410572857?text=${text}`, '_blank');
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
    <div className="w-full overflow-x-hidden bg-white min-h-screen">
      <AnimatePresence mode="wait">
        {!selectedHotel ? (
          /* SECTION A: LISTING VIEW */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-[80vh] bg-white flex flex-col py-8 font-sans"
          >
            <div className="w-full px-4 overflow-x-hidden space-y-8 max-w-6xl mx-auto">
              
              {/* Compact Title Section */}
              <div className="text-center space-y-1.5 py-2">
                <h1 className="text-2xl md:text-3xl font-black font-display text-black flex items-center justify-center gap-2">
                  Hotels in Rishikesh
                </h1>
                <p className="text-slate-400 max-w-lg mx-auto text-[11px] font-extrabold tracking-wide uppercase">
                  Verified stays in Rishikesh with instant booking
                </p>
              </div>

              {/* Premium Sorting Bar Upgrade */}
              <div className="sticky top-4 z-30 w-full max-w-full bg-gradient-to-r from-blue-950 to-blue-900 border border-blue-800 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
                {/* Result Counter */}
                <div className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                  Showing {hotels.length} Stays
                </div>
                
                {/* Horizontal Scrollable Chips UI */}
                <div className="w-full flex overflow-x-auto whitespace-nowrap hide-scrollbar items-center gap-2 pb-1 sm:pb-0 snap-x select-none max-w-full">
                  {[
                    { val: 'all', label: 'All Stays' },
                    { val: 'couple-friendly', label: 'Couple Friendly' },
                    { val: 'local-id', label: 'Local ID Accepted' },
                    { val: 'most-booked', label: 'Most Booked' },
                    { val: 'top-rated', label: 'Top Rated' },
                    { val: 'price-asc', label: 'Lowest Price' },
                    { val: 'price-desc', label: 'Highest Price' }
                  ].map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setSortBy(chip.val)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 transition-all border cursor-pointer ${
                        sortBy === chip.val
                          ? 'bg-[#FF5F00] text-white border-[#FF5F00] shadow-[0_4px_12px_rgba(255,95,0,0.3)]'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hotels.map((hotel, idx) => {
                  const displayPrice = Number(hotel.price);
                  const displayOriginalPrice = hotel.original_price ? Number(hotel.original_price) : Math.round(displayPrice * 1.4);
                  const isDiscounted = displayOriginalPrice && displayOriginalPrice > displayPrice;
                  const savings = displayOriginalPrice - displayPrice;
                  const upiDiscount = getUpiDiscountForHotel(hotel);

                  const ratingLabel = hotel.rating >= 4.5 ? 'Excellent' : 
                                      hotel.rating >= 4.0 ? 'Very Good' : 
                                      hotel.rating >= 3.5 ? 'Good' : 'Recommended';

                  const displayHotelName = hotel.name;

                  const getLandmarkText = () => {
                    if (hotel.landmarks && hotel.landmarks[0] && hotel.landmarks[0].trim() !== '') {
                      return hotel.landmarks[0].trim();
                    }
                    const addLower = (hotel.address || '').toLowerCase();
                    const isLaxman = addLower.includes('laxman') || addLower.includes('lakshman');
                    return isLaxman ? 'Laxman Jhula' : 'Ram Jhula';
                  };

                  const landmarkText = getLandmarkText();

                  const getListingBadges = () => {
                    const customBadge1 = hotel.rules?.badge_settings?.list_badge1;
                    const customBadge2 = hotel.rules?.badge_settings?.list_badge2;
                    const activeBadges = [customBadge1, customBadge2].filter(b => b && b.trim() !== '');
                    if (activeBadges.length > 0) {
                      return activeBadges;
                    }
                    if (hotel.best_for && hotel.best_for.length > 0) {
                      return hotel.best_for.slice(0, 2);
                    }
                    const badges = [];
                    if (displayPrice <= 2500) {
                      badges.push('Best Value');
                    } else {
                      badges.push('Most Booked');
                    }
                    if (hotel.rules?.unmarried_couples) {
                      badges.push('Couple Friendly');
                    } else {
                      badges.push('Family Choice');
                    }
                    return badges;
                  };
                  const listingBadges = getListingBadges();

                  return (
                    <motion.div
                      key={hotel.id}
                      initial={{ opacity: 0, y: 24, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4) }}
                      whileHover={{ y: -5, scale: 1.01 }}
                      onClick={() => handleSelectHotel(hotel)}
                      className="w-full max-w-full border border-slate-150 bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(255,95,0,0.1)] transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Airbnb-style Image Carousel with overlay chips */}
                        <div className="relative h-[200px] overflow-hidden">
                          <HotelCardCarousel 
                             images={hotel.images} 
                             hotelName={hotel.name} 
                             onSelect={() => handleSelectHotel(hotel)} 
                          />
                          {checkIfClosed(hotel).closed && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                              <span className="bg-red-650 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-md">
                                Closed
                              </span>
                            </div>
                          )}
                          
                          {/* Top Left Overlay Chip */}
                          {hotel.is_limited_offer && (
                            <span className="absolute top-2.5 left-2.5 bg-[#FF5F00] text-white text-[7.5px] font-black py-0.5 px-1.5 rounded tracking-wider uppercase z-10 pointer-events-none shadow-xs">
                              🔥 Limited Offer
                            </span>
                          )}

                          {/* Top Right Overlay Chip */}
                          <span className="absolute top-2.5 right-2.5 bg-black/55 backdrop-blur-xs text-white text-[9px] font-black py-0.5 px-2 rounded-md tracking-wider z-10 pointer-events-none flex items-center gap-0.5">
                            ⭐ {hotel.rating.toFixed(1)}
                          </span>

                          {/* Bottom Left Overlay Badge: Price & Competitor Comparison */}
                          {hotel.competitor_price && Number(hotel.competitor_price) > displayPrice ? (
                            <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-xl text-left pointer-events-none select-none z-10 flex flex-col border border-white/10 shadow-md max-w-[90%]">
                              <span className="text-[8.5px] text-gray-300 font-extrabold uppercase tracking-wide">
                                {hotel.competitor_name || 'MakeMyTrip'} Today: <span className="line-through text-slate-400">₹{Number(hotel.competitor_price).toLocaleString('en-IN')}</span>
                              </span>
                              <span className="text-[11px] font-black leading-tight text-white mt-0.5">
                                TripGod: ₹{displayPrice.toLocaleString('en-IN')} <span className="text-[8px] opacity-75 font-bold font-sans">/ Night</span>
                              </span>
                              <span className="text-[8.5px] text-[#10B981] font-black uppercase tracking-wide mt-0.5">
                                Save ₹{(Number(hotel.competitor_price) - displayPrice).toLocaleString('en-IN')} Today
                              </span>
                            </div>
                          ) : (
                            <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-xl text-left pointer-events-none select-none z-10 flex flex-col border border-white/10 shadow-md">
                              <span className="text-[8px] text-amber-300 font-black uppercase tracking-widest">
                                TripGod Exclusive
                              </span>
                              <span className="text-[11px] font-black leading-tight text-white mt-0.5">
                                From ₹{displayPrice.toLocaleString('en-IN')} <span className="text-[8px] opacity-75 font-bold font-sans">/ Night</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Redesigned Card Body */}
                        <div className="px-3.5 py-3.5 space-y-2 text-left">
                          
                          {/* Title / Hotel Name */}
                          <h3 className="font-extrabold text-sm sm:text-base font-display text-black uppercase leading-snug group-hover:text-[#FF5F00] transition-colors line-clamp-1">
                            {displayHotelName}
                          </h3>

                          {/* Reviews row - single line */}
                          <div className="text-[10px] font-extrabold text-slate-800 flex items-center gap-1 select-none whitespace-nowrap">
                            <span className="text-[#FF5F00]">⭐</span>
                            <span>{hotel.rating.toFixed(1)} {ratingLabel} ({hotel.reviewsCount} Verified Reviews)</span>
                          </div>

                          {/* Verified & Location Row - Combined horizontally */}
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10.5px] font-extrabold select-none">
                            {hotel.is_verified && (
                              <span className="text-[#008F5D] font-black flex items-center gap-1 uppercase tracking-wider bg-emerald-50 border border-emerald-100/80 px-2 py-0.5 rounded-md">
                                ✔ VERIFIED BY TRIPGOD
                              </span>
                            )}
                            {hotel.is_verified && <span className="text-slate-300">•</span>}
                            <span className="text-slate-600 flex items-center gap-1">
                              📍 {landmarkText}
                            </span>
                          </div>

                          {/* Badges Row */}
                          <div className="flex flex-wrap gap-1.5 select-none pt-0.5">
                            {listingBadges.map((badge, bIdx) => {
                              const isCouple = badge.toLowerCase().includes('couple');
                              const isLimited = badge.toLowerCase().includes('limited');
                              const cleanText = badge.replace(/[\p{Emoji}\u200d]+/gu, '').trim() || badge;
                              return (
                                <span 
                                  key={bIdx} 
                                  className={`inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-1 rounded border leading-none h-[22px] ${
                                    isCouple 
                                      ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                      : (isLimited ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border border-slate-200 text-slate-800')
                                  }`}
                                >
                                  {isCouple ? '💕 ' : ''}{cleanText}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Check Availability button */}
                      <div className="px-3.5 pb-3.5 pt-0 text-center flex flex-col items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectHotel(hotel);
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-[12px] uppercase tracking-wider rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all border-none cursor-pointer text-center font-display h-[44px] flex items-center justify-center"
                        >
                          BOOK NOW →
                        </button>
                        <span className="text-[9px] text-gray-500 font-bold mt-1.5 select-none">Instant Confirmation</span>
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
              {(() => {
                // Initialize local helpers for room categories
                window._activeImages = (selectedRoomIdx !== null && selectedHotel.rules?.room_categories?.[selectedRoomIdx]?.images?.length > 0)
                  ? selectedHotel.rules.room_categories[selectedRoomIdx].images
                  : (selectedHotel.images || []);
                window._activeRoomPrice = selectedRoomIdx !== null
                  ? Number(selectedHotel.rules?.room_categories?.[selectedRoomIdx]?.price || selectedHotel.price)
                  : Number(selectedHotel.price);
                window._activeRoomOriginalPrice = selectedRoomIdx !== null
                  ? (selectedHotel.rules?.room_categories?.[selectedRoomIdx]?.original_price ? Number(selectedHotel.rules.room_categories[selectedRoomIdx].original_price) : null)
                  : (selectedHotel.original_price ? Number(selectedHotel.original_price) : null);

                // NEW: Correct pricing — room price is per room, NOT per person
                const _meals = selectedHotel.rules?.meals || {};
                const _totalGuests = numAdults + numKids;
                let _mealCostPerNight = 0;
                if (selectedMeals.breakfast && _meals.breakfast?.status === 'paid')
                  _mealCostPerNight += (_meals.breakfast?.price || 150) * _totalGuests;
                if (selectedMeals.lunch && _meals.lunch?.status === 'paid')
                  _mealCostPerNight += (_meals.lunch?.price || 250) * _totalGuests;
                if (selectedMeals.dinner && _meals.dinner?.status === 'paid')
                  _mealCostPerNight += (_meals.dinner?.price || 300) * _totalGuests;

                window._roomCostPerNight = window._activeRoomPrice * numRooms;
                window._mealCostPerNight = _mealCostPerNight;
                window._totalPricePerNight = window._roomCostPerNight + _mealCostPerNight;
                window._gstAmountPerNight = Math.round(window._totalPricePerNight * 0.12);
                window._grandTotalWithGstPerNight = window._totalPricePerNight + window._gstAmountPerNight;
                window._totalGuests = _totalGuests;
                return null;
              })()}
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

              {checkIfClosed(selectedHotel).closed && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex flex-col gap-1.5 text-left shadow-sm">
                  <span className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5 text-red-700">
                    ⚠️ HOTEL STAYS TEMPORARILY CLOSED
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">
                    This hotel is currently closed or not taking bookings: {checkIfClosed(selectedHotel).reason}
                  </p>
                  {checkIfClosed(selectedHotel).reopenDate && (
                    <span className="text-[10px] bg-red-100 text-red-700 font-black uppercase px-2.5 py-1 rounded-lg mt-1 w-max">
                      Expected Reopening: {new Date(checkIfClosed(selectedHotel).reopenDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              )}

              {/* SECTION 2: HOTEL HEADER */}
              <div className="space-y-2 text-left">
                {/* Dynamic Detail Page Badges */}
                {(() => {
                  const badge1 = selectedHotel.rules?.badge_settings?.detail_badge1;
                  const badge2 = selectedHotel.rules?.badge_settings?.detail_badge2;
                  const activeBadges = [badge1, badge2].filter(b => b && b.trim() !== '');

                  if (activeBadges.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {activeBadges.map((badge, idx) => {
                          const isCouple = badge.toLowerCase().includes('couple');
                          const isLimited = badge.toLowerCase().includes('limited');
                          const isBestseller = badge.toLowerCase().includes('best');
                          const isTop = badge.toLowerCase().includes('top');
                          const emoji = isCouple ? '💕' : (isLimited ? '🔥' : (isBestseller ? '🏆' : (isTop ? '⭐' : '🏷️')));
                          return (
                            <span 
                              key={idx}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-black uppercase tracking-wider rounded-xl border select-none ${
                                isCouple 
                                  ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                  : (isLimited ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border border-slate-200 text-slate-800')
                              }`}
                            >
                              {badge.match(/[\p{Emoji}\u200d]+/gu) ? '' : emoji} {badge}
                            </span>
                          );
                        })}
                      </div>
                    );
                  }
                  return selectedHotel.is_limited_offer ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                      🔥 Limited Time Offer
                    </span>
                  ) : null;
                })()}

                <h1 className="text-2xl md:text-3xl font-black font-display text-[#0d1b2a] uppercase leading-tight tracking-tight">
                  {selectedHotel.name}
                </h1>
                
                {/* Micro info rows - Line 1: Verified + Location side-by-side | Line 2: Rating */}
                <div className="space-y-1.5 pt-1 text-left">
                  <div className="flex flex-wrap items-center gap-2 text-slate-700 text-[11px] font-extrabold select-none">
                    {selectedHotel.is_verified && (
                      <span className="text-[#008F5D] bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-lg font-black flex items-center gap-1 uppercase tracking-wider text-[10px]">
                        ✓ Verified by TripGod
                      </span>
                    )}

                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-700 text-[10.5px]">
                      📍 {(() => {
                        if (selectedHotel.landmarks && selectedHotel.landmarks[0] && selectedHotel.landmarks[0].trim() !== '') {
                          return selectedHotel.landmarks[0].trim();
                        }
                        const addLower = (selectedHotel.address || '').toLowerCase();
                        const isLaxman = addLower.includes('laxman') || addLower.includes('lakshman');
                        return isLaxman ? 'Laxman Jhula' : 'Ram Jhula';
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 select-none">
                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-800 text-[10.5px] font-extrabold">
                      <span className="text-[#FF5F00]">⭐</span> {selectedHotel.rating.toFixed(1)} Excellent ({selectedHotel.reviewsCount} Verified Reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: HERO GALLERY */}
              <div className="space-y-3 mt-2">
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative h-60 sm:h-[420px] w-full rounded-3xl overflow-hidden bg-gray-100 group border border-black/5 shadow-md"
                >
                  <img
                    src={window._activeImages[activeImgIdx] || window._activeImages[0]}
                    alt={`${selectedHotel.name} view`}
                    onClick={() => {
                      setLightboxImgIdx(activeImgIdx);
                      setIsLightboxOpen(true);
                    }}
                    className="w-full h-full object-cover transition-all duration-300 select-none cursor-pointer"
                  />

                  {/* Top-left popular badge — dynamic from bookings_count or popular_badge_text */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 select-none">
                    {(() => {
                      const count = selectedHotel.bookings_count;
                      const badgeText = selectedHotel.popular_badge_text
                        || (count ? `${count} bookings this week` : null);
                      if (badgeText) {
                        const isChoice = badgeText.toLowerCase().includes('choice');
                        return (
                          <span className="bg-[#FF5F00] text-white text-[9px] font-black py-1.5 px-3 rounded-lg shadow-md uppercase tracking-wider border border-[#FF5F00]/10 flex items-center gap-1">
                            {isChoice ? '🏆' : '🔥'} {badgeText}
                          </span>
                        );
                      }
                      if (selectedHotel.high_demand) {
                        return (
                          <span className="bg-[#FF5F00] text-white text-[9px] font-black py-1.5 px-3 rounded-lg shadow-md uppercase tracking-wider border border-[#FF5F00]/10 flex items-center gap-1">
                            🏆 Traveler's Choice
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>


                  {window._activeImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImgIdx(prev => (prev - 1 + window._activeImages.length) % window._activeImages.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-black border-none cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100 z-10"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setActiveImgIdx(prev => (prev + 1) % window._activeImages.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-black border-none cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100 z-10"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  {/* Photo count indicator overlay */}
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-black py-1.5 px-3 rounded-xl border border-white/10 shadow-lg tracking-wider pointer-events-none select-none z-10">
                    {window._activeImages.length} Photos ({activeImgIdx + 1} / {window._activeImages.length})
                  </div>
                </div>

                {/* Thumbnails preview strip below slider */}
                {window._activeImages && window._activeImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-1 pr-2 scrollbar-none">
                    {window._activeImages.map((img, idx) => (
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

              {/* SECTION 3: PRICE & SAVINGS BOX WITH INTEGRATED COMPETITOR COMPARISON */}
              <div className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-3xl space-y-4 shadow-sm select-none text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">SPECIAL STAY PRICE</span>
                      {selectedHotel.rooms_left !== null && selectedHotel.rooms_left > 0 && selectedHotel.rooms_left <= 5 && (
                        <span className="text-[8.5px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded animate-pulse">
                          Only {selectedHotel.rooms_left} Rooms Left!
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-3 pt-1">
                      <span className="text-3xl font-black text-slate-900 leading-none">
                        ₹{window._activeRoomPrice.toLocaleString('en-IN')}
                        <span className="text-xs text-slate-500 font-extrabold ml-1.5 uppercase tracking-wider">/ night</span>
                      </span>
                      {window._activeRoomOriginalPrice && window._activeRoomOriginalPrice > window._activeRoomPrice && (
                        <span className="text-[16px] text-slate-400 font-bold line-through">
                          ₹{window._activeRoomOriginalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-[10px] text-slate-700 font-extrabold bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                        + ₹{Math.round(window._activeRoomPrice * 0.12).toLocaleString('en-IN')} GST (12%)
                      </span>
                      <span className="text-[10px] text-emerald-800 font-black bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Total ₹{(window._activeRoomPrice + Math.round(window._activeRoomPrice * 0.12)).toLocaleString('en-IN')}/night
                      </span>
                    </div>

                    {window._activeRoomOriginalPrice && window._activeRoomOriginalPrice > window._activeRoomPrice && (
                      <div className="text-[12px] font-black text-[#008F5D] pt-0.5 uppercase tracking-wide">
                        You Save ₹{(window._activeRoomOriginalPrice - window._activeRoomPrice).toLocaleString('en-IN')}
                      </div>
                    )}

                    {/* Social Proof booking helper */}
                    <div className="text-[9.5px] text-slate-500 font-bold pt-1.5">
                      🔥 {selectedHotel.bookings_count || 18} bookings in the last 7 days
                    </div>
                  </div>

                  {/* Extra Discount Card (UPI) */}
                  {getUpiDiscountForHotel(selectedHotel) > 0 && (
                    <div className="bg-[#008F5D]/5 border border-[#008F5D]/10 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-3xs max-w-xs text-left">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center bg-[#008F5D]/10 text-[#008F5D] text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-md border border-[#008F5D]/20 w-fit">
                          UPI OFFER
                        </span>
                        <span className="text-[14px] font-black text-slate-950 leading-snug mt-1.5">
                          ₹{getUpiDiscountForHotel(selectedHotel)} Instant Discount
                        </span>
                        <span className="text-[9.5px] text-slate-500 font-bold mt-0.5">
                          Pay using UPI instantly & save extra
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* COMPETITOR PRICE COMPARISON / EXCLUSIVE LISTING CARD - Balanced 2-Column Row Layout */}
                {selectedHotel.competitor_price && Number(selectedHotel.competitor_price) > window._activeRoomPrice ? (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-emerald-50/90 border border-orange-200/80 text-left space-y-3 shadow-2xs w-full overflow-hidden">
                    {/* Row 1: Left = Best Price Guarantee Badge | Right = Green Savings Pill */}
                    <div className="flex items-center justify-between flex-wrap gap-2 w-full">
                      <span className="px-2.5 py-1 rounded-md bg-[#FF5F00] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs shrink-0">
                        BEST PRICE GUARANTEE
                      </span>
                      <span className="px-2 py-1 rounded-md bg-[#008F5D] text-white text-[9.5px] font-black tracking-wide shadow-2xs shrink-0 max-w-full truncate">
                        Save ₹{(Number(selectedHotel.competitor_price) - window._activeRoomPrice).toLocaleString('en-IN')} on TripGod
                      </span>
                    </div>

                    {/* Row 2: Left = Competitor Rate | Right = TripGod Rate */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-orange-200/50">
                      <div className="flex items-center gap-1 text-xs font-black text-slate-800">
                        <span>{selectedHotel.competitor_name || 'MakeMyTrip'} Today:</span>
                        <span className="line-through text-slate-400 font-extrabold ml-0.5">₹{Number(selectedHotel.competitor_price).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-black text-[#008F5D]">
                        <span>TripGod Rate:</span>
                        <span className="text-sm font-black text-slate-900">₹{window._activeRoomPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Row 3: Left = Footnote | Right = Direct Host Rate Badge */}
                    <div className="text-[9.5px] text-slate-500 font-semibold border-t border-orange-200/40 pt-2 flex items-center justify-between flex-wrap gap-1">
                      <span>*Live rates compared with public listed price on {selectedHotel.competitor_name || 'MakeMyTrip'} today for same room category.</span>
                      <span className="text-emerald-700 font-black uppercase tracking-wide text-[9px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md shrink-0">Direct Host Rate</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900 text-white text-left flex items-center justify-between flex-wrap gap-2 shadow-2xs w-full">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                        TripGod Exclusive
                      </span>
                      <span className="text-xs font-black text-slate-200">
                        Direct Host Rate Guarantee
                      </span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-semibold">
                      Not listed on MakeMyTrip or other OTAs
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION: ROOM UPGRADES & CATEGORIES */}
              {selectedHotel.rules?.room_categories && selectedHotel.rules.room_categories.length > 0 && (
                <div className="text-left" style={{
                  background: 'white',
                  borderRadius: '1.5rem',
                  padding: '1.25rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
                }}>
                  {/* Header */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '8px',
                      background: 'linear-gradient(135deg, #FF5F00, #ff8533)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(255,95,0,0.3)'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', color:'#1e293b', margin:0 }}>Select Room</h3>
                      <p style={{ fontSize:9, color:'#94a3b8', fontWeight:600, margin:0 }}>Choose your ideal room type</p>
                    </div>
                  </div>

                  {/* Cards Grid — always 2 columns */}
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem'}}>

                    {/* Standard Room Card */}
                    {(() => {
                      const isSelected = selectedRoomIdx === null;
                      const discount = selectedHotel.original_price && Number(selectedHotel.original_price) > Number(selectedHotel.price)
                        ? Math.round((1 - Number(selectedHotel.price)/Number(selectedHotel.original_price))*100) : null;
                      return (
                        <button
                          onClick={() => { setSelectedRoomIdx(null); setActiveImgIdx(0); }}
                          style={{
                            background: isSelected ? 'linear-gradient(135deg, #fff7f3, #fff3ee)' : '#f8fafc',
                            border: isSelected ? '2px solid #FF5F00' : '1.5px solid #e2e8f0',
                            borderRadius: '1rem',
                            padding: '0.875rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.22s ease',
                            boxShadow: isSelected ? '0 4px 20px rgba(255,95,0,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {isSelected && (
                            <div style={{
                              position:'absolute', top:8, right:8, background:'#FF5F00',
                              borderRadius:999, padding:'2px 8px',
                              fontSize:8, fontWeight:900, color:'white', letterSpacing:'0.05em', textTransform:'uppercase'
                            }}>Selected</div>
                          )}
                          {discount && (
                            <div style={{
                              position:'absolute', top: isSelected ? 28 : 8, right:8,
                              background:'#dcfce7', border:'1px solid #86efac',
                              borderRadius:999, padding:'2px 7px',
                              fontSize:8, fontWeight:900, color:'#16a34a', letterSpacing:'0.05em'
                            }}>{discount}% OFF</div>
                          )}
                          <div style={{marginBottom:'0.5rem'}}>
                            <span style={{display:'block', fontSize:10, fontWeight:900, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4}}>{selectedHotel.room_type || 'Standard Room'}</span>
                            <div style={{display:'flex', alignItems:'baseline', gap:6}}>
                              <span style={{fontSize:18, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em'}}>₹{Number(selectedHotel.price).toLocaleString('en-IN')}</span>
                              {selectedHotel.original_price && Number(selectedHotel.original_price) > Number(selectedHotel.price) && (
                                <span style={{fontSize:11, color:'#cbd5e1', textDecoration:'line-through'}}>₹{Number(selectedHotel.original_price).toLocaleString('en-IN')}</span>
                              )}
                            </div>
                            <span style={{display:'block', fontSize:9, fontWeight:800, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:4}}>Base Price Stay</span>
                          </div>
                          {selectedHotel.images && selectedHotel.images.length > 0 && (
                            <div style={{borderRadius:'0.6rem', overflow:'hidden', height:72, marginTop:6}}>
                              <img src={selectedHotel.images[0]} alt={selectedHotel.room_type || 'Standard Room'} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                            </div>
                          )}
                        </button>
                      );
                    })()}

                    {/* Upgrade Room Cards */}
                    {selectedHotel.rules.room_categories.map((room, rIdx) => {
                      const isSelected = selectedRoomIdx === rIdx;
                      const discount = room.original_price && Number(room.original_price) > Number(room.price)
                        ? Math.round((1 - Number(room.price)/Number(room.original_price))*100) : null;
                      const roomImages = Array.isArray(room.images) ? room.images : (room.images ? [room.images] : []);
                      return (
                        <button
                          key={rIdx}
                          onClick={() => { setSelectedRoomIdx(rIdx); setActiveImgIdx(0); }}
                          style={{
                            background: isSelected ? 'linear-gradient(135deg, #fff7f3, #fff3ee)' : '#f8fafc',
                            border: isSelected ? '2px solid #FF5F00' : '1.5px solid #e2e8f0',
                            borderRadius: '1rem',
                            padding: '0.875rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.22s ease',
                            boxShadow: isSelected ? '0 4px 20px rgba(255,95,0,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {isSelected && (
                            <div style={{
                              position:'absolute', top:8, right:8, background:'#FF5F00',
                              borderRadius:999, padding:'2px 8px',
                              fontSize:8, fontWeight:900, color:'white', letterSpacing:'0.05em', textTransform:'uppercase'
                            }}>Selected</div>
                          )}
                          {discount && (
                            <div style={{
                              position:'absolute', top: isSelected ? 28 : 8, right:8,
                              background:'#dcfce7', border:'1px solid #86efac',
                              borderRadius:999, padding:'2px 7px',
                              fontSize:8, fontWeight:900, color:'#16a34a', letterSpacing:'0.05em'
                            }}>{discount}% OFF</div>
                          )}
                          <div style={{marginBottom:'0.5rem'}}>
                            <span style={{display:'block', fontSize:10, fontWeight:900, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4}}>{room.name}</span>
                            <div style={{display:'flex', alignItems:'baseline', gap:6}}>
                              <span style={{fontSize:18, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em'}}>₹{Number(room.price).toLocaleString('en-IN')}</span>
                              {room.original_price && Number(room.original_price) > Number(room.price) && (
                                <span style={{fontSize:11, color:'#cbd5e1', textDecoration:'line-through'}}>₹{Number(room.original_price).toLocaleString('en-IN')}</span>
                              )}
                            </div>
                            <span style={{display:'block', fontSize:9, fontWeight:800, color:'#FF5F00', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:4}}>Upgrade Room</span>
                            {Array.isArray(room.features) && room.features.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                {room.features.map((feat, fIdx) => (
                                  <span key={fIdx} style={{ fontSize: 8, fontWeight: 800, color: '#FF5F00', background: '#fff0e5', border: '1px solid #ffd8c2', borderRadius: 4, padding: '1px 5px' }}>
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {roomImages.length > 0 && (
                            <div style={{borderRadius:'0.6rem', overflow:'hidden', height:72, marginTop:6}}>
                              <img src={roomImages[0]} alt={room.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: MEALS POLICY & ADD-ONS */}
              <DiningAndMealPanel selectedHotel={selectedHotel} selectedMeals={selectedMeals} setSelectedMeals={setSelectedMeals} />

              {/* SECTION: GUESTS & ROOMS */}
              <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                textAlign: 'left'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, #FF5F00, #ff8533)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255,95,0,0.3)', flexShrink: 0
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e293b', margin: 0 }}>Guests &amp; Rooms</h3>
                    <p style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, margin: 0 }}>Customize your stay</p>
                  </div>
                </div>

                {/* Counter rows */}
                {[
                  { label: 'Rooms', sub: 'Number of rooms needed', val: numRooms, min: Math.max(1, Math.ceil((numAdults + numKids) / (selectedHotel?.rules?.max_guests_per_room || 3))), max: 10, set: setNumRooms, icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF5F00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
                    </svg>
                  )},
                  { label: 'Adults', sub: '18+ years', val: numAdults, min: 1, max: 20, set: setNumAdults, icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
                    </svg>
                  )},
                  { label: 'Children', sub: '0–17 years (0–5 yrs stay free)', val: numKids, min: 0, max: 10, set: setNumKids, icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="9" r="3"/><path d="M12 12v3"/><path d="M9.5 17.5 12 15l2.5 2.5"/>
                    </svg>
                  )},
                ].map(({ label, sub, val, min, max, set, icon }, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.625rem 0',
                    borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>{icon}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{label}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{sub}</div>
                      </div>
                    </div>
                    {/* +/- Control */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <button
                        onClick={() => set(v => Math.max(min, v - 1))}
                        style={{
                          width: 32, height: 32, borderRadius: '8px 0 0 8px',
                          border: '1.5px solid #e2e8f0', borderRight: 'none',
                          background: val <= min ? '#f8fafc' : 'white',
                          cursor: val <= min ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: val <= min ? '#cbd5e1' : '#475569',
                          fontSize: 16, fontWeight: 900, transition: 'all 0.15s ease'
                        }}
                      >−</button>
                      <div style={{
                        minWidth: 36, height: 32, background: 'white',
                        border: '1.5px solid #e2e8f0', borderLeft: 'none', borderRight: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 900, color: '#0f172a'
                      }}>{val}</div>
                      <button
                        onClick={() => set(v => Math.min(max, v + 1))}
                        style={{
                          width: 32, height: 32, borderRadius: '0 8px 8px 0',
                          border: '1.5px solid #e2e8f0', borderLeft: 'none',
                          background: val >= max ? '#f8fafc' : 'white',
                          cursor: val >= max ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: val >= max ? '#cbd5e1' : '#FF5F00',
                          fontSize: 16, fontWeight: 900, transition: 'all 0.15s ease'
                        }}
                      >+</button>
                    </div>
                  </div>
                ))}

                {/* Mandatory Child Age Selection Dropdowns (MakeMyTrip style) */}
                {numKids > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-150 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider font-display flex items-center gap-1">
                        <Baby size={13} className="text-[#FF5F00]" />
                        <span>Select Age of Children (Mandatory)</span>
                      </span>
                      <span className="text-[8.5px] font-bold text-[#FF5F00] bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase">
                        Hotel Policy Check
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Array.from({ length: numKids }).map((_, idx) => {
                        const age = childAges[idx] !== undefined ? childAges[idx] : 3;
                        const isFree = age <= 5;
                        return (
                          <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex flex-col text-left shadow-3xs">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">
                              Child {idx + 1} Age
                            </label>
                            <select
                              value={age}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setChildAges(prev => {
                                  const updated = [...prev];
                                  updated[idx] = val;
                                  return updated;
                                });
                              }}
                              className="mt-1 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 px-2 py-1.5 focus:outline-none focus:border-[#FF5F00] cursor-pointer"
                            >
                              {Array.from({ length: 18 }).map((_, aIdx) => (
                                <option key={aIdx} value={aIdx}>
                                  {aIdx === 0 ? '< 1 Yr (Infant)' : `${aIdx} Year${aIdx > 1 ? 's' : ''} Old`}
                                </option>
                              ))}
                            </select>
                            {isFree ? (
                              <span className="text-[8.5px] text-emerald-600 font-extrabold mt-1 leading-none">
                                ✓ Free Stay (No extra bed)
                              </span>
                            ) : (
                              <span className="text-[8.5px] text-amber-600 font-extrabold mt-1 leading-none">
                                ⚠ Extra mattress fee at check-in
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Capacity hint */}
                {(() => {
                  const maxPerRoom = selectedHotel.rules?.max_guests_per_room || 3;
                  const totalGuests = numAdults + numKids;
                  const neededRooms = Math.ceil(totalGuests / maxPerRoom);
                  const isUnder = numRooms < neededRooms;
                  return (
                    <div style={{
                      marginTop: 12, padding: '0.625rem 0.75rem',
                      borderRadius: '0.75rem',
                      background: isUnder ? '#fff7ed' : '#f0fdf4',
                      border: `1px solid ${isUnder ? '#fed7aa' : '#bbf7d0'}`,
                      display: 'flex', alignItems: 'flex-start', gap: 7
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isUnder ? '#ea580c' : '#16a34a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4"/><path d="M12 16h.01"/>
                      </svg>
                      <span style={{ fontSize: 10, fontWeight: 700, color: isUnder ? '#c2410c' : '#15803d', lineHeight: 1.4 }}>
                        {isUnder
                          ? `${totalGuests} guests need at least ${neededRooms} room${neededRooms > 1 ? 's' : ''} — please add ${neededRooms - numRooms} more room${neededRooms - numRooms > 1 ? 's' : ''}.`
                          : `${numRooms} room${numRooms > 1 ? 's' : ''} · ${numAdults} adult${numAdults > 1 ? 's' : ''} · ${numKids} child${numKids !== 1 ? 'ren' : ''} — looks good!`
                        }
                      </span>
                    </div>
                  );
                })()}

                {/* Dynamic Child Check-in Extra Bed Note */}
                {numKids > 0 && childAges.some(a => a >= 6) && (
                  <div className="mt-2.5 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2 text-left shadow-3xs">
                    <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-amber-900 font-semibold leading-relaxed">
                      <strong>Hotel Mattress Policy:</strong> Children 6–17 yrs stay on existing bed or extra mattress.
                      {selectedHotel.rules?.extra_bed_charge ? (
                        <span> Extra mattress charge of <strong>₹{selectedHotel.rules.extra_bed_charge}/night</strong> will be paid directly at hotel reception upon check-in.</span>
                      ) : (
                        <span> Extra mattress charge (if requested) will be paid directly at hotel reception upon check-in.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Price breakdown */}
                <div style={{
                  marginTop: 12, padding: '0.75rem',
                  background: '#f8fafc', borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Price Breakdown / Night
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 4 }}>
                    <span>₹{window._activeRoomPrice?.toLocaleString('en-IN')} × {numRooms} room{numRooms > 1 ? 's' : ''}</span>
                    <span>₹{window._roomCostPerNight?.toLocaleString('en-IN')}</span>
                  </div>
                  {window._mealCostPerNight > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 4 }}>
                      <span>Meal add-ons × {numAdults + numKids} guests</span>
                      <span>₹{window._mealCostPerNight?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#0f172a', fontWeight: 900 }}>
                    <span>Total / night</span>
                    <span style={{ color: '#FF5F00' }}>₹{window._totalPricePerNight?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginTop: 3, textAlign: 'right' }}>
                    + taxes &amp; fees at checkout
                  </div>
                </div>
              </div>

              {/* SECTION 4: WHY GUESTS CHOOSE THIS HOTEL CARD */}
              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3.5 shadow-3xs text-left select-none">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-[#FF5F00] fill-[#FF5F00]" />
                  <h4 className="text-xs font-black uppercase text-black tracking-wider font-display">Why Guests Choose This Hotel</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-[#008F5D] shrink-0 stroke-[2.5]" />
                    <span>Prime Location</span>
                  </span>
                  <span className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-[#008F5D] shrink-0 stroke-[2.5]" />
                    <span>Free Cancellation</span>
                  </span>
                  <span className="flex items-center gap-2 text-slate-700">
                    <Check size={14} className="text-[#008F5D] shrink-0 stroke-[2.5]" />
                    <span>Best Value Stay</span>
                  </span>
                  <span className="flex items-center gap-2 text-[#008F5D]">
                    <Check size={14} className="text-[#008F5D] shrink-0 stroke-[2.5]" />
                    <span>Verified by TripGod</span>
                  </span>
                </div>
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
                      className="text-[#FF5F00] font-black text-xs uppercase tracking-wider transition-colors cursor-pointer mt-1 bg-transparent border-none p-0 flex items-center gap-1"
                    >
                      <span>{isDescExpanded ? 'Read Less' : 'Read More'}</span>
                      <span>→</span>
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
                        const IconComponent = getAmenityIcon(key);
                        const label = formatAmenityLabel(key);
                        return (
                          <div
                            key={key}
                            className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center hover:bg-white hover:border-[#FF5F00]/25 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 group min-w-[115px] max-w-[125px] shrink-0 cursor-pointer select-none"
                          >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-black/5 text-gray-500 group-hover:text-[#FF5F00] group-hover:bg-[#FF5F00]/5 transition-colors mb-2 shadow-sm">
                              <IconComponent size={18} />
                            </div>
                            <span className="text-[11px] font-extrabold text-gray-700 capitalize tracking-tight leading-tight group-hover:text-black text-center whitespace-normal line-clamp-2 h-[28px] flex items-center justify-center w-full">
                              {label}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
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
                      <div key={pf} className="flex items-center gap-2 p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-[#FF5F00]/20 transition-all shadow-3xs">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/5 text-[#FF5F00] flex items-center justify-center border border-[#FF5F00]/10 shrink-0">
                          <Icon size={16} />
                        </div>
                        <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight whitespace-normal line-clamp-2 w-full">{pf}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 7: PROPERTY LOCATION & ATTRACTIONS MERGED (FAMOUS PLACES NEAR HOTEL) */}
              <div className="space-y-4 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs text-left select-none">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display flex items-center gap-1">
                      <span>📍</span> Famous Places Near Hotel
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                      {selectedHotel.address}
                    </span>
                  </div>
                  {selectedHotel.maps_link && (
                    <a 
                      href={formatExternalUrl(selectedHotel.maps_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3.5 bg-[#008F5D] hover:bg-[#007A4F] text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-sm text-decoration-none w-fit shrink-0 cursor-pointer animate-none"
                    >
                      <MapPin size={12} />
                      <span>Open in Google Maps</span>
                    </a>
                  )}
                </div>
                
                {/* List of attractions with distances */}
                <div className="divide-y divide-slate-100">
                  {(() => {
                    const attractionsList = (selectedHotel.attractions && selectedHotel.attractions.length > 0)
                      ? selectedHotel.attractions
                      : (selectedHotel.landmarks && selectedHotel.landmarks.length > 0
                        ? selectedHotel.landmarks.map(l => {
                            const name = sanitizeHighlightText(l);
                            let distance = '1.5 km';
                            if (name.toLowerCase().includes('ram')) distance = '1.8 km';
                            else if (name.toLowerCase().includes('laxman')) distance = '2.4 km';
                            else if (name.toLowerCase().includes('isbt')) distance = '4.9 km';
                            else if (name.toLowerCase().includes('triveni')) distance = '3.1 km';
                            else if (name.toLowerCase().includes('parmarth')) distance = '3.4 km';
                            else if (name.toLowerCase().includes('beatles')) distance = '4.0 km';
                            else if (name.toLowerCase().includes('neelkanth')) distance = '18 km';
                            return { name, distance };
                          })
                        : [
                            { name: 'Ram Jhula', distance: '1.8 km' },
                            { name: 'Laxman Jhula', distance: '2.4 km' },
                            { name: 'Triveni Ghat', distance: '3.1 km' },
                            { name: 'Parmarth Niketan', distance: '3.4 km' },
                            { name: 'Beatles Ashram', distance: '4.0 km' },
                            { name: 'Neelkanth Temple', distance: '18 km' }
                          ]);

                    return attractionsList.map((attraction, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 first:pt-1 last:pb-1">
                        <div className="flex items-center gap-2.5">
                          <MapPin size={14} className="text-[#008F5D] shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block leading-tight">{attraction.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold block mt-0.5">{attraction.distance}</span>
                          </div>
                        </div>
                        <a 
                          href={formatExternalUrl(attraction.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name + ' Rishikesh')}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-black text-[#008F5D] border border-[#008F5D]/30 hover:border-[#008F5D] hover:bg-[#008F5D]/5 px-3 py-1.5 rounded-lg transition-colors text-decoration-none shadow-3xs"
                        >
                          View Map →
                        </a>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* SECTION: PROPERTY TIMINGS & SCHEDULE */}
              <div className="bg-gradient-to-r from-orange-50/70 via-amber-50/60 to-orange-50/40 p-4 border border-orange-200/60 rounded-3xl text-left border-t border-gray-100 pt-5">
                <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider font-display flex items-center gap-1.5 mb-3">
                  <Clock size={15} className="text-[#FF5F00]" />
                  <span>Property Timings & Schedule</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white/90 rounded-2xl border border-orange-100 shadow-3xs flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Check-In Time</span>
                    <span className="text-xs font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      {selectedHotel.check_in || '12:00 PM'}
                    </span>
                  </div>
                  <div className="p-3 bg-white/90 rounded-2xl border border-orange-100 shadow-3xs flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Check-Out Time</span>
                    <span className="text-xs font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      {selectedHotel.check_out || '11:00 AM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 11: HOUSE RULES & CHILD POLICY & CANCELLATION POLICY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 text-left">
                {/* Child & Extra Bed Policy */}
                <div className="space-y-3 bg-sky-50/40 p-5 border border-sky-200/60 rounded-3xl shadow-3xs">
                  <h4 className="text-xs font-black uppercase text-sky-900 tracking-wider font-display flex items-center gap-1.5">
                    <Baby size={15} className="text-sky-600 shrink-0" />
                    <span>Child Policy</span>
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-start gap-2 bg-white/90 p-2 rounded-xl border border-sky-100/80 shadow-3xs">
                      <span className="bg-sky-100 text-sky-800 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 mt-0.5">0–5 Yrs</span>
                      <span className="leading-tight text-slate-800 font-semibold text-[10.5px]">
                        <strong>Free Stay</strong> (without extra bed). Max 2 kids stay free per room.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 bg-white/90 p-2 rounded-xl border border-sky-100/80 shadow-3xs">
                      <span className="bg-emerald-100 text-emerald-800 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 mt-0.5">6–11 Yrs</span>
                      <span className="leading-tight text-slate-800 font-semibold text-[10.5px]">
                        <strong>Free Stay</strong> on existing bed. Extra mattress chargeable at hotel reception if required.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 bg-white/90 p-2 rounded-xl border border-sky-100/80 shadow-3xs">
                      <span className="bg-amber-100 text-amber-900 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 mt-0.5">12+ Yrs</span>
                      <span className="leading-tight text-slate-800 font-semibold text-[10.5px]">
                        Considered an <strong>Adult</strong>.
                      </span>
                    </div>
                  </div>
                </div>

                {selectedHotel.rules && Object.keys(selectedHotel.rules).length > 0 && (
                  <div className="space-y-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                    <h4 className="text-xs font-black uppercase text-[#0d1b2a] tracking-wider font-display">House Rules</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-655 font-bold">
                      {selectedHotel.rules?.accepts_local_id !== false && (
                        <div key="local_id_accepted" className="flex items-center gap-1.5 p-2 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-emerald-900 font-extrabold">
                          <Check size={12} className="text-emerald-600 shrink-0 stroke-[2.5]" />
                          <span className="truncate text-[10px] sm:text-xs leading-none">Local ID Accepted</span>
                        </div>
                      )}
                      {Object.entries(selectedHotel.rules)
                        .filter(([key, val]) => {
                          const knownKeys = ['unmarried_couples', 'pets', 'smoking', 'id_required', 'min_age_18', 'alcohol_allowed', 'visitors_allowed'];
                          return knownKeys.includes(key) && !!val;
                        })
                        .map(([key]) => {
                          const labelMap = {
                            unmarried_couples: 'Couples Allowed',
                            pets: 'Pets Allowed',
                            smoking: 'Smoking Allowed',
                            id_required: 'Govt ID Required',
                            min_age_18: '18+ Age Limit',
                            alcohol_allowed: 'Alcohol Allowed',
                            visitors_allowed: 'Outside Visitors'
                          };
                          const ruleLabel = labelMap[key];
                          return (
                            <div key={key} className="flex items-center gap-1.5 p-2 bg-slate-50/40 rounded-xl border border-black/5">
                              <Check size={12} className="text-emerald-600 shrink-0 stroke-[2.5]" />
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
              <div className="border-t border-gray-100 pt-4 pb-2">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider font-display mb-4">TripGod Trust Benefits</h4>
                <div className="flex flex-col gap-2">
                  {(selectedHotel.benefits && selectedHotel.benefits.length > 0 ? selectedHotel.benefits : [
                    { icon: 'Lock', title: 'Secure Payment', desc: 'Protected by Razorpay SECURE payment gateway' },
                    { icon: 'CalendarCheck', title: 'Instant Booking', desc: 'Hotel room voucher sent immediately to WhatsApp/Email' },
                    { icon: 'RefreshCw', title: 'Easy Refund', desc: 'No-hassle cancellation & quick automatic refunds' },
                    { icon: 'HelpCircle', title: '24×7 Support', desc: '24/7 on-ground assistance & direct guide network' },
                    { icon: 'ShieldCheck', title: 'Verified Partners', desc: 'Every stay is handpicked, inspected, and verified' },
                  ]).map((benefit, idx) => {
                    const Icon = BENEFIT_ICONS[benefit.icon] || ShieldCheck;
                    return (
                      <div key={idx} className="flex flex-row items-center gap-2.5 p-2 bg-slate-50/50 border border-black/5 rounded-xl shadow-3xs">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-3xs shrink-0">
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[11px] font-black text-black leading-none mb-0.5">{benefit.title}</span>
                          <span className="text-[9px] text-gray-500 font-semibold leading-relaxed">{benefit.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Book Actions button */}
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                {checkIfClosed(selectedHotel).closed ? (
                  <button
                    disabled
                    className="w-full py-4 bg-gray-300 text-gray-500 font-black text-xs uppercase tracking-wider rounded-xl border-none cursor-not-allowed text-center font-display"
                  >
                    Closed Temporarily
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const hotelToBook = selectedHotel;
                        const activeRoomName = selectedRoomIdx !== null 
                          ? (hotelToBook.rules?.room_categories?.[selectedRoomIdx]?.name || 'Upgrade Room') 
                          : (hotelToBook.room_type || 'Standard Room');
                        openBookingModal({
                          id: hotelToBook.id,
                          name: hotelToBook.name,
                          price: window._totalPricePerNight || window._activeRoomPrice || Number(hotelToBook.price),
                          room_price: window._activeRoomPrice || Number(hotelToBook.price),
                          num_rooms: numRooms,
                          num_adults: numAdults,
                          num_kids: numKids,
                          child_ages: childAges,
                          extra_bed_charge: hotelToBook.rules?.extra_bed_charge || 0,
                          meal_cost_per_night: window._mealCostPerNight || 0,
                          selected_meals: selectedMeals,
                          category: 'hotels',
                          city_id: hotelToBook.city_id,
                          vendor_id: hotelToBook.vendor_id,
                          vendors: hotelToBook.vendors,
                          mapLink: hotelToBook.google_maps_link || hotelToBook.map_link || hotelToBook.vendors?.google_maps_link,
                          google_maps_link: hotelToBook.google_maps_link || hotelToBook.map_link || hotelToBook.vendors?.google_maps_link,
                          fullAddress: hotelToBook.address || hotelToBook.location,
                          address: hotelToBook.address || hotelToBook.location,
                          operatorPhone: hotelToBook.whatsapp_number || hotelToBook.phone_number || hotelToBook.vendors?.phone,
                          phone_number: hotelToBook.whatsapp_number || hotelToBook.phone_number || hotelToBook.vendors?.phone,
                          payment_mode: hotelToBook.payment_mode,
                          commission_percentage: hotelToBook.commission_percentage,
                          fixed_advance_amount: hotelToBook.fixed_advance_amount,
                          upi_discount: hotelToBook.upi_discount,
                          whatsapp_number: hotelToBook.whatsapp_number || hotelToBook.whatsapp || hotelToBook.vendors?.whatsapp || hotelToBook.vendors?.phone || hotelToBook.phone_number,
                          slots: [`${activeRoomName} (Check-in 12:00 PM)`, 'Early Check-in (Subject to Availability)'],
                          is_closed: hotelToBook.is_closed,
                          closed_reason: hotelToBook.closed_reason,
                          closed_from: hotelToBook.closed_from,
                          closed_until: hotelToBook.closed_until
                        });
                      }}
                      className="w-full bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-[13px] uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all border-none cursor-pointer text-center font-display flex flex-col items-center justify-center h-[54px] pt-1"
                    >
                      <span className="leading-tight">BOOK NOW →</span>
                      <span className="text-[9px] text-orange-200 font-bold leading-tight mt-0.5">Instant Confirmation</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sticky Bottom Bar for booking stay */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-black/10 p-3 sm:p-4 z-40 flex items-center justify-between max-w-4xl mx-auto rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
              <div>
                <span className="block text-[9px] text-gray-550 uppercase font-black tracking-wider truncate max-w-[120px] sm:max-w-[220px]">
                  {selectedHotel.name} · {numRooms} room{numRooms > 1 ? 's' : ''} · {numAdults + numKids} guest{numAdults + numKids !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base sm:text-lg font-black text-black">
                    ₹{(window._totalPricePerNight || Number(selectedHotel.price)).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9.5px] text-slate-700 font-extrabold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                    + ₹{(window._gstAmountPerNight || Math.round(Number(selectedHotel.price)*0.12)).toLocaleString('en-IN')} GST
                  </span>
                  {window._mealCostPerNight > 0 && (
                    <span className="text-[9px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded">
                      incl. meals
                    </span>
                  )}
                </div>
                <span className="text-[9.5px] text-emerald-700 font-black block -mt-0.5">
                  Total ₹{(window._grandTotalWithGstPerNight || (Number(selectedHotel.price) + Math.round(Number(selectedHotel.price)*0.12))).toLocaleString('en-IN')} / night (incl. 12% GST)
                </span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {checkIfClosed(selectedHotel).closed ? (
                  <button
                    disabled
                    className="py-3 px-5 sm:px-6 bg-gray-300 text-gray-500 text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-not-allowed font-display"
                  >
                    Closed
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const hotelToBook = selectedHotel;
                      const activeRoomName = selectedRoomIdx !== null 
                        ? (hotelToBook.rules?.room_categories?.[selectedRoomIdx]?.name || 'Upgrade Room') 
                        : (hotelToBook.room_type || 'Standard Room');
                      openBookingModal({
                        id: hotelToBook.id,
                        name: hotelToBook.name,
                        price: window._totalPricePerNight || window._activeRoomPrice || Number(hotelToBook.price),
                        room_price: window._activeRoomPrice || Number(hotelToBook.price),
                        num_rooms: numRooms,
                        num_adults: numAdults,
                        num_kids: numKids,
                        meal_cost_per_night: window._mealCostPerNight || 0,
                        selected_meals: selectedMeals,
                        category: 'hotels',
                        city_id: hotelToBook.city_id,
                        vendor_id: hotelToBook.vendor_id,
                        vendors: hotelToBook.vendors,
                        mapLink: hotelToBook.google_maps_link || hotelToBook.map_link || hotelToBook.vendors?.google_maps_link,
                        google_maps_link: hotelToBook.google_maps_link || hotelToBook.map_link || hotelToBook.vendors?.google_maps_link,
                        fullAddress: hotelToBook.address || hotelToBook.location,
                        address: hotelToBook.address || hotelToBook.location,
                        operatorPhone: hotelToBook.whatsapp_number || hotelToBook.phone_number || hotelToBook.vendors?.phone,
                        phone_number: hotelToBook.whatsapp_number || hotelToBook.phone_number || hotelToBook.vendors?.phone,
                        payment_mode: hotelToBook.payment_mode,
                        commission_percentage: hotelToBook.commission_percentage,
                        fixed_advance_amount: hotelToBook.fixed_advance_amount,
                        upi_discount: hotelToBook.upi_discount,
                        whatsapp_number: hotelToBook.whatsapp_number || hotelToBook.whatsapp || hotelToBook.vendors?.whatsapp || hotelToBook.vendors?.phone || hotelToBook.phone_number,
                        slots: [`${activeRoomName} (Check-in 12:00 PM)`, 'Early Check-in (Subject to Availability)'],
                        is_closed: hotelToBook.is_closed,
                        closed_reason: hotelToBook.closed_reason,
                        closed_from: hotelToBook.closed_from,
                        closed_until: hotelToBook.closed_until
                      });
                    }}
                    className="py-3.5 px-6 sm:px-8 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display h-[48px] flex flex-col items-center justify-center pt-1"
                  >
                    <span className="leading-none">BOOK NOW →</span>
                    <span className="text-[8px] text-orange-200 font-bold leading-none mt-0.5">Instant Confirmation</span>
                  </button>
                )}
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
