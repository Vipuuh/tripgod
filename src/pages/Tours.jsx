import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Calendar, ShieldCheck, Waves, ChevronLeft, Star, 
  ChevronDown, ChevronUp, Check, X, Hotel, Car, Utensils, Compass, 
  Flame, Footprints, Moon, Sun, ShoppingBag, Eye, Tag, Info, Ticket, 
  Headphones, CheckCircle2, Phone, MessageSquare, Zap, Users, Shield, 
  Award, Sparkles, HelpCircle, ArrowRight, CreditCard, Headset
} from 'lucide-react';
import { supabase } from '../supabase';

const stripEmojis = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1F000}-\u{1F0DF}]/gu, '')
    .replace(/[\u{1F0E0}-\u{1F0FF}]/gu, '')
    .replace(/[\u{1F100}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F200}-\u{1F2FF}]/gu, '')
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();
};

const getTagIcon = (tag, iconClass = "w-5 h-5 text-slate-500 shrink-0") => {
  const cleaned = stripEmojis(tag).toLowerCase();
  if (cleaned.includes('stay') || cleaned.includes('camp') || cleaned.includes('hotel') || cleaned.includes('tent')) {
    return <Hotel className={iconClass} />;
  }
  if (cleaned.includes('cab') || cleaned.includes('car') || cleaned.includes('drive') || cleaned.includes('pickup') || cleaned.includes('transfer') || cleaned.includes('return')) {
    return <Car className={iconClass} />;
  }
  if (cleaned.includes('meals') || cleaned.includes('breakfast') || cleaned.includes('dinner') || cleaned.includes('food') || cleaned.includes('cuisine') || cleaned.includes('lunch')) {
    return <Utensils className={iconClass} />;
  }
  if (cleaned.includes('driver') || cleaned.includes('guide') || cleaned.includes('orientation') || cleaned.includes('local')) {
    return <Compass className={iconClass} />;
  }
  if (cleaned.includes('bonfire')) {
    return <Flame className={iconClass} />;
  }
  if (cleaned.includes('trek') || cleaned.includes('hiking') || cleaned.includes('walk')) {
    return <Footprints className={iconClass} />;
  }
  if (cleaned.includes('night') || cleaned.includes('stargazing') || cleaned.includes('sky')) {
    return <Moon className={iconClass} />;
  }
  if (cleaned.includes('shopping')) {
    return <ShoppingBag className={iconClass} />;
  }
  if (cleaned.includes('sightseeing') || cleaned.includes('view') || cleaned.includes('photo') || cleaned.includes('spots') || cleaned.includes('darshan') || cleaned.includes('aarti')) {
    return <Eye className={iconClass} />;
  }
  return <Tag className={iconClass} />;
};

const getLucideIcon = (iconName) => {
  switch (iconName) {
    case 'Ticket':
      return <Ticket className="w-5 h-5 text-[#FF5722]" />;
    case 'Shield':
      return <ShieldCheck className="w-5 h-5 text-[#FF5722]" />;
    case 'Headset':
      return <Headphones className="w-5 h-5 text-[#FF5722]" />;
    case 'Hotel':
      return <Hotel className="w-5 h-5 text-[#FF5722]" />;
    case 'Car':
      return <Car className="w-5 h-5 text-[#FF5722]" />;
    case 'Utensils':
      return <Utensils className="w-5 h-5 text-[#FF5722]" />;
    case 'Compass':
      return <Compass className="w-5 h-5 text-[#FF5722]" />;
    default:
      return <CheckCircle2 className="w-5 h-5 text-[#FF5722]" />;
  }
};

const getMockItinerary = (tourName, duration) => {
  if (tourName.toLowerCase().includes('kedarnath')) {
    return [
      {
        day: 1,
        title: 'Rishikesh to Guptkashi',
        tags: ['Pickup', 'Luxury Camp', 'Bonfire'],
        description: 'Drive from Rishikesh to Guptkashi along the Ganges and Mandakini rivers. Arrive, check into luxury camps, and enjoy a warm bonfire in the evening.'
      },
      {
        day: 2,
        title: 'Guptkashi to Kedarnath',
        tags: ['Kedarnath Trek', 'Temple Stay', 'Evening Aarti'],
        description: 'Early morning drive to Sonprayag/Gaurikund, then start the 16km trek to Kedarnath. Check into guest house near the temple and attend the divine evening Aarti.'
      },
      {
        day: 3,
        title: 'Kedarnath to Guptkashi',
        tags: ['Morning Darshan', 'Trek Down', 'Hotel Stay'],
        description: 'Wake up early for the morning Abhishek and Darshan of Lord Kedarnath. Trek down to Gaurikund and drive back to Guptkashi for hotel check-in and rest.'
      },
      {
        day: 4,
        title: 'Guptkashi to Rishikesh',
        tags: ['Return Drive', 'Devprayag', 'Drop-off'],
        description: 'Drive back to Rishikesh, visiting Devprayag confluence on the way. Tour ends with drop-off at Rishikesh railway station or your preferred hotel.'
      }
    ];
  } else if (tourName.toLowerCase().includes('chopta') || tourName.toLowerCase().includes('tungnath')) {
    return [
      {
        day: 1,
        title: 'Rishikesh to Chopta',
        tags: ['Scenic Drive', 'Alpine Camp', 'Stargazing'],
        description: 'Drive from Rishikesh to Chopta, the mini Switzerland of Uttarakhand. Stay in alpine tents under the starry skies.'
      },
      {
        day: 2,
        title: 'Chopta to Tungnath & Chandrashila',
        tags: ['Summit Trek', 'Himalayan View', 'Bonfire Night'],
        description: 'Trek 4km to Tungnath Temple and a further 1.5km to Chandrashila Peak for stunning 360-degree views of the Garhwal Himalayas. Return to camp for a cozy bonfire.'
      },
      {
        day: 3,
        title: 'Chopta to Rishikesh',
        tags: ['Drive Back', 'Devprayag', 'Farewell'],
        description: 'Drive back to Rishikesh via Devprayag confluence. Tour concludes with drop-off at your location.'
      }
    ];
  } else {
    const daysMatch = duration.match(/(\d+)\s*Day/i);
    const numDays = daysMatch ? parseInt(daysMatch[1], 10) : 3;
    const items = [];
    for (let i = 1; i <= numDays; i++) {
      if (i === 1) {
        items.push({
          day: 1,
          title: 'Arrival & Setup',
          tags: ['Pickup', 'Hotel Check-in', 'Orientation'],
          description: 'Arrival at the starting point, transfer to your premium accommodation, briefing session, and rest.'
        });
      } else if (i === numDays) {
        items.push({
          day: i,
          title: 'Return Journey',
          tags: ['Drive Back', 'Souvenir Shopping', 'Drop-off'],
          description: 'Enjoy a scenic breakfast, pack bags, visit local landmarks on the way back, and get dropped off at your destination.'
        });
      } else {
        items.push({
          day: i,
          title: `Sightseeing & Adventure - Day ${i}`,
          tags: ['Guided Trek', 'Photo Spots', 'Local Cuisine'],
          description: `Full day of guided sightseeing, visiting major spots, clicking photos, and enjoying delicious local meals.`
        });
      }
    }
    return items;
  }
};

