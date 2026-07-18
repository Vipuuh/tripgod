import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Star, Clock, MapPin, ShieldCheck, 
  Sparkles, Smartphone, Calendar, Phone, 
  MessageSquare, ExternalLink, Info, ArrowRight, Check,
  Hotel, Utensils, Car, Compass, Tag, CheckCircle2, ChevronDown
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
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">Available Yatras & Tours</h3>

              <div className="flex flex-col gap-4">
                {selectedPartner.packages.map((pkg, idx) => {
                  const savings = pkg.original_price - pkg.price;
                  const closed = checkIfClosed(pkg).closed;

                  return (
                    <div 
                      key={pkg.id || idx}
                      className="flex flex-col md:flex-row bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-slate-350 transition-all w-full relative"
                    >
                      {closed && (
                        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded shadow-md">
                            Closed temporarily
                          </span>
                        </div>
                      )}

                      <div className="w-full md:w-[200px] h-40 md:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                        <img src={pkg.images[0]} alt={pkg.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-extrabold text-base font-display text-slate-900 uppercase">
                              {pkg.name}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-[#FF6B00] font-black shrink-0">
                              <Clock size={12} />
                              <span>{pkg.duration}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                            {pkg.hotel_included && <span className="bg-slate-100 px-2 py-0.5 rounded">🏨 Hotels Stay</span>}
                            {pkg.meals_included && <span className="bg-slate-100 px-2 py-0.5 rounded">🍲 Meals</span>}
                            {pkg.transport_included && <span className="bg-slate-100 px-2 py-0.5 rounded">🚗 Cab transfers</span>}
                          </div>

                          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {pkg.description || `Secure your yatra bookings with ${selectedPartner.name}. Full packages cover lodging, meals, coordinates and local guides.`}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                              ✓ Instant Confirmation
                            </span>
                            <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded">
                              ✓ Free Coordinator support
                            </span>
                          </div>

                          <div className="flex items-center gap-4 justify-between sm:justify-end">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-950">₹{pkg.price.toLocaleString('en-IN')}</span>
                                {pkg.original_price > pkg.price && (
                                  <span className="text-xs text-slate-400 line-through font-semibold">₹{pkg.original_price.toLocaleString('en-IN')}</span>
                                )}
                              </div>
                              {savings > 0 && (
                                <span className="text-[9px] font-black text-emerald-600 uppercase block">Save ₹{savings}</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => navigateToTour(pkg)}
                              className="py-2.5 px-4 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.2)] hover:scale-[1.02] transition-all border-none cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        </div>

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
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="pb-24 pt-6 max-w-4xl mx-auto px-4 sm:px-6 space-y-6 text-left">
            
            <button
              onClick={() => navigateToTour(null)}
              className="flex items-center gap-1.5 py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-black hover:border-slate-400 transition-colors cursor-pointer bg-white"
            >
              <ChevronLeft size={16} /> Back to Tours
            </button>

            {/* Title & stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-black text-accent font-black tracking-widest px-2 py-0.5 rounded uppercase">
                    Yatra & Tour
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 uppercase">
                  {selectedTour.name}
                </h1>
                
                <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-1 text-slate-800">
                    <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                    <span>{selectedPartner?.star_rating || 4.8}</span>
                    <span className="text-slate-400">({selectedPartner?.bookings_count || 120} reviews)</span>
                  </div>
                  <span>•</span>
                  <span className="text-emerald-700">Operator: {selectedPartner?.name}</span>
                </div>
              </div>

              <div className="bg-[#FF5F00]/5 border border-[#FF5F00]/15 p-4 rounded-2xl flex flex-col min-w-[160px] xs:text-right shrink-0">
                <span className="text-[9px] font-bold text-slate-455 uppercase block">Package Price</span>
                <div className="flex items-baseline gap-1 xs:justify-end">
                  <span className="text-2xl font-black text-slate-900">₹{selectedTour.price.toLocaleString('en-IN')}</span>
                  {selectedTour.original_price > selectedTour.price && (
                    <span className="text-xs text-slate-450 line-through font-semibold">₹{selectedTour.original_price.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-[#FF5F00] uppercase mt-0.5">
                  Book with Token Advance
                </span>
              </div>
            </div>

            {/* Tour Images */}
            <div className="h-52 sm:h-72 w-full rounded-2xl overflow-hidden relative border border-slate-200 group">
              <img 
                src={selectedTour.images[currentImgIdx]} 
                alt={selectedTour.name}
                className="w-full h-full object-cover"
              />
              
              {selectedTour.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
                  {selectedTour.images.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setCurrentImgIdx(dotIdx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer border-none ${dotIdx === currentImgIdx ? 'bg-white w-3' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Specs card below image */}
            <div className="flex flex-col xs:flex-row gap-2.5 xs:items-center justify-between text-white text-xs bg-slate-900 p-4 rounded-2xl shadow-sm">
              <div className="flex gap-6 flex-wrap">
                <div>
                  <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Duration</span>
                  <span className="font-bold text-white">{selectedTour.duration}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Stay lodging</span>
                  <span className="font-bold text-white">{selectedTour.hotel_included ? 'Hotel Stay included' : 'Not included'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Meals</span>
                  <span className="font-bold text-white">{selectedTour.meals_included ? 'Buffet meals' : 'Self expense'}</span>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#FF5F00]/15 text-[#FF5F00] border border-[#FF5F00]/30 font-bold rounded-lg flex items-center gap-1 text-[10px] sm:text-xs shrink-0 self-start xs:self-auto">
                <ShieldCheck size={12} /> Tour Safety Verified
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-base font-bold font-display text-slate-900 uppercase">Tour Overview</h3>
              <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-medium">
                {selectedTour.description || `Embark on the glorious ${selectedTour.name} yatra from Rishikesh. Coordinated by ${selectedPartner?.name}, this pilgrimage package includes private transport, stay, guide, and quick coordination hotlines.`}
              </p>
            </div>

            {/* Day Wise Itinerary */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold font-display text-slate-900 uppercase">Day Wise Itinerary</h3>
              <div className="space-y-4 pl-1">
                {(selectedTour.day_wise_itinerary && selectedTour.day_wise_itinerary.length > 0
                  ? selectedTour.day_wise_itinerary
                  : getMockItinerary(selectedTour.name, selectedTour.duration)
                ).map((day, idx) => (
                  <div key={idx} className="flex gap-4 items-start relative">
                    {/* Circle timeline */}
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white text-[10px] font-black flex items-center justify-center border-4 border-orange-100">
                        {day.day || (idx + 1)}
                      </div>
                      {idx < 2 && <div className="w-0.5 h-16 bg-slate-200 mt-1" />}
                    </div>

                    <div className="space-y-1.5 flex-1 bg-white border border-slate-200/60 p-4 rounded-2xl">
                      <span className="block text-[10px] font-black uppercase text-[#FF6B00]">Day {day.day || (idx + 1)}</span>
                      <h4 className="font-extrabold text-sm text-slate-900 uppercase font-display leading-tight">{day.title}</h4>
                      <p className="text-xs text-slate-600 leading-normal font-medium">{day.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Who is this perfect for? */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold font-display text-slate-900 uppercase">Who is this perfect for?</h4>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
                  <Users size={11} /> Families & Senior Citizens
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
                  <Sparkles size={11} /> Spiritual Seekers
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
                  ✓ Comfort Travel Seekers
                </span>
              </div>
            </div>

            {/* Inclusions / Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Inclusions</h4>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  {selectedTour.inclusions && selectedTour.inclusions.length > 0 ? (
                    selectedTour.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span>Hotels & camps stays</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span>Cab transport & driver support</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Exclusions</h4>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  {selectedTour.exclusions && selectedTour.exclusions.length > 0 ? (
                    selectedTour.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold shrink-0">✗</span>
                        <span>{exc}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold shrink-0">✗</span>
                        <span>Helicopter tickets (unless explicitly added)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold shrink-0">✗</span>
                        <span>Personal VIP Darshan entry tickets</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Dynamic Partner Location & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 bg-slate-50 border border-slate-200/60 rounded-3xl p-5 md:p-6 shadow-2xs">
              <div className="space-y-3">
                <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">Reporting & Office Address</span>
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#FF6B00]" />
                    {selectedPartner?.name} Office
                  </p>
                  <p className="text-xs text-slate-600 font-medium pl-5 leading-normal">
                    {selectedPartner?.address} ({selectedPartner?.landmark})
                  </p>
                </div>
                {selectedPartner?.google_maps_link && (
                  <a
                    href={selectedPartner.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-[#FF6B00] hover:text-[#FF3D00] pl-5"
                  >
                    Open in Google Maps <ExternalLink size={12} />
                  </a>
                )}
                <div className="pl-5 pt-1 text-[10px] text-slate-500 leading-normal">
                  <span className="font-bold uppercase text-slate-600 block">🚗 Parking</span>
                  {selectedPartner?.parking_details}
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-[10px] font-black text-slate-455 uppercase tracking-wide">Yatra Coordinator Guidelines</span>
                <div className="space-y-2 text-xs font-medium text-slate-600 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6B00] font-black">🕒 Departure:</span>
                    <span>{selectedPartner?.reporting_time}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-1.5 bg-white border border-slate-200/60 p-3 rounded-xl">
                    <span className="font-bold uppercase text-slate-600 block mb-1">📝 Meeting Guidelines</span>
                    {selectedPartner?.meeting_instructions}
                  </p>
                </div>
              </div>
            </div>

            {/* Trust and Reviews Section */}
            <div className="pt-6 border-t border-slate-200">
              <TrustSignals />
            </div>

            {/* Checkout Widget Card */}
            <div className="bg-[#FFF0E5] border-2 border-[#FF6B00] rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mt-6 shadow-xs">
              <div className="flex items-start gap-3.5">
                <ShieldCheck size={28} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">Secure Tour with Token Advance</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Pay a token advance online to secure your slots with <strong>{selectedPartner?.name}</strong>. Cancel up to 24 hours prior for a 100% refund.
                  </p>
                </div>
              </div>

              {checkIfClosed(selectedTour).closed ? (
                <button
                  disabled
                  className="w-full md:w-auto py-3 px-6 bg-slate-300 text-slate-500 text-xs font-black uppercase rounded-xl border-none cursor-not-allowed font-display shrink-0"
                >
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
                    commission_percentage: selectedTour.commission_percentage || selectedTour.vendors?.commission_percentage || 10,
                    upi_discount: selectedTour.upi_discount,
                    vendors: selectedPartner, // Send partner info directly to checkout
                    slots: ['Morning Departure (08:00 AM)', 'Custom Timing']
                  })}
                  className="w-full md:w-auto py-3 px-6 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display shrink-0"
                >
                  Book Operator
                </button>
              )}
            </div>

            {/* Mobile Sticky Booking Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-3.5 px-4 flex items-center justify-between gap-4 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              <div>
                <span className="text-[9px] font-bold text-slate-455 uppercase block">Total Cost</span>
                <span className="text-lg font-black text-slate-900">₹{selectedTour.price.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/918630027341?text=Hi%20TripGod%2C%20I%20want%20to%20book%20the%20${encodeURIComponent(selectedTour.name)}%20from%20${encodeURIComponent(selectedPartner?.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-xl flex items-center justify-center text-white shrink-0 hover:scale-105 active:scale-95 transition-all shadow-xs"
                >
                  <MessageSquare size={16} />
                </a>
                <button
                  onClick={() => openBookingModal({
                    id: selectedTour.id,
                    name: `${selectedTour.name} - ${selectedPartner?.name}`,
                    stretch: selectedTour.duration,
                    price: selectedTour.price,
                    category: 'tours',
                    city_id: selectedTour.city_id,
                    vendor_id: selectedTour.vendor_id,
                    commission_percentage: selectedTour.commission_percentage || selectedTour.vendors?.commission_percentage || 10,
                    upi_discount: selectedTour.upi_discount,
                    vendors: selectedPartner,
                    slots: ['Morning Departure (08:00 AM)', 'Custom Timing']
                  })}
                  className="py-2.5 px-6 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.2)] hover:scale-[1.01] active:scale-[0.99] transition-all border-none cursor-pointer font-display"
                >
                  Book Now
                </button>
              </div>
            </div>

            {/* Reviews list */}
            <div className="pt-8 border-t border-slate-200">
              <ReviewsSection rating={selectedPartner?.star_rating || 4.8} reviewsCount={selectedPartner?.bookings_count || 120} name={selectedPartner?.name} />
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
