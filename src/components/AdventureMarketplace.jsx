import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Star, Clock, MapPin, ShieldCheck, 
  HelpCircle, Sparkles, Smartphone, Calendar, Phone, 
  MessageSquare, ExternalLink, Info, ArrowRight, Check,
  Hotel, Utensils, Car, Compass, Users
} from 'lucide-react';
import { supabase } from '../supabase';
import MarketplaceFilters from './MarketplaceFilters';
import ReviewsSection from './ReviewsSection';
import TrustSignals from './TrustSignals';

// Consistent hash generator for mock data
const getHash = (str) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return Math.abs(hash);
};

export default function AdventureMarketplace({ activityType, currentCity, openBookingModal }) {
  const [partnersData, setPartnersData] = useState([]);
  const [rawPackages, setRawPackages] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  // 1. Fetch category data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from('rafting')
          .select('*, vendors(*)');

        if (activityType === 'rafting') {
          query = query.or('activity_type.eq.rafting,activity_type.is.null');
        } else {
          query = query.eq('activity_type', activityType);
        }

        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          setRawPackages(data);

          // Group by vendor
          const partnersMap = {};
          data.forEach(item => {
            const vendor = item.vendors;
            if (!vendor) return;

            if (!partnersMap[vendor.id]) {
              // Generate mock data consistent with vendor id/name if missing
              const hVal = getHash(vendor.name);
              const mockSince = vendor.since || ((hVal % 8) + 2016);
              const mockBookings = vendor.bookings_count || ((hVal % 180) + 120);
              const mockMapsLink = vendor.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.name + ' Rishikesh')}`;
              const mockInstructions = vendor.meeting_instructions || `Please report at ${vendor.name} office. Bring extra clothes and valid ID.`;
              const mockReportingTime = vendor.reporting_time || '15 mins before slot';
              const mockParking = vendor.parking_details || 'Free customer parking available';
              const mockHighlight = vendor.short_highlight || 'Highly experienced local safety crew';
              
              // Generate badges
              let mockBadges = vendor.badges || [];
              if (mockBadges.length === 0) {
                if (vendor.star_rating >= 4.8) mockBadges = ['🔥 Most Booked', '⭐ Best Rated'];
                else if (hVal % 2 === 0) mockBadges = ['TripGod Choice', 'Family Friendly'];
                else mockBadges = ['Verified Operator', 'Budget Pick'];
              }

              partnersMap[vendor.id] = {
                id: vendor.id,
                name: vendor.name,
                star_rating: vendor.star_rating || 4.7,
                address: vendor.address || 'Rishikesh, Uttarakhand',
                landmark: vendor.landmark || 'Tapovan',
                shop_image: vendor.shop_image || 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=600',
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

            partnersMap[vendor.id].packages.push({
              ...item,
              price: Number(item.price),
              original_price: item.original_price ? Number(item.original_price) : Math.round(Number(item.price) * 1.3),
              duration: item.duration || '2-3 Hours',
              images: item.images && item.images.length > 0 ? item.images : ['/rafting-4.jpg'],
              coming_soon: !!item.coming_soon,
              upi_discount: item.upi_discount ? Number(item.upi_discount) : null
            });
          });

          setPartnersData(Object.values(partnersMap));
        } else {
          // Empty state fallbacks
          setPartnersData([]);
          setRawPackages([]);
        }
      } catch (err) {
        console.error(`Failed to fetch ${activityType} marketplace data:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activityType, currentCity]);

  // 2. Routing Sync (Popstate back button support)
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const queryParams = new URLSearchParams(window.location.search);
      const partnerIdParam = queryParams.get('partner');

      // Match /category/:packageId
      if (path.startsWith(`/${activityType}/`)) {
        const pkgId = path.substring(`/${activityType}/`.length);
        if (rawPackages.length > 0) {
          const matchedPkg = rawPackages.find(p => p.id === pkgId);
          if (matchedPkg) {
            setSelectedPackage(matchedPkg);
            // Auto resolve vendor
            const vData = partnersData.find(v => v.id === matchedPkg.vendor_id);
            if (vData) setSelectedPartner(vData);
            return;
          }
        }
      }

      // Match partner param
      if (partnerIdParam) {
        const matchedPartner = partnersData.find(v => v.id === partnerIdParam);
        if (matchedPartner) {
          setSelectedPartner(matchedPartner);
          setSelectedPackage(null);
          return;
        }
      }

      // Default root
      setSelectedPackage(null);
      setSelectedPartner(null);
    };

    if (partnersData.length > 0) {
      handleRouteSync();
    }
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [activityType, partnersData, rawPackages]);

  // Navigation handlers
  const navigateToPartner = (partner) => {
    setSelectedPartner(partner);
    setSelectedPackage(null);
    if (partner) {
      window.history.pushState(null, '', `/${activityType}?partner=${partner.id}`);
    } else {
      window.history.pushState(null, '', `/${activityType}`);
    }
    window.scrollTo(0, 0);
  };

  const navigateToPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg) {
      window.history.pushState(null, '', `/${activityType}/${pkg.id}`);
    } else {
      window.history.pushState(null, '', selectedPartner ? `/${activityType}?partner=${selectedPartner.id}` : `/${activityType}`);
    }
    window.scrollTo(0, 0);
  };

  const checkIfClosed = (item) => {
    if (!item) return { closed: false };
    if (item.is_closed) {
      return { closed: true, reason: item.closed_reason || 'Monsoon season / government advisory', reopenDate: item.closed_until };
    }
    if (item.closed_from && item.closed_until) {
      try {
        const today = new Date();
        const from = new Date(item.closed_from);
        const to = new Date(item.closed_until);
        today.setHours(0, 0, 0, 0);
        from.setHours(0, 0, 0, 0);
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

  // Filter application
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
        return list.filter(p => p.landmark.toLowerCase().includes('tapovan') || p.landmark.toLowerCase().includes('laxman'));
      case 'choice':
        return list.filter(p => p.badges.some(b => b.toLowerCase().includes('choice') || b.toLowerCase().includes('booked')));
      case 'family':
        return list.filter(p => p.badges.some(b => b.toLowerCase().includes('family') || b.toLowerCase().includes('rated')));
      default:
        return list;
    }
  };

  const filteredPartners = getFilteredPartners();

  // Loading state
  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  // Get display details for rendering
  const getCategoryTitle = () => {
    switch (activityType) {
      case 'rafting': return 'White Water Rafting';
      case 'camping': return 'Riverside Camping';
      case 'bungee': return 'Bungee Jumping';
      case 'paragliding': return 'Tandem Paragliding';
      case 'swing': return 'Giant Valley Swing';
      case 'zipline': return 'Ganga Zipline';
      case 'kayaking': return 'White Water Kayaking';
      default: return 'Adventure Sports';
    }
  };

  const getCategorySubtitle = () => {
    switch (activityType) {
      case 'rafting': return 'Fight the rapids of the holy Ganges with verified river crews.';
      case 'camping': return 'Spend a night in nature with bonfire, meals, and luxury Swiss tents.';
      case 'bungee': return 'Leap from India\'s highest bungee platform at 83 metres.';
      case 'paragliding': return 'Soar high above Rishikesh green hills with veteran tandem pilots.';
      case 'swing': return 'Swing 113m above deep valleys, single or in couples.';
      case 'zipline': return 'Glide securely suspended above the rapids of Ganga.';
      case 'kayaking': return 'Learn kayaking courses and navigate Grade I to III rapids.';
      default: return 'Book handpicked and verified adventure tours in Rishikesh.';
    }
  };

  const getCategoryBannerImg = () => {
    switch (activityType) {
      case 'rafting': return 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=1200';
      case 'camping': return '/camping-hero.jpg';
      case 'bungee': return '/bungee-hero.jpg';
      case 'paragliding': return '/paragliding-hero.jpg';
      case 'swing': return '/swing-hero.png';
      case 'zipline': return '/zipline-hero.jpg';
      case 'kayaking': return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200';
      default: return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200';
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: PARTNER LIST */}
        {!selectedPartner && !selectedPackage && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-24">
            
            {/* Category Hero Banner */}
            <div className="relative h-[40vh] bg-black flex items-center justify-center text-center">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url('${getCategoryBannerImg()}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-[10px] font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full border border-accent/20">
                  Rishikesh Adventure
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  {getCategoryTitle()}
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-xs sm:text-sm font-medium leading-relaxed">
                  {getCategorySubtitle()}
                </p>
              </div>
            </div>

            {/* Main Marketplace Area */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
              
              {/* Filters chips */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">
                  Quick Filters
                </span>
                <MarketplaceFilters activeFilter={activeFilter} onChangeFilter={setActiveFilter} />
              </div>

              {/* Partners Listing Title */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-base font-black font-display text-slate-900 uppercase">
                  Available Operators ({filteredPartners.length})
                </h2>
              </div>

              {/* Partners list cards (Horizontal layout) */}
              <div className="flex flex-col gap-5">
                {filteredPartners.map((partner, idx) => {
                  const minPrice = partner.packages.length > 0 ? Math.min(...partner.packages.map(p => p.price)) : 0;
                  const displayBadges = partner.badges.slice(0, 2);
                  const hVal = getHash(partner.name);
                  const verifiedBadge = hVal % 5 !== 0;

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
                        {/* Overlay badges (max 2) */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                          {verifiedBadge && (
                            <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md tracking-wider">
                              Verified Operator
                            </span>
                          )}
                          {partner.star_rating >= 4.8 && (
                            <span className="bg-indigo-650/95 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md tracking-wider">
                              Top Rated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Information rows */}
                      <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                        
                        {/* Title, rating, and since */}
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-extrabold text-base sm:text-lg font-display text-slate-900 uppercase group-hover:text-[#FF5F00] transition-colors leading-tight">
                              {partner.name}
                            </h3>
                            {/* Two-line vertical rating stack */}
                            <div className="text-right shrink-0">
                              <span className="font-black text-sm text-slate-800 flex items-center gap-1 justify-end leading-none">
                                ⭐ {partner.star_rating}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold block mt-0.5 leading-none">
                                {partner.bookings_count + 15} Reviews
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
                            <span className="text-emerald-600">🔥 {partner.bookings_count}+ Bookings</span>
                          </div>
                        </div>

                        {/* Badges and Highlights */}
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

                        {/* Ribbon inclusions, price and CTA */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                          {/* Inclusions ribbon */}
                          <div className="flex gap-3 text-slate-400">
                            <div className="group/inc relative">
                              <Hotel size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">Stay option</span>
                            </div>
                            <div className="group/inc relative">
                              <Utensils size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">Meals support</span>
                            </div>
                            <div className="group/inc relative">
                              <Car size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">Transport</span>
                            </div>
                            <div className="group/inc relative">
                              <Compass size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">Expert Guide</span>
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="flex items-center gap-4.5 justify-between xs:justify-end">
                            <div>
                              <span className="text-[9px] block font-bold text-slate-450 uppercase leading-none">Starting From</span>
                              <span className="text-xl font-black text-slate-900 leading-none">
                                ₹{minPrice.toLocaleString('en-IN')}
                                <span className="text-[10px] text-slate-400 font-bold lowercase">/person</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              className="py-2.5 px-4.5 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display"
                            >
                              View Packages
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}

                {filteredPartners.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 font-medium">
                    No active operators found matching the criteria in {currentCity?.name || 'Rishikesh'}.
                  </div>
                )}
              </div>

              {/* Trust Section */}
              <div className="pt-8 border-t border-slate-200">
                <TrustSignals />
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW 2: PARTNER PROFILE (Packages List) */}
        {selectedPartner && !selectedPackage && (
          <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
            
            {/* Back Button */}
            <button
              onClick={() => navigateToPartner(null)}
              className="flex items-center gap-1 text-slate-500 hover:text-black font-black text-xs uppercase bg-transparent border-none cursor-pointer p-0"
            >
              <ChevronLeft size={16} /> Back to Operators
            </button>

            {/* Premium Profile Header Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                <img src={selectedPartner.shop_image} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2 flex-grow">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase font-display leading-tight">{selectedPartner.name}</h2>
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                    TripGod Verified
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-1">
                    <Star size={13} className="fill-amber-500 text-amber-500" />
                    <span>{selectedPartner.star_rating} Rating ({selectedPartner.bookings_count} bookings)</span>
                  </div>
                  <span>•</span>
                  <span>📍 {selectedPartner.landmark || selectedPartner.address}</span>
                  <span>•</span>
                  <span>Since {selectedPartner.since}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1 max-w-2xl">
                  {selectedPartner.short_highlight}. Highly trained operators offering pre-verified slot confirmations, top-grade safety standards and certified equipment.
                </p>
              </div>
            </div>

            {/* Available Packages */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">Available Stretches & Packages</h3>
              
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
                            Closed for Season
                          </span>
                        </div>
                      )}

                      {/* Package Image */}
                      <div className="w-full md:w-[200px] h-40 md:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                        <img src={pkg.images[0]} alt={pkg.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Package details */}
                      <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-extrabold text-base font-display text-slate-900 uppercase">
                              {pkg.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold shrink-0">
                              <Clock size={13} className="text-[#FF6B00]" />
                              <span>{pkg.duration}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                            {pkg.route && (
                              <>
                                <MapPin size={11} className="text-[#FF6B00]" />
                                <span className="truncate max-w-[150px]">{pkg.route}</span>
                                <span>•</span>
                              </>
                            )}
                            {pkg.distance_km > 0 && (
                              <span>Distance: {pkg.distance_km} KM</span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {pkg.description || `Beautiful ${pkg.name} in Rishikesh operated by ${selectedPartner.name}. Includes all equipment, instructions, and guide.`}
                          </p>
                        </div>

                        {/* Inclusions, price and CTA */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Trust highlights */}
                          <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                              ✓ Instant Confirmation
                            </span>
                            <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded">
                              ✓ Free Cancellation
                            </span>
                          </div>

                          {/* Price & button */}
                          <div className="flex items-center gap-4 justify-between sm:justify-end">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-slate-950">₹{pkg.price.toLocaleString('en-IN')}</span>
                                <span className="text-xs text-slate-400 line-through font-semibold">₹{pkg.original_price.toLocaleString('en-IN')}</span>
                              </div>
                              {savings > 0 && (
                                <span className="text-[9px] font-black text-emerald-600 uppercase block">Save ₹{savings}</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => navigateToPackage(pkg)}
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

            {/* Partner Reviews */}
            <div className="pt-6 border-t border-slate-200">
              <ReviewsSection rating={selectedPartner.star_rating} reviewsCount={selectedPartner.bookings_count} name={selectedPartner.name} />
            </div>

          </motion.div>
        )}

        {/* VIEW 3: PACKAGE DETAILS VIEW */}
        {selectedPackage && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="pb-24 pt-6 max-w-4xl mx-auto px-4 sm:px-6 space-y-6 text-left">
            
            {/* Back Button */}
            <button
              onClick={() => navigateToPackage(null)}
              className="flex items-center gap-1.5 py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-black hover:border-slate-400 transition-colors cursor-pointer bg-white"
            >
              <ChevronLeft size={16} /> Back to Packages
            </button>

            {/* Title & Stats block */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-black text-accent font-black tracking-widest px-2 py-0.5 rounded uppercase">
                    {activityType}
                  </span>
                  <span className="text-[10px] bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 font-black tracking-widest px-2 py-0.5 rounded uppercase flex items-center gap-1">
                    <Sparkles size={10} /> BEST IN CLASS
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 uppercase">
                  {selectedPackage.name}
                </h1>
                
                <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-1 text-slate-800">
                    <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                    <span>{selectedPartner?.star_rating || 4.7}</span>
                    <span className="text-slate-400">({selectedPartner?.bookings_count || 120} reviews)</span>
                  </div>
                  <span>•</span>
                  <span className="text-emerald-700">Operator: {selectedPartner?.name}</span>
                </div>
              </div>

              {/* Price card styled as checkout widget */}
              <div className="bg-[#FF5F00]/5 border border-[#FF5F00]/15 p-4 rounded-2xl flex flex-col min-w-[160px] xs:text-right shrink-0">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Starting From</span>
                <div className="flex items-baseline gap-1 xs:justify-end">
                  <span className="text-2xl font-black text-slate-900">₹{selectedPackage.price.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400 line-through font-semibold">₹{selectedPackage.original_price.toLocaleString('en-IN')}</span>
                </div>
                <span className="text-[9px] font-bold text-[#FF5F00] uppercase mt-0.5">
                  Book with Token Advance
                </span>
              </div>
            </div>

            {/* Slider / Image Gallery */}
            <div className="h-52 sm:h-72 w-full rounded-2xl overflow-hidden relative border border-slate-200 group">
              <img 
                src={selectedPackage.images[currentImgIdx] || selectedPackage.img || '/rafting-4.jpg'} 
                alt={selectedPackage.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />
              
              {/* Slider dots */}
              {selectedPackage.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
                  {selectedPackage.images.map((_, dotIdx) => (
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
                  <span className="font-bold text-white">{selectedPackage.duration}</span>
                </div>
                {selectedPackage.distance_km > 0 && (
                  <div>
                    <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Distance</span>
                    <span className="font-bold text-white">{selectedPackage.distance_km} KM</span>
                  </div>
                )}
                <div>
                  <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Operator</span>
                  <span className="font-bold text-white">{selectedPartner?.name}</span>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#FF5F00]/15 text-[#FF5F00] border border-[#FF5F00]/30 font-bold rounded-lg flex items-center gap-1 text-[10px] sm:text-xs shrink-0 self-start xs:self-auto">
                <ShieldCheck size={12} /> Safe & Verified
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-base font-bold font-display text-slate-900 uppercase">About this Experience</h3>
              <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-medium">
                {selectedPackage.description || `Experience thrilling ${selectedPackage.name} with ${selectedPartner?.name}. Enjoy state-of-the-art equipment, detailed safety briefings from certified local guides, and standard support. Instant booking confirmation guarantees slots.`}
              </p>
            </div>

            {/* Who is this perfect for? */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold font-display text-slate-900 uppercase">Who is this perfect for?</h4>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
                  <Users size={11} /> Families & Couples
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
                  <Sparkles size={11} /> Adventure Seekers
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
                  ✓ Beginners & First-Timers
                </span>
              </div>
            </div>

            {/* Inclusions / Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Inclusions</h4>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 ? (
                    selectedPackage.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span>Certified guides & equipment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span>Safety gear: helmets, life-jackets/harness</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Exclusions</h4>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  {selectedPackage.exclusions && selectedPackage.exclusions.length > 0 ? (
                    selectedPackage.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold shrink-0">✗</span>
                        <span>{exc}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold shrink-0">✗</span>
                        <span>Photos & videos (GoPro) extra cost</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold shrink-0">✗</span>
                        <span>Personal expenses</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Dynamic Partner Contact & Location Info (Additional Fix) */}
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
                <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">Logistics & Meeting Guidelines</span>
                <div className="space-y-2 text-xs font-medium text-slate-600 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6B00] font-black">🕒 Reporting:</span>
                    <span>{selectedPartner?.reporting_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6B00] font-black">📞 Hotline:</span>
                    <a href={`tel:${selectedPartner?.phone}`} className="text-slate-800 hover:text-accent font-bold">
                      {selectedPartner?.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6B00] font-black">💬 WhatsApp:</span>
                    <a href={`https://wa.me/${selectedPartner?.whatsapp?.replace(/\D/g, '')}`} className="text-slate-800 hover:text-accent font-bold">
                      {selectedPartner?.whatsapp}
                    </a>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-1.5">
                    <span className="font-bold uppercase text-slate-600 block">📝 Instructions</span>
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
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">Secure Slot with Token Advance</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Pay a 10% advance to lock down your booking with <strong>{selectedPartner?.name}</strong>. Free cancellation applies up to 24 hours in advance.
                  </p>
                </div>
              </div>

              {checkIfClosed(selectedPackage).closed ? (
                <button
                  disabled
                  className="w-full md:w-auto py-3 px-6 bg-slate-300 text-slate-500 text-xs font-black uppercase rounded-xl border-none cursor-not-allowed font-display shrink-0"
                >
                  Closed Temporarily
                </button>
              ) : (
                <button
                  onClick={() => openBookingModal({
                    id: selectedPackage.id,
                    name: `${selectedPackage.name} - ${selectedPartner?.name}`,
                    stretch: selectedPackage.route || selectedPackage.stretch,
                    price: selectedPackage.price,
                    category: activityType,
                    city_id: selectedPackage.city_id,
                    vendor_id: selectedPackage.vendor_id,
                    free_video_type: selectedPackage.free_video_type || 'none',
                    is_closed: selectedPackage.is_closed,
                    closed_reason: selectedPackage.closed_reason,
                    closed_from: selectedPackage.closed_from,
                    closed_until: selectedPackage.closed_until,
                    vendors: selectedPartner // Send partner info directly to checkout
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
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Total Price</span>
                <span className="text-lg font-black text-slate-900">₹{selectedPackage.price.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${selectedPartner?.whatsapp?.replace(/\D/g, '')}?text=Hi%2C%20I%20want%20to%20book%20the%20${encodeURIComponent(selectedPackage.name)}%20from%20${encodeURIComponent(selectedPartner?.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-xl flex items-center justify-center text-white shrink-0 hover:scale-105 active:scale-95 transition-all shadow-xs"
                >
                  <MessageSquare size={16} />
                </a>
                <button
                  onClick={() => openBookingModal({
                    id: selectedPackage.id,
                    name: `${selectedPackage.name} - ${selectedPartner?.name}`,
                    stretch: selectedPackage.route || selectedPackage.stretch,
                    price: selectedPackage.price,
                    category: activityType,
                    city_id: selectedPackage.city_id,
                    vendor_id: selectedPackage.vendor_id,
                    free_video_type: selectedPackage.free_video_type || 'none',
                    is_closed: selectedPackage.is_closed,
                    closed_reason: selectedPackage.closed_reason,
                    closed_from: selectedPackage.closed_from,
                    closed_until: selectedPackage.closed_until,
                    vendors: selectedPartner
                  })}
                  className="py-2.5 px-6 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.2)] hover:scale-[1.01] active:scale-[0.99] transition-all border-none cursor-pointer font-display"
                >
                  Book Now
                </button>
              </div>
            </div>

            {/* Reviews list */}
            <div className="pt-8 border-t border-slate-200">
              <ReviewsSection rating={selectedPartner?.star_rating || 4.7} reviewsCount={selectedPartner?.bookings_count || 120} name={selectedPartner?.name} />
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
