import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Star, Clock, MapPin, ShieldCheck, 
  HelpCircle, Sparkles, Smartphone, Calendar, Phone, 
  MessageSquare, ExternalLink, Info, ArrowRight, Check,
  Hotel, Utensils, Car, Compass, Users,
  Shield, Camera, Award, Flame, Tent, Zap, Activity
} from 'lucide-react';
import { supabase } from '../supabase';
import MarketplaceFilters from './MarketplaceFilters';
import ReviewsSection from './ReviewsSection';
import TrustSignals from './TrustSignals';
import DiningAndMealPanel from './DiningAndMealPanel';
import VendorImageCarousel from './VendorImageCarousel';

// Consistent hash generator for mock data
const getHash = (str) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return Math.abs(hash);
};

const getInclusionsRibbon = (activityType) => {
  switch (activityType) {
    case 'rafting':
    case 'kayaking':
      return [
        { name: 'Professional Raft & Gear', icon: Shield, desc: 'Premium rafts & lifejackets' },
        { name: 'Certified River Guide', icon: Compass, desc: 'Government approved experts' },
        { name: 'DSLR Video Support', icon: Camera, desc: 'Optional media coverage' },
        { name: 'Instant Slots', icon: Zap, desc: 'Immediate confirmations' }
      ];
    case 'camping':
      return [
        { name: 'Premium Swiss Tents', icon: Tent, desc: 'Comfortable stay with beds' },
        { name: 'Buffet Meals Support', icon: Utensils, desc: 'Breakfast, Lunch & Dinner' },
        { name: 'Bonfire & Music', icon: Flame, desc: 'Evening campfire activities' },
        { name: 'In-camp Games', icon: Activity, desc: 'Volleyball, badminton, etc.' }
      ];
    case 'bungee':
    case 'swing':
    case 'zipline':
    case 'paragliding':
      return [
        { name: 'Safety Harness & Gear', icon: Shield, desc: 'Triple redundant lock systems' },
        { name: 'Certified Jump Master', icon: Award, desc: 'Trained instructors only' },
        { name: 'GoPro Video Options', icon: Camera, desc: 'High-def action footage' },
        { name: 'Instant Confirmation', icon: Zap, desc: 'Voucher on WhatsApp' }
      ];
    default:
      return [
        { name: 'Verified Operator', icon: ShieldCheck, desc: 'Safety certified partners' },
        { name: 'Expert Guides', icon: Compass, desc: 'Trained professionals' },
        { name: 'Safety Gear', icon: Shield, desc: 'Tested harness/helmets' }
      ];
  }
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

  const [selectedRoomIdx, setSelectedRoomIdx] = useState(null);
  const [numAdults, setNumAdults] = useState(1);
  const [numKids, setNumKids] = useState(0);
  const [selectedMeals, setSelectedMeals] = useState({});

  // 1. Fetch category data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from('rafting')
          .select('*, vendors(*)');

        if (activityType === 'rafting') {
          query = query.or('activity_type.eq.rafting,activity_type.eq.Rafting,activity_type.is.null');
        } else {
          query = query.or(`activity_type.eq.${activityType},activity_type.eq.${activityType.toLowerCase()}`);
        }

        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }

        let { data, error } = await query;
        if (error || !data || data.length === 0) {
          // Fallback: fetch without city or activity_type filter if initial query was empty
          let fallbackQuery = supabase.from('rafting').select('*, vendors(*)');
          const fallbackRes = await fallbackQuery;
          if (!fallbackRes.error && fallbackRes.data) {
            data = fallbackRes.data;
          }
        }

        if (data && data.length > 0) {
          // Check for any items missing vendor join and fetch them
          const missingVendorIds = [...new Set(data.filter(item => !item.vendors && item.vendor_id).map(item => item.vendor_id))];
          if (missingVendorIds.length > 0) {
            const { data: fetchedVendors } = await supabase
              .from('vendors')
              .select('*')
              .in('id', missingVendorIds);

            if (fetchedVendors && fetchedVendors.length > 0) {
              const vMap = {};
              fetchedVendors.forEach(v => { vMap[v.id] = v; });
              data.forEach(item => {
                if (!item.vendors && item.vendor_id && vMap[item.vendor_id]) {
                  item.vendors = vMap[item.vendor_id];
                }
              });
            }
          }

          setRawPackages(data);

          // Group by vendor
          const partnersMap = {};
          data.forEach(item => {
            let vendor = item.vendors;
            if (!vendor) {
              // Construct fallback vendor object if item.vendors join is null
              const vName = item.vendor_name || item.operator_name || (item.vendor_id ? `Operator ${item.vendor_id}` : 'Verified River Crew');
              const vId = item.vendor_id || `v-${getHash(vName)}`;
              vendor = {
                id: vId,
                name: vName,
                star_rating: item.rating || 4.7,
                address: item.address || item.pickup_location || 'Rishikesh, Uttarakhand',
                landmark: item.landmark || 'Tapovan',
                phone: item.whatsapp_number || item.phone || '+919410572857',
                whatsapp: item.whatsapp_number || '+919410572857'
              };
            }

            if (!partnersMap[vendor.id]) {
              // Generate mock data consistent with vendor id/name if missing
              const hVal = getHash(vendor.name);
              const mockSince = vendor.since || ((hVal % 8) + 2016);
              const mockBookings = vendor.bookings_count || ((hVal % 180) + 120);
              const getActivityInstructions = (type, vName, itemInst, vendorInst) => {
                if (itemInst && itemInst.trim()) return itemInst;
                const act = (type || '').toLowerCase();
                if (vendorInst && vendorInst.trim()) {
                  const isVehicleInst = vendorInst.toLowerCase().includes('driving') || vendorInst.toLowerCase().includes('licence') || vendorInst.toLowerCase().includes('license') || vendorInst.toLowerCase().includes('vehicle');
                  if (!isVehicleInst || act.includes('bike') || act.includes('scoot') || act.includes('rent')) {
                    return vendorInst;
                  }
                }
                if (act.includes('rafting') || act.includes('kayaking')) {
                  return `Please report at raft desk 15 mins before slot time. Wear comfortable synthetic/nylon clothes. Changing room & dry bags provided.`;
                }
                if (act.includes('camping')) {
                  return `Check-in starts at 12:00 PM. Carry personal toiletries, valid photo ID, and warm clothing for evening bonfire.`;
                }
                if (act.includes('bungee') || act.includes('swing') || act.includes('zipline')) {
                  return `Please report 30 mins prior to slot for safety harness & briefing. Body weight limits apply (35kg - 120kg).`;
                }
                if (act.includes('paragliding')) {
                  return `Please report 20 mins prior to slot time. Wear sturdy sports shoes and comfortable clothing.`;
                }
                return `Please report at ${vName} office 15 mins before slot time with your booking confirmation voucher.`;
              };

              const mockInstructions = getActivityInstructions(activityType, vendor.name, item.meeting_instructions, vendor.meeting_instructions);
              const mockReportingTime = vendor.reporting_time || '15 mins before slot';
              const mockParking = vendor.parking_details || 'Free customer parking available';
              const getCategoryHighlightFallback = (type, vName) => {
                switch (type) {
                  case 'rafting': return `${vName} • Certified River Crew & Equipment`;
                  case 'camping': return `${vName} • Riverside Camp & Bonfire Host`;
                  case 'bungee':
                  case 'swing':
                  case 'zipline': return `${vName} • Jump Masters & Safety Lock System`;
                  case 'paragliding': return `${vName} • Tandem Flights with Veteran Pilots`;
                  default: return `${vName} • Pre-verified Slot Confirmations`;
                }
              };
              const mockHighlight = vendor.short_highlight || getCategoryHighlightFallback(activityType, vendor.name);
              
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
                shop_image: vendor.shop_image || (vendor.shop_images && vendor.shop_images[0]) || 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=600',
                shop_images: Array.isArray(vendor.shop_images) && vendor.shop_images.length > 0 
                  ? vendor.shop_images 
                  : [(vendor.shop_image || 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=600')],
                phone: vendor.phone || vendor.whatsapp || '+919410572857',
                whatsapp: vendor.whatsapp || vendor.phone || '+919410572857',
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
    setSelectedRoomIdx(null);
    setNumAdults(1);
    setNumKids(0);
    setSelectedMeals({});
    setCurrentImgIdx(0);
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

  // Filter application connected to vendor backend landmark fields
  const getFilteredPartners = () => {
    let list = [...partnersData];
    if (!activeFilter) return list;

    const LOCATION_MAP = {
      'ramjhula': ['ram jhula', 'ramjhula', 'shivanand'],
      'laxmanjhula': ['laxman jhula', 'lakshman jhula', 'laxmanjhula'],
      'jankisetu': ['janki setu', 'jankisetu'],
      'tapovan': ['tapovan'],
      'busstand': ['bus stand', 'isbt', 'busstand', 'main bus'],
      'yognagri': ['yog nagri', 'yognagri', 'yog nagari'],
      'oldrailway': ['old railway', 'railway station', 'station']
    };

    const terms = LOCATION_MAP[activeFilter];
    if (terms && terms.length > 0) {
      const matched = list.filter(p => {
        const landmarkText = (p.landmark || '').toLowerCase();
        const addressText = (p.address || '').toLowerCase();
        const nameText = (p.name || '').toLowerCase();
        return terms.some(t => landmarkText.includes(t) || addressText.includes(t) || nameText.includes(t));
      });
      return matched;
    }
    return list;
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
            
            {/* Compact Category Hero Banner */}
            <div className="relative py-6 sm:py-9 bg-slate-950 flex items-center justify-center text-center border-b border-slate-800/80 overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 blur-xs scale-105"
                style={{ backgroundImage: `url('${getCategoryBannerImg()}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />
              <div className="relative z-10 space-y-1.5 px-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-1.5 bg-accent/15 text-[#FF5F00] text-[9px] font-black px-2.5 py-0.5 rounded-full border border-accent/30 tracking-widest uppercase mb-0.5">
                  RISHIKESH ADVENTURE
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white font-display tracking-tight uppercase leading-tight">
                  {getCategoryTitle()}
                </h1>
                <p className="text-slate-300 text-[11px] sm:text-xs font-medium leading-normal max-w-md mx-auto">
                  {getCategorySubtitle()}
                </p>
              </div>
            </div>

            {/* Main Marketplace Area */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
              
              {/* Premium Location Quick Filters Bar (Hotel Style) */}
              <div className="sticky top-4 z-30 w-full max-w-full bg-gradient-to-r from-blue-950 to-blue-900 border border-blue-800 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden">
                {/* Result Counter */}
                <div className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                  Showing {filteredPartners.length} Available Partners
                </div>
                
                {/* Horizontal Scrollable Location Chips UI (No Emojis, Connected to Backend Landmark) */}
                <div className="w-full flex overflow-x-auto whitespace-nowrap hide-scrollbar items-center gap-2 pb-1 sm:pb-0 snap-x select-none max-w-full">
                  {[
                    { id: null, label: 'All Partners' },
                    { id: 'ramjhula', label: 'Ram Jhula' },
                    { id: 'laxmanjhula', label: 'Laxman Jhula' },
                    { id: 'jankisetu', label: 'Janki Setu' },
                    { id: 'tapovan', label: 'Tapovan' },
                    { id: 'busstand', label: 'Rishikesh Bus Stand' },
                    { id: 'yognagri', label: 'Yog Nagri Rishikesh' },
                    { id: 'oldrailway', label: 'Old Railway Station' }
                  ].map(chip => {
                    const isActive = activeFilter === chip.id;
                    return (
                      <button
                        key={chip.id || 'all'}
                        type="button"
                        onClick={() => setActiveFilter(chip.id)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-[#FF5F00] text-white border-[#FF5F00] shadow-[0_4px_12px_rgba(255,95,0,0.4)] scale-105'
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Partners list cards (Horizontal layout) */}
              <div className="flex flex-col gap-5">
                {filteredPartners.map((partner, idx) => {
                  const minPrice = partner.packages.length > 0 ? Math.min(...partner.packages.map(p => p.price)) : 0;
                  const displayBadges = partner.badges.slice(0, 2);
                  const hVal = getHash(partner.name);
                  const verifiedBadge = hVal % 5 !== 0;
                  const inclusions = getInclusionsRibbon(activityType);

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
                        <VendorImageCarousel
                          images={partner.shop_images && partner.shop_images.length > 0 ? partner.shop_images : [partner.shop_image]}
                          alt={partner.name}
                          interval={3000}
                        >
                          {/* Overlay badges (max 2) */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                            {verifiedBadge && (
                              <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md tracking-wider">
                                Verified Partner
                              </span>
                            )}
                            {partner.star_rating >= 4.8 && (
                              <span className="bg-indigo-650/95 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md tracking-wider">
                                Top Rated
                              </span>
                            )}
                          </div>
                        </VendorImageCarousel>
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
                        <div className="flex flex-wrap items-center gap-2">
                          {displayBadges.map((badge, bIdx) => (
                            <span key={bIdx} className="text-[9px] font-black uppercase text-[#FF6B00] bg-[#FF6B00]/5 border border-[#FF6B00]/10 px-2 py-0.5 rounded">
                              {badge}
                            </span>
                          ))}
                          <span className="text-[9px] text-slate-655 font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded">
                            ⚡ {partner.short_highlight}
                          </span>
                        </div>

                        {/* Ribbon inclusions, price and CTA */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                          {/* Inclusions ribbon */}
                          <div className="flex gap-3 text-slate-400">
                            {inclusions.map((inc, iIdx) => {
                              const IncIcon = inc.icon;
                              return (
                                <div key={iIdx} className="group/inc relative">
                                  <IncIcon size={14} className="hover:text-[#FF6B00] transition-colors cursor-help" />
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded opacity-0 group-hover/inc:opacity-100 transition-opacity whitespace-nowrap mb-1">
                                    {inc.name}
                                  </span>
                                </div>
                              );
                            })}
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

            {/* Premium Cover Banner Header Section */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs flex flex-col text-left">
              {/* Cover Banner Image */}
              <div className="w-full h-44 sm:h-64 relative bg-slate-900 overflow-hidden">
                <VendorImageCarousel
                  images={selectedPartner.shop_images && selectedPartner.shop_images.length > 0 ? selectedPartner.shop_images : [selectedPartner.shop_image]}
                  alt={selectedPartner.name}
                  interval={3000}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute bottom-5 left-5 right-5 text-white space-y-1 z-10 pointer-events-none">
                    <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-md w-max inline-block">
                      ✓ TripGod Verified Partner
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white uppercase mt-1 drop-shadow-sm">
                      {selectedPartner.name}
                    </h2>
                  </div>
                </VendorImageCarousel>
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
                  <span className="text-emerald-600">🛡️ Certified Crew</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-655 leading-relaxed font-medium max-w-3xl">
                  ⚡ {selectedPartner.short_highlight || `${selectedPartner.name} • Verified Operator in ${selectedPartner.landmark || 'Rishikesh'}`}. {selectedPartner.meeting_instructions || `Certified safety standards, top-grade equipment, and instant slot confirmations.`}
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
                            {activityType === 'camping' && pkg.rooms_left !== undefined && pkg.rooms_left !== null && Number(pkg.rooms_left) > 0 && Number(pkg.rooms_left) <= 5 && (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-black animate-pulse">
                                🔥 Only {pkg.rooms_left} Tents Left!
                              </span>
                            )}
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
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="pb-32 pt-6 max-w-4xl mx-auto px-4 sm:px-6 space-y-6 text-left">
            
            {/* Back Button */}
            <button
              onClick={() => navigateToPackage(null)}
              className="flex items-center gap-1.5 py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-black hover:border-slate-400 transition-colors cursor-pointer bg-white"
            >
              <ChevronLeft size={16} /> Back to Packages
            </button>

            {/* Title & Stats block & Dynamic Pricing Calculations */}
            {(() => {
              const activeRoomPrice = (selectedRoomIdx !== null && selectedPackage.rules?.room_categories?.[selectedRoomIdx]?.price)
                ? Number(selectedPackage.rules.room_categories[selectedRoomIdx].price)
                : Number(selectedPackage.price);

              const activeOriginalPrice = (selectedRoomIdx !== null && selectedPackage.rules?.room_categories?.[selectedRoomIdx]?.original_price)
                ? Number(selectedPackage.rules.room_categories[selectedRoomIdx].original_price)
                : (selectedPackage.original_price ? Number(selectedPackage.original_price) : null);

              const activeImages = (selectedRoomIdx !== null && selectedPackage.rules?.room_categories?.[selectedRoomIdx]?.images?.length > 0)
                ? selectedPackage.rules.room_categories[selectedRoomIdx].images
                : selectedPackage.images;

              const maxPerTent = selectedPackage.max_guests_per_tent || selectedPackage.rules?.max_guests_per_tent || 3;
              const totalGuests = Math.max(1, numAdults + numKids);
              const calculatedTents = activityType === 'camping' ? Math.max(1, Math.ceil(totalGuests / maxPerTent)) : 1;
              const tentsLeft = selectedPackage.rooms_left !== undefined && selectedPackage.rooms_left !== null ? Number(selectedPackage.rooms_left) : 5;

              // Meal Costs calculation
              let mealCostPerGuestPerNight = 0;
              const mealsRule = selectedPackage.rules?.meals;
              if (mealsRule) {
                if (mealsRule.breakfast?.status === 'paid' && selectedMeals.breakfast) mealCostPerGuestPerNight += (Number(mealsRule.breakfast.price) || 150);
                if (mealsRule.lunch?.status === 'paid' && selectedMeals.lunch) mealCostPerGuestPerNight += (Number(mealsRule.lunch.price) || 250);
                if (mealsRule.dinner?.status === 'paid' && selectedMeals.dinner) mealCostPerGuestPerNight += (Number(mealsRule.dinner.price) || 300);
              }
              const totalMealCost = activityType === 'camping' ? (mealCostPerGuestPerNight * totalGuests) : 0;
              const totalPrice = activityType === 'camping' ? ((activeRoomPrice * calculatedTents) + totalMealCost) : (activeRoomPrice * totalGuests);

              const selectedCategoryName = selectedRoomIdx !== null && selectedPackage.rules?.room_categories?.[selectedRoomIdx]?.name
                ? selectedPackage.rules.room_categories[selectedRoomIdx].name
                : (activityType === 'camping' ? 'Standard Tent' : '');

              return (
                <>
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
                      <span className="text-[9px] font-bold text-slate-450 uppercase block">Total Price</span>
                      <div className="flex items-baseline gap-1 xs:justify-end">
                        <span className="text-2xl font-black text-slate-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                        {activeOriginalPrice && activeOriginalPrice > activeRoomPrice && (
                          <span className="text-xs text-slate-400 line-through font-semibold">₹{(activeOriginalPrice * (activityType === 'camping' ? calculatedTents : totalGuests)).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-[#FF5F00] uppercase mt-0.5">
                        {activityType === 'camping' ? `${calculatedTents} Tent${calculatedTents > 1 ? 's' : ''} · ${totalGuests} Guest${totalGuests > 1 ? 's' : ''}` : 'Book with Token Advance'}
                      </span>
                    </div>
                  </div>

                  {/* Slider / Image Gallery */}
                  <div className="h-52 sm:h-72 w-full rounded-2xl overflow-hidden relative border border-slate-200 group">
                    <img 
                      src={activeImages[currentImgIdx] || selectedPackage.images[0] || selectedPackage.img || '/rafting-4.jpg'} 
                      alt={selectedPackage.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />
                    
                    {/* Slider dots */}
                    {activeImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
                        {activeImages.map((_, dotIdx) => (
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
                      {activityType === 'camping' ? (
                        <div>
                          <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Stay Capacity</span>
                          <span className="font-bold text-white">{calculatedTents} Tent{calculatedTents > 1 ? 's' : ''} ({maxPerTent} Max/Tent)</span>
                        </div>
                      ) : (
                        selectedPackage.distance_km > 0 && (
                          <div>
                            <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Distance</span>
                            <span className="font-bold text-white">{selectedPackage.distance_km} KM</span>
                          </div>
                        )
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

                  {/* SECTION: CAMP CATEGORY SELECTOR */}
                  {selectedPackage.rules?.room_categories && selectedPackage.rules.room_categories.length > 0 && (
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-left space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF5F00] to-[#FF8533] flex items-center justify-center text-white shadow-xs">
                          <Tent size={14} />
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">Select Camp / Room Category</h3>
                          <p className="text-[10px] text-slate-400 font-semibold">Choose your preferred tent accommodation type</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Base Tent Option */}
                        {(() => {
                          const isSelected = selectedRoomIdx === null;
                          const discount = selectedPackage.original_price && Number(selectedPackage.original_price) > Number(selectedPackage.price)
                            ? Math.round((1 - Number(selectedPackage.price) / Number(selectedPackage.original_price)) * 100) : null;
                          return (
                            <button
                              type="button"
                              onClick={() => { setSelectedRoomIdx(null); setCurrentImgIdx(0); }}
                              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                                isSelected ? 'bg-gradient-to-br from-orange-50/70 to-orange-100/40 border-2 border-[#FF5F00] shadow-sm scale-[1.01]' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute top-2.5 right-2.5 bg-[#FF5F00] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">Selected</span>
                              )}
                              {discount && (
                                <span className={`absolute ${isSelected ? 'top-8' : 'top-2.5'} right-2.5 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase px-2 py-0.5 rounded-full`}>{discount}% OFF</span>
                              )}
                              <div>
                                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Standard Tent Stay</span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-lg font-black text-slate-900">₹{Number(selectedPackage.price).toLocaleString('en-IN')}</span>
                                  {selectedPackage.original_price && Number(selectedPackage.original_price) > Number(selectedPackage.price) && (
                                    <span className="text-xs text-slate-400 line-through">₹{Number(selectedPackage.original_price).toLocaleString('en-IN')}</span>
                                  )}
                                </div>
                                <span className="block text-[9px] font-bold text-emerald-600 uppercase mt-1">Base Stay Rate</span>
                              </div>
                              {selectedPackage.images && selectedPackage.images.length > 0 && (
                                <div className="w-full h-20 rounded-xl overflow-hidden mt-3 bg-slate-200">
                                  <img src={selectedPackage.images[0]} alt="Standard Tent" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </button>
                          );
                        })()}

                        {/* Upgraded Tent Categories */}
                        {selectedPackage.rules.room_categories.map((room, rIdx) => {
                          const isSelected = selectedRoomIdx === rIdx;
                          const discount = room.original_price && Number(room.original_price) > Number(room.price)
                            ? Math.round((1 - Number(room.price) / Number(room.original_price)) * 100) : null;
                          const roomImages = Array.isArray(room.images) ? room.images : [];
                          return (
                            <button
                              type="button"
                              key={rIdx}
                              onClick={() => { setSelectedRoomIdx(rIdx); setCurrentImgIdx(0); }}
                              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                                isSelected ? 'bg-gradient-to-br from-orange-50/70 to-orange-100/40 border-2 border-[#FF5F00] shadow-sm scale-[1.01]' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute top-2.5 right-2.5 bg-[#FF5F00] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">Selected</span>
                              )}
                              {discount && (
                                <span className={`absolute ${isSelected ? 'top-8' : 'top-2.5'} right-2.5 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase px-2 py-0.5 rounded-full`}>{discount}% OFF</span>
                              )}
                              <div>
                                <span className="block text-[10px] font-black text-slate-800 uppercase tracking-wider mb-1">{room.name}</span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-lg font-black text-slate-900">₹{Number(room.price).toLocaleString('en-IN')}</span>
                                  {room.original_price && Number(room.original_price) > Number(room.price) && (
                                    <span className="text-xs text-slate-400 line-through">₹{Number(room.original_price).toLocaleString('en-IN')}</span>
                                  )}
                                </div>
                                <span className="block text-[9px] font-bold text-[#FF5F00] uppercase mt-1">Upgrade Tent Option</span>

                                {/* Extra Feature Badges */}
                                {Array.isArray(room.features) && room.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {room.features.map((feat, fIdx) => (
                                      <span key={fIdx} className="text-[8px] font-black text-[#FF5F00] bg-orange-100/80 border border-orange-200/80 px-1.5 py-0.5 rounded">
                                        {feat}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {roomImages.length > 0 && (
                                <div className="w-full h-20 rounded-xl overflow-hidden mt-3 bg-slate-200">
                                  <img src={roomImages[0]} alt={room.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SECTION: GUESTS & AUTO-TENT CALCULATOR */}
                  {activityType === 'camping' && (
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-left space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF5F00] flex items-center justify-center">
                            <Users size={15} />
                          </div>
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
                              {activityType === 'camping' ? 'Select Guests & Tents Calculation' : 'Select Guests'}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {activityType === 'camping' ? `Tents automatically calculated (Max ${maxPerTent} guests / tent)` : 'Select total number of guests for booking'}
                            </p>
                          </div>
                        </div>

                        {activityType === 'camping' && tentsLeft <= 5 && (
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full animate-pulse">
                            🔥 Only {tentsLeft} Tents Left!
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Adults Counter */}
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <div>
                            <span className="block text-xs font-black text-slate-900 uppercase">Adults</span>
                            <span className="text-[10px] text-slate-400 font-medium">18+ Years</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setNumAdults(prev => Math.max(1, prev - 1))}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >-</button>
                            <span className="text-sm font-black text-slate-900 min-w-[16px] text-center">{numAdults}</span>
                            <button
                              type="button"
                              onClick={() => setNumAdults(prev => prev + 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >+</button>
                          </div>
                        </div>

                        {/* Kids Counter */}
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <div>
                            <span className="block text-xs font-black text-slate-900 uppercase">Children</span>
                            <span className="text-[10px] text-slate-400 font-medium">5-17 Years</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setNumKids(prev => Math.max(0, prev - 1))}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >-</button>
                            <span className="text-sm font-black text-slate-900 min-w-[16px] text-center">{numKids}</span>
                            <button
                              type="button"
                              onClick={() => setNumKids(prev => prev + 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >+</button>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Summary Bar */}
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Tent size={18} className="text-[#FF5F00] shrink-0" />
                          <div>
                            <span className="text-xs font-black text-slate-900 block font-display">
                              {totalGuests} Guest{totalGuests > 1 ? 's' : ''} = {calculatedTents} Tent{calculatedTents > 1 ? 's' : ''} Selected
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              Max {maxPerTent} guests per tent sharing basis
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#FF5F00] bg-white px-3 py-1 rounded-xl border border-orange-200 shadow-2xs shrink-0 font-display">
                          ₹{activeRoomPrice.toLocaleString('en-IN')} / Tent
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SECTION: CAMP VERIFIED RULES & HIGHLIGHTS */}
                  {activityType === 'camping' && (
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs text-left space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">Verified Camp Highlights & Rules</h3>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">On-Ground Verified</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { key: 'alcohol_allowed', label: 'Alcohol Allowed', icon: '🍷', color: 'text-amber-800 bg-amber-50 border-amber-200' },
                          { key: 'non_veg_allowed', label: 'Non-Veg Food', icon: '🍗', color: 'text-red-800 bg-red-50 border-red-200' },
                          { key: 'riverside_view', label: 'Riverside Beach', icon: '🌊', color: 'text-sky-800 bg-sky-50 border-sky-200' },
                          { key: 'ac_available', label: 'AC / Cooler Tent', icon: '❄️', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
                          { key: 'attached_washroom', label: 'Attached Washroom', icon: '🚽', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
                          { key: 'bonfire_music', label: 'Bonfire & DJ', icon: '🔥', color: 'text-orange-800 bg-orange-50 border-orange-200' },
                          { key: 'parking_available', label: 'Free Parking', icon: '🚗', color: 'text-slate-800 bg-slate-100 border-slate-200' },
                          { key: 'swimming_pool', label: 'Swimming Pool', icon: '🏊', color: 'text-cyan-800 bg-cyan-50 border-cyan-200' }
                        ].map(item => {
                          const isAllowed = selectedPackage.rules?.camp_rules?.[item.key] ?? true;
                          if (!isAllowed) return null;
                          return (
                            <div key={item.key} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold ${item.color}`}>
                              <span className="text-base leading-none">{item.icon}</span>
                              <span className="truncate">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SECTION: MEALS & DINING PANEL */}
                  {selectedPackage.rules?.meals && (
                    <DiningAndMealPanel
                      selectedHotel={{ rules: selectedPackage.rules }}
                      selectedMeals={selectedMeals}
                      setSelectedMeals={setSelectedMeals}
                    />
                  )}

                  {/* Description */}
                  <div className="space-y-3">
                    <h3 className="text-base font-bold font-display text-slate-900 uppercase">About this Experience</h3>
                    <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-medium">
                      {selectedPackage.description || `Experience thrilling ${selectedPackage.name} with ${selectedPartner?.name}. Enjoy state-of-the-art equipment, detailed safety briefings from certified local guides, and standard support. Instant booking confirmation guarantees slots.`}
                    </p>
                  </div>

                  {/* Who is this perfect for? — Symmetrical 4-Option Grid */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black font-display text-slate-900 uppercase tracking-tight">Who is this perfect for?</h4>
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/80">Safety Verified</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 shadow-3xs">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                          <Users size={14} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="block font-black text-[11px] text-indigo-950 uppercase font-display leading-tight">Adults & Teens (14-55 Yrs)</span>
                          <span className="text-[9.5px] text-indigo-700/80 font-medium block">Adheres to Rafting Safety Standards</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 shadow-3xs">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                          <ShieldCheck size={14} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="block font-black text-[11px] text-emerald-950 uppercase font-display leading-tight">First-Timers & Beginners</span>
                          <span className="text-[9.5px] text-emerald-700/80 font-medium block">Certified River Guide Included</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 shadow-3xs">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                          <Zap size={14} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="block font-black text-[11px] text-amber-950 uppercase font-display leading-tight">Thrill Seekers & Youth</span>
                          <span className="text-[9.5px] text-amber-800/80 font-medium block">Grade III/IV Rapids & Cliff Jump</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/60 shadow-3xs">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                          <Sparkles size={14} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="block font-black text-[11px] text-sky-950 uppercase font-display leading-tight">Friend Groups & Corporates</span>
                          <span className="text-[9.5px] text-sky-700/80 font-medium block">8-Person Shared Rafts Available</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Safety & Eligibility Guidelines */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h3 className="text-xs font-bold font-display text-slate-900 uppercase">Safety & Eligibility Criteria</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">⚖️ Weight Range</span>
                        <span className="text-xs font-black text-slate-800">
                          {activityType === 'rafting' || activityType === 'kayaking' ? '35 kg - 100 kg' :
                           activityType === 'bungee' || activityType === 'swing' ? '35 kg - 110 kg' :
                           activityType === 'paragliding' ? '30 kg - 90 kg' :
                           activityType === 'zipline' ? '30 kg - 115 kg' : 'No Limit'}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">🎂 Age Limit</span>
                        <span className="text-xs font-black text-slate-800">
                          {activityType === 'rafting' || activityType === 'kayaking' ? '12 - 60 Years' :
                           activityType === 'bungee' || activityType === 'swing' ? '12 - 45 Years' :
                           activityType === 'paragliding' ? '10 - 60 Years' :
                           activityType === 'zipline' ? '10 - 65 Years' : 'All Ages'}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">🤰 Pregnant Ladies</span>
                        <span className="text-xs font-black text-red-650">
                          {activityType === 'camping' ? 'Allowed with caution' : 'Strictly Not Allowed'}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">🩺 Medical Fitness</span>
                        <span className="text-[10px] font-semibold text-slate-600 leading-tight block">
                          {activityType === 'camping' ? 'Basic physical fitness' : 'Avoid if Heart patient, Asthma or High BP'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inclusions / Exclusions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">Inclusions</h4>
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
                              <span>Certified guides & safety equipment</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-600 font-bold shrink-0">✓</span>
                              <span>Standard safety gear: helmet, life-jackets or harness</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">Exclusions</h4>
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
                              <span>Photos & videos (GoPro/DSLR) extra cost</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-rose-600 font-bold shrink-0">✗</span>
                              <span>Personal travel expenses</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Dynamic Partner Location & Reporting Guidelines */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <MapPin size={16} className="text-[#FF6B00]" />
                        Activity Reporting Office
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                        Verified Address
                      </span>
                    </div>
                    <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column: Location & Maps */}
                        <div className="space-y-3.5 md:border-r md:border-slate-200/80 md:pr-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              <MapPin size={15} className="text-[#FF6B00]" />
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-display">Reporting Location</span>
                              <p className="text-xs font-black text-slate-900 font-display mt-0.5">{selectedPartner?.name || 'Local Activity Partner'} Office</p>
                              <p className="text-[11px] text-slate-600 font-medium leading-snug">{selectedPartner?.address} ({selectedPartner?.landmark})</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">Exact GPS Coordinates</span>
                            {selectedPartner?.google_maps_link ? (
                              <a
                                href={selectedPartner.google_maps_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:from-[#FF6F1A] hover:to-[#FF4E00] text-white text-[11px] font-black uppercase rounded-xl shadow-xs hover:shadow-md transition-all no-underline shrink-0 font-display"
                              >
                                <ExternalLink size={12} /> Open Maps
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-bold">Maps link on confirmation</span>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Timing & Parking */}
                        <div className="space-y-3.5">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              <Clock size={15} className="text-amber-600" />
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-display">Check-in & Reporting</span>
                              <p className="text-xs font-black text-slate-900 font-display mt-0.5">Arrive 15 mins before slot ({selectedPartner?.reporting_time || 'Morning Departure'})</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{selectedPartner?.meeting_instructions || 'Show booking voucher at desk'}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              <Car size={15} className="text-sky-600" />
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-display">Parking Facility</span>
                              <p className="text-[11px] text-slate-800 font-bold leading-tight mt-0.5">{selectedPartner?.parking_details || 'Free parking available'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust and Reviews Section */}
                  <div className="pt-6 border-t border-slate-200">
                    <TrustSignals />
                  </div>

                  {/* Checkout Widget Card */}
                  {(() => {
                    const pMode = selectedPackage.payment_mode || 'commission_advance';
                    const commPct = selectedPackage.commission_percentage !== undefined && selectedPackage.commission_percentage !== null ? Number(selectedPackage.commission_percentage) : 10;
                    const fixedAmt = selectedPackage.fixed_advance_amount !== undefined && selectedPackage.fixed_advance_amount !== null ? Number(selectedPackage.fixed_advance_amount) : 0;

                    let advanceAmount = 0;
                    if (pMode === 'full_payment') {
                      advanceAmount = totalPrice;
                    } else if (pMode === 'fixed_advance') {
                      advanceAmount = fixedAmt;
                    } else {
                      advanceAmount = Math.round((totalPrice * commPct) / 100);
                    }
                    const remainingAmount = Math.max(0, totalPrice - advanceAmount);

                    let paymentTermsLabel = '';
                    if (pMode === 'full_payment') {
                      paymentTermsLabel = 'Pay 100% online now to secure your slot.';
                    } else {
                      paymentTermsLabel = `Pay ₹${advanceAmount.toLocaleString('en-IN')} partial online token now to secure your slot • Pay remaining ₹${remainingAmount.toLocaleString('en-IN')} to operator at venue.`;
                    }

                    return (
                      <div className="bg-[#FFF0E5] border-2 border-[#FF6B00] rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mt-6 shadow-xs">
                        <div className="flex items-start gap-3.5">
                          <ShieldCheck size={28} className="text-[#FF6B00] shrink-0 mt-0.5" />
                          <div className="space-y-1 text-left">
                            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">Secure Slot with Token Advance</h4>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              {paymentTermsLabel} Cancel up to 24 hours prior for a 100% refund.
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
                              name: `${selectedPackage.name}${selectedCategoryName ? ' (' + selectedCategoryName + ')' : ''} - ${selectedPartner?.name}`,
                              stretch: selectedPackage.route || selectedPackage.stretch,
                              price: totalPrice,
                              room_price: activeRoomPrice,
                              num_rooms: calculatedTents,
                              num_adults: numAdults,
                              num_kids: numKids,
                              rooms_left: tentsLeft,
                              tents_left: tentsLeft,
                              selected_meals: selectedMeals,
                              category: activityType,
                              city_id: selectedPackage.city_id,
                              vendor_id: selectedPackage.vendor_id,
                              payment_mode: pMode,
                              commission_percentage: commPct,
                              fixed_advance_amount: fixedAmt,
                              free_video_type: selectedPackage.free_video_type || 'none',
                              is_closed: selectedPackage.is_closed,
                              closed_reason: selectedPackage.closed_reason,
                              closed_from: selectedPackage.closed_from,
                              closed_until: selectedPackage.closed_until,
                              vendors: selectedPartner
                            })}
                            className="w-full md:w-auto py-3 px-6 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display shrink-0"
                          >
                            Book Operator
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Mobile Sticky Booking Bar */}
                  <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200/90 pt-3.5 pb-[max(0.85rem,env(safe-area-inset-bottom))] px-4 flex items-center justify-between gap-3 md:hidden shadow-[0_-12px_40px_rgba(0,0,0,0.15)] after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-40 after:bg-white">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Total Price</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-black text-slate-900 leading-none">₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold leading-none block mt-0.5">
                        {activityType === 'camping' 
                          ? `${calculatedTents} Tent(s) · ${totalGuests} Guest(s)` 
                          : (totalGuests > 1 ? `${totalGuests} Guests (₹${activeRoomPrice}/person)` : 'per person • direct voucher')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const pMode = selectedPackage.payment_mode || 'commission_advance';
                        const commPct = selectedPackage.commission_percentage !== undefined && selectedPackage.commission_percentage !== null ? Number(selectedPackage.commission_percentage) : 10;
                        const fixedAmt = selectedPackage.fixed_advance_amount !== undefined && selectedPackage.fixed_advance_amount !== null ? Number(selectedPackage.fixed_advance_amount) : 0;

                        openBookingModal({
                          id: selectedPackage.id,
                          name: `${selectedPackage.name}${selectedCategoryName ? ' (' + selectedCategoryName + ')' : ''} - ${selectedPartner?.name}`,
                          stretch: selectedPackage.route || selectedPackage.stretch,
                          price: totalPrice,
                          room_price: activeRoomPrice,
                          num_rooms: calculatedTents,
                          num_adults: numAdults,
                          num_kids: numKids,
                          rooms_left: tentsLeft,
                          tents_left: tentsLeft,
                          selected_meals: selectedMeals,
                          category: activityType,
                          city_id: selectedPackage.city_id,
                          vendor_id: selectedPackage.vendor_id,
                          payment_mode: pMode,
                          commission_percentage: commPct,
                          fixed_advance_amount: fixedAmt,
                          free_video_type: selectedPackage.free_video_type || 'none',
                          is_closed: selectedPackage.is_closed,
                          closed_reason: selectedPackage.closed_reason,
                          closed_from: selectedPackage.closed_from,
                          closed_until: selectedPackage.closed_until,
                          vendors: selectedPartner
                        });
                      }}
                      className="py-3 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase rounded-xl shadow-[0_4px_15px_rgba(255,95,0,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <span>Book Now</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Reviews list */}
                  <div className="pt-8 border-t border-slate-200">
                    <ReviewsSection rating={selectedPartner?.star_rating || 4.7} reviewsCount={selectedPartner?.bookings_count || 120} name={selectedPartner?.name} />
                  </div>
                </>
              );
            })()}

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