export default function Tours({ currentCity, openBookingModal, selectedTour, setSelectedTour, navigateTo }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkIfClosed = (item) => {
    if (!item) return { closed: false };
    if (item.is_closed) {
      return { closed: true, reason: item.closed_reason || 'Monsoon season / government advisory', reopenDate: item.closed_until };
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

  const [expandedDays, setExpandedDays] = useState({ 0: true });
  const [costTab, setCostTab] = useState('included');
  const [expandedFAQs, setExpandedFAQs] = useState({});
  const [filterDestination, setFilterDestination] = useState('');
  const [filterBudget, setFilterBudget] = useState('All');
  const [filterDuration, setFilterDuration] = useState('All');
  const [filterTourType, setFilterTourType] = useState('All');

  const toggleDay = (idx) => {
    setExpandedDays(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleFAQ = (idx) => {
    setExpandedFAQs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSelectTour = (tour) => {
    setSelectedTour(tour);
    window.history.pushState(null, '', `/tours/${tour.id}`);
  };

  useEffect(() => {
    if (window.location.pathname === '/tours' || window.location.pathname === '/tours/') {
      setSelectedTour(null);
    }
    const fetchTours = async () => {
      setLoading(true);
      try {
        let query = supabase.from('tours').select('*, vendors(*)');
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (data) {
          const mapped = data.map((item, idx) => ({
            ...item,
            rating: item.vendors?.star_rating || item.rating || Number((4.5 + ((idx * 4) % 5) / 10).toFixed(1)),
            reviewsCount: item.reviews_count || (80 + ((idx * 41) % 150))
          }));
          setTours(mapped);
        }
      } catch (err) {
        console.error('Error fetching tours:', err);
        // Fallback demo tours if DB not ready
        setTours([
          {
            id: 'demo-tour-1',
            name: 'Rishikesh to Kedarnath Pilgrimage',
            description: 'A sacred 4 Days / 3 Nights guided yatra to the ancient Kedarnath Temple starting from Rishikesh. Includes luxury transfers, stay, and VIP darshan slips.',
            price: 9500,
            duration: '4 Days / 3 Nights',
            images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600'],
            cancellation_policy: '100% refund up to 72h prior.',
            rating: 4.8,
            reviewsCount: 198,
            quick_info_tags: ['Stay Included', 'Private AC Cab', 'Meals Included', 'Local Driver'],
            reporting_address: 'Reporting Address: TripGod Office, Near Ram Jhula Parking, Rishikesh',
            inclusions: [
              'Accommodation in deluxe hotels/camps on twin sharing basis',
              'All transfers and sightseeing by private air-conditioned cab',
              'Daily breakfast and dinner (MAP plan) at all locations',
              'Services of a professional local driver/guide for the entire tour',
              'All toll taxes, parking fees, state taxes, and driver allowances'
            ],
            exclusions: [
              'Any meals/beverages other than those mentioned in inclusions',
              'Tips to driver, guide, hotel staff, or helpers',
              'Any entrance tickets to monuments, temples, or parks',
              'Personal expenses like laundry, phone calls, shopping, medical bills',
              'Any cost arising due to natural disasters, landslides, or road blocks'
            ],
            day_wise_itinerary: [
              {
                day: 1,
                title: 'Rishikesh to Guptkashi',
                tags: ['Pickup', 'Luxury Camp', 'Bonfire'],
                description: 'Drive from Rishikesh to Guptkashi along the Ganges and Mandakini rivers. Arrive, check into luxury camps, and enjoy a warm bonfire in the evening.'
              },
              {
                day: 2,
                title: 'Guptkashi to Kedarnath',
                tags: ['Kedarnath Trek', 'Temple Stay', 'Evening Aarti'],
                description: 'Early morning drive to Sonprayag/Gaurikund, then start the 16km trek to Kedarnath. Check into guest house near the temple and attend the divine evening Aarti.'
              },
              {
                day: 3,
                title: 'Kedarnath to Guptkashi',
                tags: ['Morning Darshan', 'Trek Down', 'Hotel Stay'],
                description: 'Wake up early for the morning Abhishek and Darshan of Lord Kedarnath. Trek down to Gaurikund and drive back to Guptkashi for hotel check-in and rest.'
              },
              {
                day: 4,
                title: 'Guptkashi to Rishikesh',
                tags: ['Return Drive', 'Devprayag', 'Drop-off'],
                description: 'Drive back to Rishikesh, visiting Devprayag confluence on the way. Tour ends with drop-off at Rishikesh railway station or your preferred hotel.'
              }
            ]
          },
          {
            id: 'demo-tour-2',
            name: 'Chopta Tungnath Valley Trek',
            description: 'Explore the mini Switzerland of Uttarakhand. Trek to the highest Shiva temple in the world (Tungnath) and see majestic Chandrashila peaks.',
            price: 5500,
            duration: '3 Days / 2 Nights',
            images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600'],
            cancellation_policy: '100% refund up to 48h prior.',
            rating: 4.7,
            reviewsCount: 110,
            quick_info_tags: ['Alpine Stay', 'Private AC Cab', 'Meals Included', 'Local Guide'],
            reporting_address: 'Reporting Address: TripGod Activity Desk, Tapovan Bypass Road, Rishikesh',
            inclusions: [
              'Accommodation in premium alpine tents in Chopta',
              'All transfers and sightseeing by private air-conditioned cab',
              'All meals (Breakfast, Lunch, Dinner) during camping',
              'Professional certified trekking guide/leader',
              'All forest entry permits, camping charges, and driver allowance'
            ],
            exclusions: [
              'Any personal gear (trekking poles, warm jackets, boots)',
              'Tips to guide, driver, or camp staff',
              'Mineral water, alcoholic drinks, or laundry expenses',
              'Emergency medical evacuation or rescue charges'
            ],
            day_wise_itinerary: [
              {
                day: 1,
                title: 'Rishikesh to Chopta',
                tags: ['Scenic Drive', 'Alpine Camp', 'Stargazing'],
                description: 'Drive from Rishikesh to Chopta, the mini Switzerland of Uttarakhand. Stay in alpine tents under the starry skies.'
              },
              {
                day: 2,
                title: 'Chopta to Tungnath & Chandrashila',
                tags: ['Summit Trek', 'Himalayan View', 'Bonfire Night'],
                description: 'Trek 4km to Tungnath Temple and a further 1.5km to Chandrashila Peak for stunning 360-degree views of the Garhwal Himalayas. Return to camp for a cozy bonfire.'
              },
              {
                day: 3,
                title: 'Chopta to Rishikesh',
                tags: ['Drive Back', 'Devprayag', 'Farewell'],
                description: 'Drive back to Rishikesh via Devprayag confluence. Tour concludes with drop-off at your location.'
              }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [currentCity]);

  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      if (path.startsWith('/tours/')) {
        const tourId = path.substring('/tours/'.length);
        if (tourId && tourId !== 'partners') {
          if (tours.length > 0) {
            const matched = tours.find(t => t.id === tourId);
            if (matched) {
              setSelectedTour(matched);
            }
          }
        }
      } else {
        setSelectedTour(null);
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [tours]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-black space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#FF5F00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <span className="text-[10px] uppercase font-black tracking-widest text-[#FF5F00]">Loading Tours...</span>
      </div>
    );
  }

  const getGroupedTours = () => {
    const grouped = {};
    tours.forEach(t => {
      const key = t.name;
      if (!grouped[key]) {
        grouped[key] = {
          id: t.id,
          name: t.name,
          description: t.description,
          duration: t.duration,
          img: t.images && t.images.length > 0 ? t.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600',
          minPrice: Number(t.price),
          rating: t.rating || 4.7,
          reviewsCount: t.reviewsCount || 120,
          inclusions: t.inclusions || [],
          exclusions: t.exclusions || [],
          quick_info_tags: t.quick_info_tags || null,
          day_wise_itinerary: t.day_wise_itinerary || t.itinerary || null,
          reporting_address: t.reporting_address || '',
          why_book_with_us: t.why_book_with_us || null,
          is_free_cancellation: t.is_free_cancellation || false,
          is_limited_seats: t.is_limited_seats || false,
          tour_highlights: t.tour_highlights || [],
          route_map: t.route_map || [],
          stay_details: t.stay_details || null,
          pickup_drop: t.pickup_drop || null,
          landmarks_data: t.landmarks_data || [],
          faq_data: t.faq_data || [],
          is_verified: t.is_verified !== undefined && t.is_verified !== null ? t.is_verified : true,
          is_bestseller: t.is_bestseller || false,
          is_instant_confirmation: t.is_instant_confirmation !== undefined && t.is_instant_confirmation !== null ? t.is_instant_confirmation : true,
          is_closed: t.is_closed || false,
          closed_reason: t.closed_reason || '',
          closed_from: t.closed_from || '',
          closed_until: t.closed_until || '',
          seats_left: t.seats_left !== undefined && t.seats_left !== null ? t.seats_left : 10,
          bookings_count: t.bookings_count !== undefined && t.bookings_count !== null ? t.bookings_count : 150,
          hotel_included: t.hotel_included !== undefined && t.hotel_included !== null ? t.hotel_included : true,
          meals_included: t.meals_included !== undefined && t.meals_included !== null ? t.meals_included : true,
          transport_included: t.transport_included !== undefined && t.transport_included !== null ? t.transport_included : true,
          guide_included: t.guide_included !== undefined && t.guide_included !== null ? t.guide_included : true,
          tour_type: t.tour_type || 'Sightseeing',
          next_batch: t.next_batch || '15 July',
          difficulty: t.difficulty || 'Moderate',
          group_type: t.group_type || 'Group Tour',
          perfect_for: t.perfect_for || [],
          city_id: t.city_id,
          operators: []
        };
      }
      if (Number(t.price) < grouped[key].minPrice) {
        grouped[key].minPrice = Number(t.price);
      }
      grouped[key].operators.push(t);
    });
    return Object.values(grouped);
  };

  const groupedList = getGroupedTours();

  const getFilteredGroupedList = () => {
    return groupedList.filter(tour => {
      // 1. Destination Filter
      if (filterDestination && filterDestination.trim() !== '') {
        const destLower = filterDestination.toLowerCase().trim();
        const matchesName = tour.name.toLowerCase().includes(destLower);
        const matchesDesc = tour.description.toLowerCase().includes(destLower);
        if (!matchesName && !matchesDesc) return false;
      }

      // 2. Budget Filter
      if (filterBudget !== 'All') {
        const budgetLimit = Number(filterBudget);
        if (tour.minPrice > budgetLimit) return false;
      }

      // 3. Duration Filter
      if (filterDuration !== 'All') {
        const daysMatch = tour.duration.match(/(\d+)\s*Day/i);
        const numDays = daysMatch ? parseInt(daysMatch[1], 10) : 3;
        if (filterDuration === '1-2' && numDays > 2) return false;
        if (filterDuration === '3-4' && (numDays < 3 || numDays > 4)) return false;
        if (filterDuration === '5+' && numDays < 5) return false;
      }

      // 4. Tour Type Filter
      if (filterTourType !== 'All') {
        const typeLower = filterTourType.toLowerCase();
        const tourTypeLower = (tour.tour_type || 'Sightseeing').toLowerCase();
        if (tourTypeLower !== typeLower) return false;
      }

      return true;
    });
  };

  const filteredGroupedList = getFilteredGroupedList();

  if (selectedTour) {
    const infoTags = selectedTour.quick_info_tags || ['Stay Included', 'Private AC Cab', 'Meals Included', 'Local Driver'];
    const rawItinerary = selectedTour.day_wise_itinerary || selectedTour.itinerary || [];
    const itineraryData = rawItinerary.length > 0 ? rawItinerary : getMockItinerary(selectedTour.name, selectedTour.duration);
    
    const inclusions = selectedTour.inclusions || [];
    const exclusions = selectedTour.exclusions || [];

    const displayInclusions = inclusions.length > 0 ? inclusions : [
      'Accommodation in deluxe hotels/camps on twin sharing basis',
      'All transfers and sightseeing by private air-conditioned cab',
      'Daily breakfast and dinner (MAP plan) at all locations',
      'Services of a professional local driver/guide for the entire tour',
      'All toll taxes, parking fees, state taxes, and driver allowances'
    ];
    const displayExclusions = exclusions.length > 0 ? exclusions : [
      'Any meals/beverages other than those mentioned in inclusions',
      'Tips to driver, guide, hotel staff, or helpers',
      'Any entrance tickets to monuments, temples, or parks',
      'Personal expenses like laundry, phone calls, shopping, medical bills',
      'Any cost arising due to natural disasters, landslides, or road blocks'
    ];

    const tourId = selectedTour.id || (selectedTour.operators?.[0]?.id) || 'demo-tour-1';

    const cheapestOp = selectedTour.operators?.find(op => Number(op.price) === selectedTour.minPrice) || selectedTour.operators?.[0] || selectedTour;
    const price = Number(cheapestOp.price || selectedTour.minPrice || 0);
    const originalPrice = cheapestOp.original_price ? Number(cheapestOp.original_price) : Math.round(price * 1.3);
    const discountPercent = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    
    // Images list
    const imagesList = selectedTour.images || cheapestOp.images || [];
    const displayImages = imagesList.length > 0 ? imagesList : [selectedTour.img];

    const parseJSONSafely = (data, defaultValue = {}) => {
      if (!data) return defaultValue;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        return defaultValue;
      }
    };

    const stayDetails = parseJSONSafely(selectedTour.stay_details, { hotel_name: "", photos: [], amenities: [], room_type: "" });
    const pickupDrop = parseJSONSafely(selectedTour.pickup_drop, { pickup_point: "", drop_point: "", reporting_time: "", coordinator_number: "" });
    const landmarks = Array.isArray(selectedTour.landmarks_data) ? selectedTour.landmarks_data : parseJSONSafely(selectedTour.landmarks_data, []);
    const faqData = Array.isArray(selectedTour.faq_data) ? selectedTour.faq_data : parseJSONSafely(selectedTour.faq_data, []);
    const tourHighlights = Array.isArray(selectedTour.tour_highlights) ? selectedTour.tour_highlights : (selectedTour.tour_highlights ? [selectedTour.tour_highlights] : []);
    const routeMap = Array.isArray(selectedTour.route_map) ? selectedTour.route_map : [];

    const getAsArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    return (
      <div className="w-full min-h-screen bg-slate-50 pb-32 font-sans text-left text-slate-800">
        {/* Navigation header */}
        <div className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedTour(null);
                window.history.pushState(null, '', '/tours');
              }}
              className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider hover:text-[#FF5722] cursor-pointer border-none bg-transparent"
            >
              <ChevronLeft size={16} /> Back to Packages
            </button>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Package Details
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {checkIfClosed(selectedTour).closed && (
            <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-800 rounded-3xl flex flex-col gap-1.5 text-left shadow-sm">
              <span className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5 text-red-700">
                ⚠️ TOUR PILGRIMAGE TEMPORARILY CLOSED
              </span>
              <p className="text-xs font-semibold leading-relaxed">
                This sacred yatra package is currently closed: {checkIfClosed(selectedTour).reason}
              </p>
              {checkIfClosed(selectedTour).reopenDate && (
                <span className="text-[10px] bg-red-100 text-red-700 font-black uppercase px-2.5 py-1 rounded-lg mt-1 w-max">
                  Expected Reopening: {new Date(checkIfClosed(selectedTour).reopenDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          )}

          {/* Two-column layout grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Main Column: 2 spans */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Premium Image Gallery */}
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2">
                  <div className={`h-64 md:h-96 overflow-hidden rounded-2xl ${displayImages.length >= 2 ? 'md:col-span-2' : 'md:col-span-3'}`}>
                    <img 
                      src={displayImages[0]} 
                      alt={selectedTour.name} 
                      className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" 
                    />
                  </div>
                  {displayImages.length >= 2 && (
                    <div className="hidden md:flex flex-col gap-2 h-96">
                      <div className="flex-1 overflow-hidden rounded-xl">
                        <img 
                          src={displayImages[1]} 
                          alt={selectedTour.name} 
                          className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" 
                        />
                      </div>
                      {displayImages.length >= 3 ? (
                        <div className="flex-1 overflow-hidden rounded-xl">
                          <img 
                            src={displayImages[2]} 
                            alt={selectedTour.name} 
                            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" 
                          />
                        </div>
                      ) : (
                        <div className="flex-1 bg-slate-50 flex items-center justify-center rounded-xl border border-slate-100">
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">TripGod Verified</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tour Title Section */}
                <div className="p-6 md:p-8 space-y-4 border-t border-slate-100">
  {/* Pricing Widget */}
  <div id="price-widget" className="flex flex-col gap-2 bg-[#FF5722]/5 p-4 rounded-xl border border-[#FF5722]/10">
    <span className="text-xs uppercase font-black text-[#FF5722]">Starting From</span>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black text-[#FF5722]">₹{price.toLocaleString('en-IN')}</span>
      {originalPrice > price && (
        <span className="text-sm line-through text-slate-400 font-medium">₹{originalPrice.toLocaleString('en-IN')}</span>
      )}
      {discountPercent > 0 && (
        <span className="text-xs font-black uppercase text-[#FF5722] bg-[#FF5722]/10 px-2 py-0.5 rounded">Save {discountPercent}% OFF</span>
      )}
    </div>
    <span className="text-xs text-slate-600">Per Person</span>
  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                        <ShieldCheck size={12} className="text-emerald-600" />
                        <span>TripGod Verified</span>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                        <Zap size={12} className="text-amber-500" />
                        <span>Instant Confirmation</span>
                      </div>

                      {selectedTour.is_free_cancellation && (
                        <div className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                          <Check size={12} className="text-green-600" />
                          <span>Free Cancellation</span>
                        </div>
                      )}

                      {selectedTour.is_limited_seats && (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                          <Users size={12} className="text-red-500" />
                          <span>Limited Seats</span>
                        </div>
                      )}
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight pt-1">
                      {selectedTour.name}
                    </h1>
  {/* Difficulty Badge */}
  {selectedTour.difficulty && (
    <div className={`mt-2 inline-block px-3 py-1 text-xs font-black uppercase rounded-full border ${
      selectedTour.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-700 border-green-200' :
      selectedTour.difficulty.toLowerCase() === 'moderate' ? 'bg-amber-100 text-amber-700 border-amber-200' :
      'bg-red-100 text-red-700 border-red-200'
    }`}>{selectedTour.difficulty}</div>
  )}

                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 pt-1">
                      <div className="flex items-center gap-1 bg-slate-100/60 px-2.5 py-1 rounded-xl border border-slate-200/50">
                        <Clock size={14} className="text-[#FF5722]" />
                        <span>{selectedTour.duration}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100/60 px-2.5 py-1 rounded-xl border border-slate-200/50">
                        <MapPin size={14} className="text-[#FF5722]" />
                        <span>Starts from {currentCity?.name || 'Rishikesh'}</span>
                      </div>
                      <div className="flex flex-col text-left pl-3 border-l border-slate-200">
                        <div className="flex items-center gap-1 text-sm font-extrabold text-slate-800">
                          <Star size={14} className="fill-amber-500 text-amber-500" />
                          <span>{selectedTour.rating}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{selectedTour.reviewsCount} Reviews</span>
                      </div>
  {/* Route Display */}
  {routeMap.length > 0 && (
    <div id="route-display" className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-2">
      {routeMap.map((point, idx) => (
        <React.Fragment key={idx}>
          <span className="font-black">{point}</span>
          {idx < routeMap.length - 1 && <ArrowRight size={12} className="text-slate-400" />}
        </React.Fragment>
      ))}
    </div>
  )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedTour.description}
                  </p>

                  {/* Small Highlights */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className="flex items-center gap-1 text-xs font-black text-slate-700">
                      <Hotel size={14} className="text-[#FF5722]" />
                      <span>Hotel Included</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-black text-slate-700">
                      <Utensils size={14} className="text-[#FF5722]" />
                      <span>Breakfast + Dinner</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-black text-slate-700">
                      <Car size={14} className="text-[#FF5722]" />
                      <span>Transfers Included</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-black text-slate-700">
                      <Users size={14} className="text-[#FF5722]" />
                      <span>Guide Available</span>
                    </div>
                  </div>

                  {/* Who is this tour perfect for? */}
                  {selectedTour.perfect_for && selectedTour.perfect_for.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 text-left">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-display">
                        <Users className="text-[#FF5722]" size={14} />
                        Who is this tour perfect for?
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTour.perfect_for.map((item, idx) => (
                          <span 
                            key={idx} 
                            className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1"
                          >
                            <Sparkles size={10} className="text-indigo-500 animate-pulse" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info Tags Ribbon */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                    {infoTags.map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-xs text-slate-700 font-bold shadow-xs">
                        {getTagIcon(tag, "w-4 h-4 text-slate-500 shrink-0")}
                        <span>{stripEmojis(tag)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trust Section: Why Travelers Choose This Tour */}
              <div className="bg-white shadow-sm rounded-3xl p-6 md:p-8 border border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 font-display flex items-center gap-2">
                  <Award className="text-[#FF5722]" size={18} />
                  Why Travelers Choose This Tour
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(tourHighlights.length > 0 ? tourHighlights : [
                    "100% Verified Local Operators with experienced mountain drivers",
                    "Premium handpicked accommodation (deluxe camps & hotels)",
                    "No hidden charges: all tolls, green cess, and driver allowance included",
                    "24/7 on-trip emergency coordinate desk support"
                  ]).map((hl, idx) => (
                    <div key={idx} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="p-1 bg-[#10B981]/10 rounded-lg h-fit text-emerald-600 shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-950 uppercase tracking-wide">
                          Feature #{idx + 1}
                        </p>
                        <p className="text-xs text-slate-650 font-medium leading-relaxed">
                          {hl.startsWith('✓') ? hl.substring(1).trim() : hl}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Route Map Timeline */}
              {routeMap.length > 0 && (
                <div className="bg-white shadow-sm rounded-3xl p-6 md:p-8 border border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 font-display flex items-center gap-2">
                    <Compass className="text-[#FF5722]" size={18} />
                    Route Map & Destination Sequence
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {routeMap.map((point, pIdx) => (
                      <React.Fragment key={pIdx}>
                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 flex items-center gap-1.5 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center text-[10px] font-black">{pIdx + 1}</span>
                          <span>{point}</span>
                        </div>
                        {pIdx < routeMap.length - 1 && (
                          <ArrowRight size={14} className="text-slate-400 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Timeline Itinerary */}
              <div className="bg-white shadow-sm rounded-3xl p-6 md:p-8 border border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 font-display flex items-center gap-2">
                  <Calendar className="text-[#FF5722]" size={18} />
                  Detailed Day-Wise Itinerary
                </h3>
                
                <div className="relative pl-6 md:pl-8 border-l-2 border-dashed border-[#FF5722]/30 space-y-8 ml-2 text-left">
                  {itineraryData.map((day, idx) => {
                    const meals = getAsArray(day.meals);
                    const activities = getAsArray(day.activities);
                    const dayImages = getAsArray(day.images);

                    return (
                      <div key={idx} className="relative space-y-3">
                        {/* Timeline Circle Node */}
                        <div className="absolute -left-[35px] md:-left-[43px] top-0.5 w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#FF5722] text-white flex items-center justify-center text-[10px] md:text-xs font-black shadow-md border-2 border-white ring-4 ring-[#FF5722]/10">
                          {idx + 1}
                        </div>

                        {/* Title Row */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#FF5722] font-black uppercase tracking-widest block text-left">
                            DAY {day.day || idx + 1}
                          </span>
                          <h4 className="text-sm md:text-base font-extrabold text-slate-900 uppercase tracking-tight text-left">
                            {day.title || 'Sightseeing'}
                          </h4>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 font-medium leading-relaxed text-left">
                          {day.description}
                        </p>

                        {/* Day Metadata Cards */}
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {/* Stay details */}
                          {(day.stay || stayDetails?.hotel_name) && idx === 0 && (
                            <div className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-100 text-sky-800 px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-xs">
                              <Hotel size={12} className="text-sky-600 shrink-0" />
                              <span>Stay: {day.stay || stayDetails.hotel_name}</span>
                            </div>
                          )}
                          {day.stay && idx > 0 && (
                            <div className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-100 text-sky-800 px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-xs">
                              <Hotel size={12} className="text-sky-600 shrink-0" />
                              <span>Stay: {day.stay}</span>
                            </div>
                          )}

                          {/* Meals details */}
                          {meals.length > 0 && (
                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-xs">
                              <Utensils size={12} className="text-emerald-600 shrink-0" />
                              <span>Meals: {meals.join(', ')}</span>
                            </div>
                          )}

                          {/* Activities details */}
                          {activities.length > 0 && (
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-800 px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-xs">
                              <Compass size={12} className="text-amber-600 shrink-0" />
                              <span>Activities: {activities.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Day Photos Grid */}
                        {dayImages.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto py-2 pr-4 scrollbar-thin">
                            {dayImages.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} className="w-24 h-16 md:w-32 md:h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-sm animate-fade-in">
                                <img src={imgUrl} alt={`Day ${idx + 1} view`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stay Preview Section */}
              {stayDetails?.hotel_name && (
                <div className="bg-white shadow-sm rounded-3xl p-6 md:p-8 border border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 font-display flex items-center gap-2">
                    <Hotel className="text-[#FF5722]" size={18} />
                    Hotel & Accommodation Details
                  </h3>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="text-left">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          {stayDetails.hotel_name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
                          {stayDetails.room_type || 'Premium Deluxe Room'}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded-md w-fit">
                        <Check size={10} strokeWidth={3} /> Double Sharing Included
                      </span>
                    </div>

                    {/* Stay Amenities */}
                    {stayDetails.amenities && getAsArray(stayDetails.amenities).length > 0 && (
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Stay Amenities</span>
                        <div className="flex flex-wrap gap-1.5">
                          {getAsArray(stayDetails.amenities).map((am, amIdx) => (
                            <span key={amIdx} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs">
                              {am}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stay Photos */}
                    {stayDetails.photos && getAsArray(stayDetails.photos).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                        {getAsArray(stayDetails.photos).map((photo, phIdx) => (
                          <div key={phIdx} className="h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                            <img src={photo} alt="Hotel preview" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pickup & Drop transfers widget */}
              {(pickupDrop?.pickup_point || pickupDrop?.drop_point || pickupDrop?.reporting_time) && (
                <div className="bg-white shadow-sm rounded-3xl p-6 md:p-8 border border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 font-display flex items-center gap-2">
                    <Car className="text-[#FF5722]" size={18} />
                    Reporting & Transfer Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pickupDrop.pickup_point && (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 text-left">
                        <span className="text-[9px] text-[#FF5722] font-black uppercase tracking-widest block">PICKUP POINT</span>
                        <p className="text-xs font-extrabold text-slate-900 leading-snug">{pickupDrop.pickup_point}</p>
                      </div>
                    )}
                    {pickupDrop.drop_point && (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 text-left">
                        <span className="text-[9px] text-[#FF5722] font-black uppercase tracking-widest block">DROP POINT</span>
                        <p className="text-xs font-extrabold text-slate-900 leading-snug">{pickupDrop.drop_point}</p>
                      </div>
                    )}
                    {pickupDrop.reporting_time && (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 text-left">
                        <span className="text-[9px] text-[#FF5722] font-black uppercase tracking-widest block">REPORTING TIME</span>
                        <p className="text-xs font-extrabold text-slate-900 leading-snug">{pickupDrop.reporting_time}</p>
                      </div>
                    )}
                    {pickupDrop.coordinator_number && (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 text-left">
                        <span className="text-[9px] text-[#FF5722] font-black uppercase tracking-widest block">ON-TRIP COORDINATOR</span>
                        <a href={`tel:${pickupDrop.coordinator_number}`} className="inline-flex items-center gap-1 text-xs font-black text-slate-900 hover:text-[#FF5722] underline pt-0.5">
                          <Phone size={12} className="text-[#FF5722]" /> Call Coordinator
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Inclusions & Exclusions Tabs */}
              <div className="bg-white shadow-sm rounded-3xl p-6 md:p-8 border border-slate-100">
                <div className="flex border-b border-slate-100 mb-6">
                  <button
                    type="button"
                    onClick={() => setCostTab('included')}
                    className={`flex-1 pb-3 text-center text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                      costTab === 'included'
                        ? 'border-[#FF5722] text-[#FF5722]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    What's Included
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostTab('excluded')}
                    className={`flex-1 pb-3 text-center text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                      costTab === 'excluded'
                        ? 'border-[#FF5722] text-[#FF5722]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    What's Excluded
                  </button>
                </div>

                {costTab === 'included' ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-bold list-none p-0 m-0 text-left">
                    {displayInclusions.map((item, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="bg-green-50 text-green-600 rounded-full p-0.5 w-5 h-5 flex items-center justify-center shrink-0 border border-green-200">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-bold list-none p-0 m-0 text-left">
                    {displayExclusions.map((item, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="bg-red-50 text-red-650 rounded-full p-0.5 w-5 h-5 flex items-center justify-center shrink-0 border border-red-200">
                          <X size={12} strokeWidth={3} />
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Nearby Landmarks Grid */}
              {landmarks.length > 0 && (
                <div className="bg-white shadow-sm rounded-3xl p-6 md:p-8 border border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 font-display flex items-center gap-2">
                    <MapPin className="text-[#FF5722]" size={18} />
                    Nearby Attractions & Landmarks
                  </h3>
                  <div className="overflow-hidden border border-slate-150 rounded-2xl bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-750 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider">
                          <th className="p-3.5 pl-4">Location Name</th>
                          <th className="p-3.5">Distance</th>
                          <th className="p-3.5">Travel Time</th>
                          <th className="p-3.5 pr-4 text-right">Directions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-650 font-medium">
                        {landmarks.map((mark, mIdx) => (
                          <tr key={mIdx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3.5 pl-4 font-bold text-slate-900">{mark.name}</td>
                            <td className="p-3.5">{mark.distance || 'N/A'}</td>
                            <td className="p-3.5">{mark.time || 'N/A'}</td>
                            <td className="p-3.5 pr-4 text-right">
                              {mark.maps_url ? (
                                <a
                                  href={mark.maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-[#FF5722]/10 text-[#FF5722] hover:bg-[#FF5722]/20 px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  Map View
                                </a>
                              ) : (
                                <span className="text-slate-400 text-[10px]">No link</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FAQs accordion section */}
              <div className="bg-white shadow-sm rounded-3xl p-6 md:p-8 border border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 font-display flex items-center gap-2">
                  <HelpCircle className="text-[#FF5722]" size={18} />
                  Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  {(faqData.length > 0 ? faqData : [
                    {
                      question: "How is the cancellation handled?",
                      answer: selectedTour.cancellation_policy || "Refunds are processed based on the operator guidelines. Contact support for instant yatra cancellations."
                    },
                    {
                      question: "Are guides provided?",
                      answer: "Yes, certified local coordinators and local mountain guides will manage safety briefings during treks."
                    },
                    {
                      question: "Are tolls and state taxes included in the pricing?",
                      answer: "Absolutely. Under our TripGod promise, all green taxes, toll permits, and local charges are 100% covered."
                    }
                  ]).map((faq, fIdx) => {
                    const isOpen = !!expandedFAQs[fIdx];
                    return (
                      <div key={fIdx} className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                        <button
                          onClick={() => toggleFAQ(fIdx)}
                          className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-none cursor-pointer"
                        >
                          <span className="text-xs font-black text-slate-800 pr-4">
                            {faq.question}
                          </span>
                          <span className="text-slate-400 shrink-0">
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-655 font-medium leading-relaxed">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guidelines Box */}
              {selectedTour.tour_guidelines && selectedTour.tour_guidelines.length > 0 && (
                <div className="bg-amber-50/30 border border-amber-100 rounded-3xl p-6 shadow-sm text-left">
                  <h3 className="text-xs sm:text-sm font-black text-amber-900 uppercase tracking-wider mb-4 font-display flex items-center gap-2">
                    <Info size={16} className="text-amber-600" />
                    Important Tour Guidelines
                  </h3>
                  <ul className="space-y-2.5 list-none p-0 m-0">
                    {selectedTour.tour_guidelines.map((guideline, gIdx) => (
                      <li key={gIdx} className="flex gap-2.5 items-start text-xs text-amber-800 font-bold leading-normal">
                        <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                        <span>{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* TripGod Promise checklist */}
              <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-100">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-3 font-display">
                  TripGod Promise: ₹1 Extra Nahi Dena
                </h3>
                <div className="flex gap-2.5 items-start bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-xs text-slate-700 font-bold text-left">
                  <span className="bg-emerald-100 text-[#10B981] rounded-full p-1.5 shrink-0 border border-emerald-250">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-emerald-800 font-black uppercase text-[10px] tracking-wider">All Tolls, Taxes, and Driver Allowances Included</p>
                    <p className="text-[11px] text-emerald-650 font-medium mt-1 leading-relaxed">
                      No hidden charges, parking fees, or driver stay charges. The price you book at is final.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Floating Sidebar Book Now widget (sticky on desktop) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-20 bg-white shadow-md border border-slate-100 rounded-3xl p-6 space-y-6">
                
                {/* Price Summary */}
                <div className="space-y-2 pb-5 border-b border-slate-100 text-left">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Packages starting from</span>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₹{price.toLocaleString('en-IN')}</span>
                    {originalPrice > price && (
                      <span className="text-base text-slate-400 line-through font-bold">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {discountPercent > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#FF5722] bg-[#FF5722]/10 border border-[#FF5722]/20 px-2.5 py-1 rounded-md mt-1">
                      Save {discountPercent}% OFF
                    </span>
                  )}
                  
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    *Price shown is the starting rate of the cheapest verified operator.
                  </p>
                </div>

                {/* Trust Highlights */}
                <div className="space-y-3.5 text-xs text-slate-650 font-medium text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>No Hidden Charges (Toll & State Tax Included)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Instant voucher confirmation desk</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Verified local coordinator matching</span>
                  </div>
                </div>

                {/* Primary CTA */}
                {checkIfClosed(selectedTour).closed ? (
                  <button
                    disabled
                    className="w-full py-4 bg-gray-300 text-gray-500 font-black text-xs uppercase tracking-widest rounded-xl border-none cursor-not-allowed font-display text-center block"
                  >
                    TEMPORARILY CLOSED
                  </button>
                ) : (
                  <button
                    onClick={() => navigateTo(`tours/${tourId}/partners`)}
                    className="w-full py-4 bg-[#FF5722] hover:bg-[#E54A18] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg border-none font-display text-center block"
                  >
                    SELECT LOCAL OPERATOR
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sticky bottom bar (Mobile/Tablet only) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-150 p-4 z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4">
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Starts from</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900">₹{price.toLocaleString('en-IN')}</span>
              {originalPrice > price && (
                <span className="text-xs text-slate-400 line-through font-bold">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <span className="text-[8px] font-black text-[#FF5722] uppercase tracking-wider block mt-0.5">
                {discountPercent}% OFF Package
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Call desk */}
            <a
              href="tel:+918630027341"
              className="p-3 bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#FF5722] rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center"
            >
              <Phone size={16} />
            </a>
            
            {/* WhatsApp */}
            <a
              href={`https://wa.me/918630027341?text=Hi%2C%20I'm%20interested%20in%2520booking%2520the%2520${encodeURIComponent(selectedTour.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-slate-50 border border-slate-200 text-slate-700 hover:text-emerald-500 rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center"
            >
              <MessageSquare size={16} />
            </a>

            {/* Select Partner */}
            {checkIfClosed(selectedTour).closed ? (
              <button
                disabled
                className="py-3 px-5 bg-gray-300 text-gray-500 font-black text-xs uppercase tracking-wider rounded-xl border-none cursor-not-allowed shrink-0 font-display"
              >
                Closed
              </button>
            ) : (
              <button
                onClick={() => navigateTo(`tours/${tourId}/partners`)}
                className="py-3 px-5 bg-[#FF5722] hover:bg-[#E54A18] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm font-display border-none shrink-0"
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] bg-slate-50 flex flex-col py-12 font-sans text-left text-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Banner */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-black font-display text-slate-900 uppercase tracking-tight">
            TOUR PACKAGES
          </h1>
          <div className="w-20 h-1 bg-[#FF5F00] mx-auto mt-1" />
          <p className="text-gray-500 max-w-lg mx-auto text-xs sm:text-sm font-semibold pt-1 leading-relaxed text-center">
            Book complete guided tours, pilgrimages, and trekking yatras across Uttarakhand starting from {currentCity?.name || 'Rishikesh'}.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 py-4 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full border border-[#FF5722]/20">
            <ShieldCheck size={12} className="text-[#FF5722]" /> VERIFIED OPERATORS
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full border border-[#10B981]/20">
            <CreditCard size={12} className="text-[#10B981]" /> SECURE PAYMENT
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full border border-[#FF5722]/20">
            <Headset size={12} className="text-[#FF5722]" /> 24X7 SUPPORT
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF5722] bg-[#FF5722]/10 px-3 py-1 rounded-full border border-[#FF5722]/20">
            <Zap size={12} className="text-[#FF5722]" /> INSTANT CONFIRMATION
          </div>
        </div>
        {/* Filter Section */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <input
            type="text"
            placeholder="Destination"
            value={filterDestination}
            onChange={e => setFilterDestination(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
          />
          <select
            value={filterBudget}
            onChange={e => setFilterBudget(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
          >
            <option value="All">All Budgets</option>
            <option value="5000">Up to ₹5,000</option>
            <option value="10000">Up to ₹10,000</option>
            <option value="20000">Up to ₹20,000</option>
            <option value="50000">Up to ₹50,000</option>
          </select>
          <select
            value={filterDuration}
            onChange={e => setFilterDuration(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
          >
            <option value="All">All Durations</option>
            <option value="1-2">1‑2 Days</option>
            <option value="3-4">3‑4 Days</option>
            <option value="5+">5+ Days</option>
          </select>
          <select
            value={filterTourType}
            onChange={e => setFilterTourType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
          >
            <option value="All">All Types</option>
            <option value="Sightseeing">Sightseeing</option>
            <option value="Pilgrimage">Pilgrimage</option>
            <option value="Trekking">Trekking</option>
          </select>
        </div>
        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGroupedList.map((tour, idx) => {
            const hasMultiple = tour.operators.length > 1;
            const hasDiscount = tour.operators.some(op => op.original_price && Number(op.original_price) > Number(op.price));
            const originalPriceToShow = hasDiscount ? Math.max(...tour.operators.map(op => Number(op.original_price || 0))) : Math.round(tour.minPrice * 1.3);
            const discountPercentage = Math.round(((originalPriceToShow - tour.minPrice) / originalPriceToShow) * 100);

            // Determine overlay badges (max 2)
            const overlayBadges = [];
            if (tour.is_verified) {
              overlayBadges.push({
                label: 'Verified Operator',
                bg: 'bg-emerald-600',
                icon: <ShieldCheck size={9} />
              });
            }
            if (tour.seats_left <= 5 || tour.is_limited_seats) {
              overlayBadges.push({
                label: 'Fast Filling',
                bg: 'bg-red-600',
                icon: <Zap size={9} fill="currentColor" />
              });
            }
            if (tour.rating >= 4.7) {
              overlayBadges.push({
                label: 'Top Rated',
                bg: 'bg-indigo-650',
                icon: <Star size={9} fill="currentColor" />
              });
            }
            if (discountPercentage >= 20) {
              overlayBadges.push({
                label: 'Best Price',
                bg: 'bg-blue-600',
                icon: <Tag size={9} />
              });
            }
            const displayBadges = overlayBadges.slice(0, 2);

            return (
              <motion.div
                key={tour.name || idx}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md border border-slate-100 transition-all duration-300 group cursor-pointer relative"
                onClick={() => handleSelectTour(tour)}
              >
                {/* Image & Badges overlay */}
                <div className="h-52 overflow-hidden relative bg-slate-100">
                  <img 
                    src={tour.img} 
                    alt={tour.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  {checkIfClosed(tour).closed && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                      <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-md">
                        Closed
                      </span>
                    </div>
                  )}

                  {/* Top-left Badges (Max 2) */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 items-start">
                    {displayBadges.map((badge, bIdx) => (
                      <span key={bIdx} className={`${badge.bg} text-white text-[8px] font-black py-1 px-2.5 rounded-md shadow-sm tracking-wider flex items-center gap-1`}>
                        {badge.icon} {badge.label.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  {/* Bottom Overlays */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                    {tour.is_bestseller && (
                      <span className="bg-[#FF5722] text-white text-[8px] font-black py-1 px-2.5 rounded-md shadow-md tracking-wider">
                        🔥 BESTSELLER
                      </span>
                    )}
                    {tour.seats_left <= 8 && (
                      <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-black py-1 px-2.5 rounded-md shadow-sm tracking-wider">
                        ONLY {tour.seats_left} SEATS LEFT
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    
                    {/* Rating Area and Bookings count */}
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1 text-sm font-extrabold text-slate-800">
                          <Star size={14} className="fill-amber-500 text-amber-500" />
                          <span>{tour.rating}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{tour.reviewsCount} Reviews</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
                          🔥 {tour.bookings_count}+ booked
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-base font-display text-slate-900 tracking-tight group-hover:text-[#FF5722] transition-colors leading-tight line-clamp-1 uppercase text-left">
                      {tour.name}
                    </h3>

                    {/* Route Flow sequence */}
                    {tour.route_map && tour.route_map.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#FF5722] text-left pt-0.5">
                        <span className="truncate">{tour.route_map.join(' → ')}</span>
                      </div>
                    )}
                    
                    {/* Description */}
                    <p className="text-xs text-slate-550 leading-relaxed font-medium line-clamp-2 text-left pt-0.5">
                      {tour.description}
                    </p>

                    {/* Specifications Ribbon */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-slate-50 pb-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                        <span>🗓</span>
                        <span>{tour.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                        <span>📍</span>
                        <span>Ex {currentCity?.name || 'Rishikesh'}</span>
                      </div>
                      {tour.difficulty && (
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            tour.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            tour.difficulty === 'Moderate' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {tour.difficulty}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Inclusions checklists trust row */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1 text-[11px] font-bold text-slate-600">
                      {tour.hotel_included && (
                        <div className="flex items-center gap-1.5 text-left">
                          <span className="text-emerald-500 font-bold">✔</span>
                          <span>Hotel Included</span>
                        </div>
                      )}
                      {tour.meals_included && (
                        <div className="flex items-center gap-1.5 text-left">
                          <span className="text-emerald-500 font-bold">✔</span>
                          <span>Meals Included</span>
                        </div>
                      )}
                      {tour.transport_included && (
                        <div className="flex items-center gap-1.5 text-left">
                          <span className="text-emerald-500 font-bold">✔</span>
                          <span>Transfers Included</span>
                        </div>
                      )}
                      {tour.guide_included && (
                        <div className="flex items-center gap-1.5 text-left">
                          <span className="text-emerald-500 font-bold">✔</span>
                          <span>Guide Available</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Price and CTA Row */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-auto pt-4 gap-3">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Starting From</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-lg font-extrabold text-slate-900">₹{tour.minPrice.toLocaleString('en-IN')}</span>
                      {originalPriceToShow && (
                        <span className="text-xs text-slate-400 line-through font-bold">
                          ₹{originalPriceToShow.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {discountPercentage > 0 && (
                        <span className="bg-red-50 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {discountPercentage}% OFF
                        </span>
                      )}
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Per Person</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTour(tour);
                    }}
                    className="px-4 py-3 bg-[#FF5722] hover:bg-[#E54A18] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer text-center font-display whitespace-nowrap shadow-sm hover:shadow-md"
                  >
                    {hasMultiple ? 'Compare Operators' : 'View Operators'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredGroupedList.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-505 font-medium space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-[#FF5722]">
              <Compass size={24} />
            </div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-wider">No matching packages found</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">We couldn't find any tour packages matching your search filters. Try clearing filters or searching for another keyword.</p>
            <button
              onClick={() => {
                setFilterDestination('');
                setFilterBudget('All');
                setFilterDuration('All');
                setFilterTourType('All');
              }}
              className="mt-4 px-5 py-2.5 bg-[#FF5722] hover:bg-[#E54A18] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border-none cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
