import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Star, Clock, MapPin, ShieldCheck, 
  Sparkles, Smartphone, Calendar, Phone, 
  MessageSquare, ExternalLink, Info, ArrowRight, Check, X,
  Hotel, Utensils, Car, Compass, Tag, CheckCircle2, ChevronDown,
  Users
} from 'lucide-react';
import { supabase } from '../supabase';
import MarketplaceFilters from '../components/MarketplaceFilters';
import ReviewsSection from '../components/ReviewsSection';
import TrustSignals from '../components/TrustSignals';

// Consistent hash generator for mock data
const getHash = (str) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return Math.abs(hash);
};

// Generate mock itineraries if database has empty array
const getMockItinerary = (tourName, duration) => {
  const nameLower = (tourName || '').toLowerCase();
  if (nameLower.includes('kedarnath') || nameLower.includes('char dham')) {
    return [
      { day: 1, title: 'Departure & Scenic Drive to Guptkashi', description: 'Drive along the Ganges and Mandakini rivers. Arrive, check into Swiss camps, and attend brief safety orientation.' },
      { day: 2, title: 'Trek to Kedarnath Temple & Evening Aarti', description: 'Early morning drive to Gaurikund, then start the scenic 16km trek. Attend the divine evening Aarti at the temple.' },
      { day: 3, title: 'Descend to Gaurikund & Return to Rishikesh', description: 'Pray at the temple at sunrise, trek back down to Gaurikund, and drive back to Rishikesh in private cab.' }
    ];
  }
  return [
    { day: 1, title: 'Local Sightseeing & Acclimatization', description: 'Visit famous suspension bridges Ram Jhula and Laxman Jhula. Attend the grand Ganga Aarti in the evening.' },
    { day: 2, title: 'Hidden Waterfalls & Adventure Treks', description: 'Guided morning trek to Patna Waterfall. Enjoy local organic lunch at Neer Garh café and explore local markets.' }
  ];
};

export default function Tours({ currentCity, openBookingModal, selectedTour: parentSelectedTour, setSelectedTour: parentSetSelectedTour, navigateTo }) {
  const [toursList, setToursList] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [activeItineraryDay, setActiveItineraryDay] = useState(1);
  const [openItineraryDays, setOpenItineraryDays] = useState(new Set([0]));
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  // 1. Fetch Tours
  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      try {
        let query = supabase.from('tours').select('*, vendors(*)');
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map((item, idx) => ({
            ...item,
            price: Number(item.price),
            original_price: item.original_price ? Number(item.original_price) : Math.round(Number(item.price) * 1.4),
            rating: item.rating || item.vendors?.star_rating || 4.8,
            reviewsCount: item.reviews_count || (60 + (idx * 23) % 180),
            upi_discount: item.upi_discount ? Number(item.upi_discount) : null,
            images: item.images && item.images.length > 0 ? item.images : ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600']
          }));
          setToursList(mapped);

          // Group by partners
          const partnersMap = {};
          mapped.forEach(item => {
            const vendor = item.vendors;
            if (!vendor) return;

            if (!partnersMap[vendor.id]) {
              const hVal = getHash(vendor.name);
              const mockSince = vendor.since || ((hVal % 7) + 2017);
              const mockBookings = vendor.bookings_count || ((hVal % 200) + 140);
              const mockMapsLink = vendor.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.name + ' Rishikesh')}`;
              const mockInstructions = vendor.meeting_instructions || `Please arrive at ${vendor.name} office for tour verification. Secure parking is available.`;
              const mockReportingTime = vendor.reporting_time || '07:30 AM Departure';
              const mockParking = vendor.parking_details || 'Free public parking available near the pickup office';
              const mockHighlight = vendor.short_highlight || 'Award-winning local pilgrimages operator';
              
              let mockBadges = vendor.badges || [];
              if (mockBadges.length === 0) {
                if (vendor.star_rating >= 4.8) mockBadges = ['🔥 Best Seller', '⭐ Top Rated'];
                else mockBadges = ['Verified Tour Expert', 'Budget Choice'];
              }

              partnersMap[vendor.id] = {
                id: vendor.id,
                name: vendor.name,
                star_rating: vendor.star_rating || 4.7,
                address: vendor.address || 'Rishikesh, Uttarakhand',
                landmark: vendor.landmark || 'Tapovan',
                shop_image: vendor.shop_image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600',
                phone: vendor.phone || '+918630027341',
                whatsapp: vendor.whatsapp || '+918630027341',
                since: mockSince,
                bookings_count: mockBookings,
                google_maps_link: mockMapsLink,
                meeting_instructions: mockInstructions,
                reporting_time: mockReportingTime,
                parking_details: mockParking,
                badges: mockBadges,
                short_highlight: mockHighlight,
                packages: []
              };
            }

            partnersMap[vendor.id].packages.push(item);
          });
          setPartnersData(Object.values(partnersMap));
        } else {
          setToursList([]);
          setPartnersData([]);
        }
      } catch (err) {
        console.error('Error fetching tours:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, [currentCity]);

  // 2. Route popstate sync
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const queryParams = new URLSearchParams(window.location.search);
      const partnerIdParam = queryParams.get('partner');

      if (path.startsWith('/tours/')) {
        const tourId = path.substring('/tours/'.length);
        if (toursList.length > 0) {
          const matched = toursList.find(t => t.id === tourId);
          if (matched) {
            setSelectedTour(matched);
            const vData = partnersData.find(p => p.id === matched.vendor_id);
            if (vData) setSelectedPartner(vData);
            return;
          }
        }
      }

      if (partnerIdParam) {
        const matchedPartner = partnersData.find(p => p.id === partnerIdParam);
        if (matchedPartner) {
          setSelectedPartner(matchedPartner);
          setSelectedTour(null);
          return;
        }
      }

      setSelectedTour(null);
      setSelectedPartner(null);
    };

    if (partnersData.length > 0) {
      handleRouteSync();
    }
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [partnersData, toursList]);

  // Navigation handlers
  const navigateToPartner = (partner) => {
    setSelectedPartner(partner);
    setSelectedTour(null);
    if (partner) {
      window.history.pushState(null, '', `/tours?partner=${partner.id}`);
    } else {
      window.history.pushState(null, '', '/tours');
    }
    window.scrollTo(0, 0);
  };

  const navigateToTour = (tour) => {
    setSelectedTour(tour);
    if (tour) {
      window.history.pushState(null, '', `/tours/${tour.id}`);
    } else {
      window.history.pushState(null, '', selectedPartner ? `/tours?partner=${selectedPartner.id}` : '/tours');
    }
    window.scrollTo(0, 0);
  };

  const checkIfClosed = (item) => {
    if (!item) return { closed: false };
    if (item.is_closed) {
      return { closed: true, reason: item.closed_reason || 'Monsoon closures / route safety advisory', reopenDate: item.closed_until };
    }
    return { closed: false };
  };

  const getFilteredPartners = () => {
    let list = [...partnersData];
    if (!activeFilter) return list;

    switch (activeFilter) {
      case 'most_booked':
        return list.sort((a, b) => b.bookings_count - a.bookings_count);
      case 'best_rated':
        return list.sort((a, b) => b.star_rating - a.star_rating);
      case 'lowest_price':
        return list.sort((a, b) => {
          const aMin = a.packages.length > 0 ? Math.min(...a.packages.map(p => p.price)) : 999999;
          const bMin = b.packages.length > 0 ? Math.min(...b.packages.map(p => p.price)) : 999999;
          return aMin - bMin;
        });
      case 'nearest':
        return list.filter(p => p.landmark.toLowerCase().includes('tapovan') || p.landmark.toLowerCase().includes('sation'));
      case 'choice':
        return list.filter(p => p.badges.some(b => b.toLowerCase().includes('seller') || b.toLowerCase().includes('choice')));
      case 'family':
        return list; // All pilgrimages are family-friendly
      default:
        return list;
    }
  };

  const filteredPartners = getFilteredPartners();

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans">
      <AnimatePresence mode="wait">

        {/* VIEW 1: PARTNER LIST */}
        {!selectedPartner && !selectedTour && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-24">
            
            {/* Category Hero Banner */}
            <div className="relative h-[40vh] bg-black flex items-center justify-center text-center">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-[10px] font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full border border-accent/20">
                  Pilgrimages & Yatras
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  Tours & Yatras
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-xs sm:text-sm font-medium leading-relaxed">
                  Book complete tour packages for Kedarnath, Badrinath, Char Dham, Do Dham and local sightseeings with verified guides.
                </p>
              </div>
            </div>

            {/* Listing grid */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
              
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">
                  Quick Filters
                </span>
                <MarketplaceFilters activeFilter={activeFilter} onChangeFilter={setActiveFilter} />
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-base font-black font-display text-slate-900 uppercase">
                  Available Tour Operators ({filteredPartners.length})
                </h2>
              </div>

              {/* Tour Partners horizontal cards */}
              <div className="flex flex-col gap-5">
                {filteredPartners.map((partner, idx) => {
                  const minPrice = partner.packages.length > 0 ? Math.min(...partner.packages.map(p => p.price)) : 0;
                  const displayBadges = partner.badges.slice(0, 2);

                  return (
                    <motion.div
                      key={partner.id || idx}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                      onClick={() => navigateToPartner(partner)}
                      className="flex flex-col sm:flex-row bg-white border border-slate-200/80 rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all group w-full cursor-pointer text-left"
                    >
                      {/* Left Side: Cover Image */}
                      <div className="w-full sm:w-[220px] h-44 sm:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                        <img
                          src={partner.shop_image}
                          alt={partner.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                          <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md tracking-wider">
                            Verified Tour Operator
                          </span>
                          {partner.star_rating >= 4.8 && (
                            <span className="bg-indigo-650/95 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md tracking-wider">
                              Top Rated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Information */}
                      <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                        
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-extrabold text-base sm:text-lg font-display text-slate-900 uppercase group-hover:text-[#FF5F00] transition-colors leading-tight">
                              {partner.name}
                            </h3>
                            <div className="text-right shrink-0">
                              <span className="font-black text-sm text-slate-800 flex items-center gap-1 justify-end leading-none">
                                ⭐ {partner.star_rating}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold block mt-0.5 leading-none">
                                {partner.bookings_count + 18} Reviews
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-bold">
                            <span className="flex items-center gap-1">
                              📍 {partner.landmark || partner.address}
                            </span>
                            <span>•</span>
                            <span>Since {partner.since}</span>
                            <span>•</span>
                            <span className="text-emerald-600">🔥 {partner.bookings_count}+ Yatris Guided</span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {displayBadges.map((badge, bIdx) => (
                            <span key={bIdx} className="text-[9px] font-black uppercase text-[#FF6B00] bg-[#FF6B00]/5 border border-[#FF6B00]/10 px-2 py-0.5 rounded">
                              {badge}
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-500 font-semibold italic">
                            "{partner.short_highlight}"
                          </span>
                        </div>

                        {/* Ribbon and CTA */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                          
                          <div className="flex gap-3 text-slate-400">
                            <div className="group/inc relative">
                              <Hotel size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">Hotel Stays Included</span>
                            </div>
                            <div className="group/inc relative">
                              <Utensils size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">Buffet Meals</span>
                            </div>
                            <div className="group/inc relative">
                              <Car size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">Comfort Transfers</span>
                            </div>
                            <div className="group/inc relative">
                              <Compass size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">Coordinators & Guides</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4.5 justify-between xs:justify-end">
                            <div>
                              <span className="text-[9px] block font-bold text-slate-455 uppercase leading-none">Starting From</span>
                              <span className="text-xl font-black text-slate-900 leading-none">
                                ₹{minPrice.toLocaleString('en-IN')}
                                <span className="text-[10px] text-slate-450 font-bold lowercase">/person</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              className="py-2.5 px-4.5 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display"
                            >
                              View Tours
                            </button>
                          </div>

                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW 2: PARTNER PROFILE (Tour Packages) */}
        {selectedPartner && !selectedTour && (
          <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
            
            <button
              onClick={() => navigateToPartner(null)}
              className="flex items-center gap-1 text-slate-500 hover:text-black font-black text-xs uppercase bg-transparent border-none cursor-pointer p-0"
            >
              <ChevronLeft size={16} /> Back to Operators
            </button>

            {/* Premium Cover Banner Header Section */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs flex flex-col text-left">
              {/* Cover Banner Image */}
              <div className="w-full h-44 sm:h-64 relative bg-slate-900 overflow-hidden">
                <img 
                  src={selectedPartner.shop_image} 
                  alt={selectedPartner.name} 
                  className="w-full h-full object-cover opacity-80" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                  <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-md w-max inline-block">
                    ✓ TripGod Verified Partner
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white uppercase mt-1 drop-shadow-sm">
                    {selectedPartner.name}
                  </h2>
                </div>
              </div>
              
              {/* Profile Details (Lower section) */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1 text-slate-800">
                    <Star size={14} className="fill-amber-500 text-amber-550 shrink-0" />
                    <span className="font-extrabold">{selectedPartner.star_rating} Rating</span>
                    <span className="text-slate-400">({selectedPartner.bookings_count} bookings)</span>
                  </div>
                  <span>•</span>
                  <span>📍 {selectedPartner.landmark || selectedPartner.address}</span>
                  <span>•</span>
                  <span>Since {selectedPartner.since}</span>
                  <span>•</span>
                  <span className="text-emerald-600">🛡️ Verified Tour Operator</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-655 leading-relaxed font-medium max-w-3xl">
                  ⚡ {selectedPartner.short_highlight}. Experienced pilgrimage planners coordinating comfortable stays, certified guides, and transport.
                </p>
              </div>
            </div>

            {/* Available Yatras */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">Available Yatras &amp; Tours</h3>

              <div className="flex flex-col gap-3">
                {selectedPartner.packages.map((pkg, idx) => {
                  const savings = pkg.original_price - pkg.price;
                  const discountPct = pkg.original_price > pkg.price ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100) : 0;
                  const closed = checkIfClosed(pkg).closed;

                  return (
                    <div
                      key={pkg.id || idx}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all w-full relative"
                    >
                      {closed && (
                        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded shadow-md">
                            Closed temporarily
                          </span>
                        </div>
                      )}

                      {/* Tour Image — top of card */}
                      <div className="w-full h-44 relative overflow-hidden bg-slate-100 group">
                        <img
                          src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600'}
                          alt={pkg.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>

                      {/* Rating + Duration */}
                      <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 text-xs">⭐</span>
                          <span className="font-black text-xs text-slate-800">{selectedPartner.star_rating}</span>
                          <span className="text-[10px] text-slate-400 font-bold">({selectedPartner.bookings_count + 18})</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#FF6B00] font-black text-xs">
                          <Clock size={11} />
                          <span>{pkg.duration}</span>
                        </div>
                      </div>

                      <div className="mx-4 mt-2.5 border-t border-slate-100" />

                      {/* Tour name + location */}
                      <div className="px-4 pt-3 pb-0 space-y-1">
                        <h4 className="font-black text-sm font-display text-slate-900 uppercase leading-tight tracking-tight">
                          {pkg.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                          <MapPin size={10} className="text-[#FF6B00] shrink-0" />
                          {pkg.name.toLowerCase().includes('kedarnath') && !pkg.name.toLowerCase().includes('char') ? 'Kedarnath • Badrinath' :
                           pkg.name.toLowerCase().includes('char') ? 'Yamunotri • Gangotri • Kedarnath • Badrinath' :
                           pkg.name.toLowerCase().includes('badrinath') ? 'Badrinath • Mana Village' :
                           'Rishikesh & Surroundings'}
                        </p>
                      </div>

                      <div className="mx-4 mt-3 border-t border-slate-100" />

                      {/* 2x2 Inclusions */}
                      <div className="px-4 pt-3 pb-0 grid grid-cols-2 gap-y-1.5 gap-x-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <span>🏨</span>
                          <span>{pkg.hotel_included ? 'Hotel Included' : 'No Hotel'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <span>🍽</span>
                          <span>{pkg.meals_included ? 'Meals Included' : 'Self Meals'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <span>🚖</span>
                          <span>{pkg.transport_included ? 'Cab Included' : 'Own Transport'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <span>👨</span>
                          <span>Guide Included</span>
                        </div>
                      </div>

                      <div className="mx-4 mt-3 border-t border-slate-100" />

                      {/* Price + CTA */}
                      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-lg font-black text-slate-950">₹{pkg.price.toLocaleString('en-IN')}</span>
                            {pkg.original_price > pkg.price && (
                              <span className="text-[11px] text-slate-400 line-through font-semibold">₹{pkg.original_price.toLocaleString('en-IN')}</span>
                            )}
                            {discountPct > 0 && (
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">{discountPct}% off</span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">per person</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigateToTour(pkg)}
                          className="flex items-center gap-1.5 py-2.5 px-4 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.25)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display shrink-0"
                        >
                          View Details <ArrowRight size={12} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operator Reviews */}
            <div className="pt-6 border-t border-slate-200">
              <ReviewsSection rating={selectedPartner.star_rating} reviewsCount={selectedPartner.bookings_count} name={selectedPartner.name} />
            </div>

          </motion.div>
        )}

        {/* VIEW 3: TOUR DETAILS VIEW */}
        {selectedTour && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="pb-28 pt-4 max-w-4xl mx-auto px-4 sm:px-6 space-y-5 text-left">

            {/* Back button */}
            <button
              onClick={() => navigateToTour(null)}
              className="flex items-center gap-1.5 py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-black hover:border-slate-400 transition-colors cursor-pointer bg-white"
            >
              <ChevronLeft size={16} /> Back to Tours
            </button>

            {/* Hero: Title + Price + Image */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <span className="text-[9px] bg-black text-[#FF6B00] font-black tracking-widest px-2 py-0.5 rounded uppercase">Yatra & Tour</span>
                  <h1 className="text-xl md:text-2xl font-black font-display text-slate-900 uppercase leading-tight">{selectedTour.name}</h1>
                  <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-1 text-slate-800">
                      <Star size={11} className="text-[#FF5F00]" fill="#FF5F00" />
                      <span className="font-black">{selectedPartner?.star_rating || 4.8}</span>
                      <span className="text-slate-400 font-semibold">({selectedPartner?.bookings_count || 120} reviews)</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-bold">{selectedPartner?.name}</span>
                    <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-black uppercase px-1.5 py-0.5 rounded">✓ TripGod Verified</span>
                  </div>
                </div>
                {/* Price pill */}
                <div className="bg-[#FF5F00]/8 border border-[#FF5F00]/20 px-4 py-3 rounded-2xl shrink-0 text-left sm:text-right">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Starting From</span>
                  <div className="flex items-baseline gap-1.5 sm:justify-end">
                    <span className="text-2xl font-black text-slate-900">₹{selectedTour.price.toLocaleString('en-IN')}</span>
                    {selectedTour.original_price > selectedTour.price && (
                      <span className="text-xs text-slate-400 line-through font-semibold">₹{selectedTour.original_price.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-[#FF5F00] uppercase">Per Person</span>
                </div>
              </div>

              {/* Hero Image */}
              <div className="h-60 sm:h-80 w-full rounded-2xl overflow-hidden relative border border-slate-200 group">
                <img
                  src={selectedTour.images[currentImgIdx]}
                  alt={selectedTour.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {selectedTour.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {selectedTour.images.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setCurrentImgIdx(dotIdx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer border-none ${dotIdx === currentImgIdx ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info Card — 2-column grid */}
            <div className="bg-slate-900 rounded-2xl p-4 grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg shrink-0">🕒</span>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider">Duration</span>
                  <span className="text-white font-black text-xs">{selectedTour.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg shrink-0">📍</span>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider">Destination</span>
                  <span className="text-white font-black text-xs">
                    {selectedTour.name.toLowerCase().includes('kedarnath') && !selectedTour.name.toLowerCase().includes('char') ? 'Kedarnath • Badrinath' :
                     selectedTour.name.toLowerCase().includes('char') ? 'Char Dham Circuit' :
                     selectedTour.name.toLowerCase().includes('badrinath') ? 'Badrinath • Mana' :
                     'Rishikesh & Beyond'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg shrink-0">🏨</span>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider">Hotel</span>
                  <span className="text-white font-black text-xs">{selectedTour.hotel_included ? 'Included' : 'Not Included'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg shrink-0">🍽</span>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider">Meals</span>
                  <span className="text-white font-black text-xs">{selectedTour.meals_included ? 'Buffet Meals' : 'Self Expense'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg shrink-0">🚖</span>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider">Transport</span>
                  <span className="text-white font-black text-xs">{selectedTour.transport_included ? 'Cab Included' : 'Own Arrangement'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg shrink-0">👨</span>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider">Guide</span>
                  <span className="text-white font-black text-xs">Certified Guide</span>
                </div>
              </div>
            </div>

            {/* Compact Partner Line */}
            <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold">
              <span className="text-slate-500">Operated by</span>
              <span className="text-slate-900 font-black">{selectedPartner?.name}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-0.5 text-amber-600">⭐ {selectedPartner?.star_rating}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 flex items-center gap-1"><MapPin size={10} className="text-[#FF6B00]" /> {selectedPartner?.landmark || selectedPartner?.address}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 text-[10px] font-black">✅ TripGod Verified</span>
            </div>

            {/* Tour Overview — with Read More */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <h3 className="text-sm font-black font-display text-slate-900 uppercase tracking-tight">Tour Overview</h3>
              <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed font-medium ${overviewExpanded ? '' : 'line-clamp-4'}`}>
                {selectedTour.description || `Embark on the glorious ${selectedTour.name} yatra from Rishikesh. Coordinated by ${selectedPartner?.name}, this pilgrimage package includes private transport, comfortable hotel stays, certified guide, buffet meals and 24×7 coordination support. Experience the divine darshan with complete peace of mind. All logistics are handled — from departure to return.`}
              </p>
              <button
                onClick={() => setOverviewExpanded(!overviewExpanded)}
                className="text-[11px] font-black text-[#FF6B00] hover:text-[#FF3D00] flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
              >
                {overviewExpanded ? 'Show Less ↑' : 'Read More ↓'}
              </button>
            </div>

            {/* Inclusions / Exclusions — 2-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-600" /> What's Included
                </h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {(selectedTour.inclusions && selectedTour.inclusions.length > 0
                    ? selectedTour.inclusions
                    : ['Hotels & camp stays', 'Cab transport', 'All meals', 'Guide service', 'Permits', 'Coordination']
                  ).map((inc, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] font-bold text-emerald-900">
                      <span className="text-emerald-600 font-black shrink-0 mt-0.5">✓</span>
                      <span className="leading-tight">{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <X size={12} className="text-rose-500" /> What's Excluded
                </h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {(selectedTour.exclusions && selectedTour.exclusions.length > 0
                    ? selectedTour.exclusions
                    : ['Flights', 'Personal shopping', 'VIP Darshan', 'Travel insurance', 'Helicopter tickets', 'Pony/Palki charges']
                  ).map((exc, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] font-bold text-rose-900">
                      <span className="text-rose-500 font-black shrink-0 mt-0.5">✗</span>
                      <span className="leading-tight">{exc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Day Wise Itinerary — Collapsible Accordion */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <h3 className="text-sm font-black font-display text-slate-900 uppercase tracking-tight">Day-wise Itinerary</h3>
              <div className="space-y-2">
                {(selectedTour.day_wise_itinerary && selectedTour.day_wise_itinerary.length > 0
                  ? selectedTour.day_wise_itinerary
                  : getMockItinerary(selectedTour.name, selectedTour.duration)
                ).map((day, idx) => {
                  const isOpen = openItineraryDays.has(idx);
                  return (
                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => {
                          const next = new Set(openItineraryDays);
                          if (isOpen) next.delete(idx); else next.add(idx);
                          setOpenItineraryDays(next);
                        }}
                        className="w-full flex items-center justify-between gap-3 p-3.5 text-left cursor-pointer bg-transparent border-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#FF6B00] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {day.day || (idx + 1)}
                          </div>
                          <span className="font-black text-xs text-slate-900 uppercase leading-tight font-display">{day.title}</span>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3.5 pt-0 border-t border-slate-100">
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{day.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tour Reporting Office — Premium Card */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <MapPin size={16} className="text-[#FF6B00]" />
                  Tour Reporting Office
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Verified Address
                </span>
              </div>
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-xl border border-slate-800/80 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {/* Left Column: Location & Time */}
                  <div className="space-y-3 md:border-r md:border-slate-800 md:pr-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={15} className="text-[#FF6B00]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Reporting Location</span>
                        <p className="text-xs font-black text-white font-display mt-0.5">{selectedPartner?.name || 'Local Tour Partner'} Office</p>
                        <p className="text-[11px] text-slate-300 font-medium leading-snug">{selectedPartner?.landmark || selectedPartner?.address || 'Near Main Center, Rishikesh'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={15} className="text-amber-400" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Departure & Timing</span>
                        <p className="text-xs font-black text-white font-display mt-0.5">{selectedPartner?.reporting_time || '07:30 AM Departure'}</p>
                        <p className="text-[11px] text-amber-400/90 font-medium">Please arrive 15 minutes prior to departure</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Parking & Maps Action */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Car size={15} className="text-sky-400" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Parking & Accessibility</span>
                        <p className="text-[11px] text-slate-200 font-bold leading-tight mt-0.5">{selectedPartner?.parking_details || 'Free public parking available near office'}</p>
                        {selectedPartner?.meeting_instructions && (
                          <p className="text-[10px] text-slate-400 font-normal leading-tight mt-1">{selectedPartner.meeting_instructions.slice(0, 70)}...</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-slate-400">Exact GPS Coordinates Provided</span>
                      {selectedPartner?.google_maps_link ? (
                        <a
                          href={selectedPartner.google_maps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FF6B00] to-[#FF4500] hover:from-[#FF7B1A] hover:to-[#FF5500] text-white text-[11px] font-black uppercase rounded-lg shadow-md hover:shadow-lg transition-all no-underline shrink-0"
                        >
                          <ExternalLink size={12} /> Open Maps
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-bold">Maps link on confirmation</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Symmetrical Trust Signals */}
            <div className="pt-2 border-t border-slate-100">
              <TrustSignals />
            </div>

            {/* Premium OTA Checkout Box */}
            {(() => {
              const pMode = selectedTour.payment_mode || 'commission_advance';
              const commPct = selectedTour.commission_percentage !== undefined && selectedTour.commission_percentage !== null ? Number(selectedTour.commission_percentage) : 10;
              const fixedAmt = selectedTour.fixed_advance_amount !== undefined && selectedTour.fixed_advance_amount !== null ? Number(selectedTour.fixed_advance_amount) : 0;

              let advanceAmount = 0;
              if (pMode === 'full_payment') {
                advanceAmount = selectedTour.price;
              } else if (pMode === 'fixed_advance') {
                advanceAmount = fixedAmt;
              } else {
                advanceAmount = Math.round((selectedTour.price * commPct) / 100);
              }
              const remainingAmount = Math.max(0, selectedTour.price - advanceAmount);

              return (
                <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/50 to-orange-50/90 border-2 border-[#FF6B00]/40 rounded-2xl p-4 shadow-[0_6px_25px_rgba(255,107,0,0.1)] relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between border-b border-orange-200/60 pb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300/60 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 size={12} className="text-emerald-700 stroke-[3]" /> Free Cancellation (24h)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-indigo-800 bg-indigo-100/90 border border-indigo-300/60 px-2.5 py-1 rounded-lg">
                        <Sparkles size={12} className="text-indigo-700 fill-indigo-200" /> Instant Ticket Confirmation
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OTA Best Price</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-800 font-medium">
                        {pMode === 'full_payment' ? (
                          <span className="font-bold text-slate-900">Pay 100% online to secure your slot instantly.</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-900 font-extrabold">Pay <strong className="text-sm font-black text-[#FF5F00] font-display">₹{advanceAmount.toLocaleString('en-IN')}</strong> Now</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600 font-semibold">Balance <strong className="text-slate-900 font-bold">₹{remainingAmount.toLocaleString('en-IN')}</strong> at Venue</span>
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">No hidden platform charges • Direct partner confirmation</p>
                    </div>

                    {checkIfClosed(selectedTour).closed ? (
                      <button disabled className="w-full sm:w-auto py-3.5 px-6 bg-slate-300 text-slate-500 text-xs font-black uppercase rounded-xl border-none cursor-not-allowed font-display shrink-0">
                        Closed Temporarily
                      </button>
                    ) : (
                      <button
                        onClick={() => openBookingModal({
                          id: selectedTour.id,
                          name: `${selectedTour.name} - ${selectedPartner?.name}`,
                          stretch: selectedTour.duration,
                          price: selectedTour.price,
                          category: 'tours',
                          city_id: selectedTour.city_id,
                          vendor_id: selectedTour.vendor_id,
                          payment_mode: pMode,
                          commission_percentage: commPct,
                          fixed_advance_amount: fixedAmt,
                          upi_discount: selectedTour.upi_discount,
                          vendors: selectedPartner,
                          slots: ['Morning Departure (08:00 AM)', 'Custom Timing']
                        })}
                        className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-[#FF5F00] via-[#FF4500] to-[#FF2A00] text-white text-sm font-black uppercase rounded-xl shadow-[0_4px_18px_rgba(255,95,0,0.35)] hover:shadow-[0_6px_25px_rgba(255,95,0,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display shrink-0 flex items-center justify-center gap-2 group"
                      >
                        <span>Book Now</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* FAQs Accordion */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <h3 className="text-sm font-black font-display text-slate-900 uppercase tracking-tight">Frequently Asked Questions</h3>
              <div className="space-y-2">
                {[
                  { q: 'What documents do I need to carry?', a: 'Carry a valid government photo ID (Aadhar/Passport/DL). For Char Dham yatra, registration is also required which your guide will help with.' },
                  { q: 'Is the price per person or for the group?', a: 'The price shown is per person. Group discounts may be available — contact us for groups of 6 or more.' },
                  { q: 'What if the tour gets cancelled due to weather?', a: 'In case of unavoidable weather or route closures, we offer full rescheduling or 100% refund as per our cancellation policy.' },
                  { q: 'Can I customize the itinerary?', a: 'Yes, the operator can make adjustments to the itinerary based on your requirements. Please contact us before booking to discuss customizations.' },
                ].map((faq, fi) => (
                  <div key={fi} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setOpenFaqIdx(openFaqIdx === fi ? null : fi)}
                      className="w-full flex items-center justify-between gap-3 p-3.5 text-left cursor-pointer bg-transparent border-none"
                    >
                      <span className="font-bold text-xs text-slate-900">{faq.q}</span>
                      <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openFaqIdx === fi ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaqIdx === fi && (
                      <div className="px-4 pb-3.5 pt-0 border-t border-slate-100">
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews — DO NOT TOUCH (user instruction) */}
            <div className="pt-4 border-t border-slate-200">
              <ReviewsSection rating={selectedPartner?.star_rating || 4.8} reviewsCount={selectedPartner?.bookings_count || 120} name={selectedPartner?.name} />
            </div>

            {/* Mobile Sticky Booking Bar — Premium Clean */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Total Price</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-slate-900 leading-none">₹{selectedTour.price.toLocaleString('en-IN')}</span>
                    {selectedTour.original_price > selectedTour.price && (
                      <span className="text-[11px] text-slate-400 line-through font-semibold leading-none">₹{selectedTour.original_price.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold leading-none">per person</span>
                </div>
                <button
                  onClick={() => {
                    const pMode = selectedTour.payment_mode || 'commission_advance';
                    const commPct = selectedTour.commission_percentage !== undefined && selectedTour.commission_percentage !== null ? Number(selectedTour.commission_percentage) : 10;
                    const fixedAmt = selectedTour.fixed_advance_amount !== undefined && selectedTour.fixed_advance_amount !== null ? Number(selectedTour.fixed_advance_amount) : 0;
                    openBookingModal({
                      id: selectedTour.id,
                      name: `${selectedTour.name} - ${selectedPartner?.name}`,
                      stretch: selectedTour.duration,
                      price: selectedTour.price,
                      category: 'tours',
                      city_id: selectedTour.city_id,
                      vendor_id: selectedTour.vendor_id,
                      payment_mode: pMode,
                      commission_percentage: commPct,
                      fixed_advance_amount: fixedAmt,
                      upi_discount: selectedTour.upi_discount,
                      vendors: selectedPartner,
                      slots: ['Morning Departure (08:00 AM)', 'Custom Timing']
                    });
                  }}
                  className="py-3.5 px-8 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display h-[52px] flex flex-col items-center justify-center"
                >
                  <span className="leading-none">BOOK NOW →</span>
                  <span className="text-[8px] text-orange-200 font-bold leading-none mt-0.5">Instant Confirmation</span>
                </button>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

