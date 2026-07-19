import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Star, MapPin, ShieldCheck, 
  Sparkles, Smartphone, Calendar, Phone, 
  MessageSquare, ExternalLink, Info, ArrowRight, Check,
  Car, Clock, Shield, Tag
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

export default function BikeRent({ currentCity, openBookingModal }) {
  const [vehicles, setVehicles] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // 1. Fetch Bikes & Scooters
  useEffect(() => {
    const fetchBikes = async () => {
      setLoading(true);
      try {
        let query = supabase.from('bikes').select('*, vendors(*)');
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data
            .filter(item => Number(item.price) > 0 && item.is_active !== false) // hide ₹0 and inactive test listings
            .map((item, idx) => ({
              ...item,
              price: Number(item.price),
              deposit: Number(item.deposit || 0),
              rating: item.rating || item.vendors?.star_rating || 4.7,
              reviewsCount: item.reviews_count || (80 + (idx * 17) % 150),
              upi_discount: item.upi_discount ? Number(item.upi_discount) : null,
              images: item.images && item.images.length > 0 ? item.images : ['/scooty-rent.jpg'],
              type: item.name.toLowerCase().includes('scooty') || item.name.toLowerCase().includes('activa') ? 'Automatic Scooter' : 'Cruiser Motorcycle'
            }));
          setVehicles(mapped);

          // Group by partners
          const partnersMap = {};
          mapped.forEach(item => {
            const vendor = item.vendors;
            if (!vendor) return;

            if (!partnersMap[vendor.id]) {
              const hVal = getHash(vendor.name);
              const mockSince = vendor.since || ((hVal % 6) + 2018);
              const mockBookings = vendor.bookings_count || ((hVal % 150) + 110);
              const mockMapsLink = vendor.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.name + ' Rishikesh')}`;
              const mockInstructions = vendor.meeting_instructions || `Please report at ${vendor.name} office for documents verification and vehicle pickup. Carry original DL.`;
              const mockReportingTime = vendor.reporting_time || '09:00 AM - 08:00 PM';
              const mockParking = vendor.parking_details || 'Customer vehicle parking available during rental duration';
              const mockHighlight = vendor.short_highlight || 'Well maintained fleet with fresh helmets';
              
              let mockBadges = vendor.badges || [];
              if (mockBadges.length === 0) {
                if (vendor.star_rating >= 4.8) mockBadges = ['🔥 Best Seller', '⭐ Top Rated'];
                else mockBadges = ['Verified Operator', 'Budget Pick'];
              }

              partnersMap[vendor.id] = {
                id: vendor.id,
                name: vendor.name,
                star_rating: vendor.star_rating || 4.7,
                address: vendor.address || 'Rishikesh, Uttarakhand',
                landmark: vendor.landmark || 'Tapovan',
                shop_image: vendor.shop_image || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600',
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
              operators: [item]
            });
          });
          setPartnersData(Object.values(partnersMap));
        } else {
          setVehicles([]);
          setPartnersData([]);
        }
      } catch (err) {
        console.error('Error fetching bikes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBikes();
  }, [currentCity]);

  // 2. Routing popstate sync
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const queryParams = new URLSearchParams(window.location.search);
      const partnerIdParam = queryParams.get('partner');

      if (path.startsWith('/bikerent/')) {
        const bikeId = path.substring('/bikerent/'.length);
        if (vehicles.length > 0) {
          const matched = vehicles.find(v => v.id === bikeId);
          if (matched) {
            setSelectedVehicle(matched);
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
          setSelectedVehicle(null);
          return;
        }
      }

      setSelectedVehicle(null);
      setSelectedPartner(null);
    };

    if (partnersData.length > 0) {
      handleRouteSync();
    }
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [partnersData, vehicles]);

  // Navigation helpers
  const navigateToPartner = (partner) => {
    setSelectedPartner(partner);
    setSelectedVehicle(null);
    if (partner) {
      window.history.pushState(null, '', `/bikerent?partner=${partner.id}`);
    } else {
      window.history.pushState(null, '', '/bikerent');
    }
    window.scrollTo(0, 0);
  };

  const navigateToVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle) {
      window.history.pushState(null, '', `/bikerent/${vehicle.id}`);
    } else {
      window.history.pushState(null, '', selectedPartner ? `/bikerent?partner=${selectedPartner.id}` : '/bikerent');
    }
    window.scrollTo(0, 0);
  };

  const checkIfClosed = (item) => {
    if (!item) return { closed: false };
    if (item.is_closed) {
      return { closed: true, reason: item.closed_reason || 'Monsoon constraints / maintenance', reopenDate: item.closed_until };
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
        return list.filter(p => p.landmark.toLowerCase().includes('tapovan') || p.landmark.toLowerCase().includes('ramjhula'));
      case 'choice':
        return list.filter(p => p.badges.some(b => b.toLowerCase().includes('seller') || b.toLowerCase().includes('choice')));
      case 'family':
        return list; // All rentals are family friendly
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
        {!selectedPartner && !selectedVehicle && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-24">
            
            {/* Category Hero Banner */}
            <div className="relative h-[40vh] bg-black flex items-center justify-center text-center">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-[10px] font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full border border-accent/20">
                  Rentals
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  Bike & Scooty Rent
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-xs sm:text-sm font-medium leading-relaxed">
                  Explore Rishikesh on your own terms. Activas, Royal Enfields, and adventure tourers available at standard rates.
                </p>
              </div>
            </div>

            {/* Main Listing Grid */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
              
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">
                  Quick Filters
                </span>
                <MarketplaceFilters activeFilter={activeFilter} onChangeFilter={setActiveFilter} />
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-base font-black font-display text-slate-900 uppercase">
                  Available Rental Partners ({filteredPartners.length})
                </h2>
              </div>

              {/* Partners Cards */}
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
                      {/* Left: Cover image */}
                      <div className="w-full sm:w-[220px] h-44 sm:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                        <img
                          src={partner.shop_image}
                          alt={partner.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                          <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md tracking-wider">
                            Verified Rental Desk
                          </span>
                          {partner.star_rating >= 4.8 && (
                            <span className="bg-indigo-650/95 backdrop-blur-xs text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-md tracking-wider">
                              Top Rated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Info */}
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
                                {partner.bookings_count + 23} Reviews
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
                            <span className="text-emerald-600">🔥 {partner.bookings_count}+ Rides Booked</span>
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

                        {/* Price & CTA row */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                          
                          <div className="flex gap-2 text-slate-450 text-[10px] font-black uppercase tracking-wider">
                            <span>Helmet Included</span>
                            <span>•</span>
                            <span>Zero Security Deposit Option</span>
                          </div>

                          <div className="flex items-center gap-4.5 justify-between xs:justify-end">
                            <div>
                              <span className="text-[9px] block font-bold text-slate-450 uppercase leading-none">Starting From</span>
                              <span className="text-xl font-black text-slate-900 leading-none">
                                ₹{minPrice.toLocaleString('en-IN')}
                                <span className="text-[10px] text-slate-400 font-bold lowercase">/day</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              className="py-2.5 px-4.5 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display"
                            >
                              View Fleet
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

        {/* VIEW 2: PARTNER PROFILE (Vehicles list) */}
        {selectedPartner && !selectedVehicle && (
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
                  <span className="text-emerald-600">🛡️ Verified Desk</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-655 leading-relaxed font-medium max-w-3xl">
                  ⚡ {selectedPartner.short_highlight}. Standard rentals with verified registration documents. Explore Rishikesh, Tapovan, and surrounding sights.
                </p>
              </div>
            </div>

            {/* Available Vehicles */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">Available Rental Fleet</h3>

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

                      <div className="w-full md:w-[200px] h-40 md:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                        <img src={pkg.images[0]} alt={pkg.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-extrabold text-base font-display text-slate-900 uppercase">
                              {pkg.name}
                            </h4>
                            <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase font-black tracking-wide text-slate-600 shrink-0">
                              {pkg.type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
                            <span>Refundable Deposit: ₹{pkg.deposit}</span>
                            <span>•</span>
                            <span>Docs: {pkg.documents?.join(', ') || 'DL & Aadhar'}</span>
                          </div>

                          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {pkg.description || `Rent the reliable ${pkg.name} scooter in Rishikesh. High mileage, regular maintenance, and dual mirrors included.`}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                              ✓ Instant Confirmation
                            </span>
                            <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded">
                              ✓ Free Helmet Included
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
                              onClick={() => navigateToVehicle(pkg)}
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

        {/* VIEW 3: VEHICLE DETAILS VIEW */}
        {selectedVehicle && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="pb-24 pt-6 max-w-4xl mx-auto px-4 sm:px-6 space-y-6 text-left">
            
            <button
              onClick={() => navigateToVehicle(null)}
              className="flex items-center gap-1.5 py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-black hover:border-slate-400 transition-colors cursor-pointer bg-white"
            >
              <ChevronLeft size={16} /> Back to Fleet
            </button>

            {/* Title & Price Block */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-black text-accent font-black tracking-widest px-2 py-0.5 rounded uppercase">
                    {selectedVehicle.type}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 uppercase">
                  {selectedVehicle.name}
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

              <div className="bg-[#FF5F00]/5 border border-[#FF5F00]/15 p-4 rounded-2xl flex flex-col min-w-[160px] xs:text-right shrink-0">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Daily Rent Price</span>
                <div className="flex items-baseline gap-1 xs:justify-end">
                  <span className="text-2xl font-black text-slate-900">₹{selectedVehicle.price.toLocaleString('en-IN')}</span>
                  {selectedVehicle.original_price > selectedVehicle.price && (
                    <span className="text-xs text-slate-400 line-through font-semibold">₹{selectedVehicle.original_price.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-[#FF5F00] uppercase mt-0.5">
                  Book with Token Advance
                </span>
              </div>
            </div>

            {/* Image Slider */}
            <div className="h-52 sm:h-72 w-full rounded-2xl overflow-hidden relative border border-slate-200 group">
              <img 
                src={selectedVehicle.images[currentImgIdx] || '/scooty-rent.jpg'} 
                alt={selectedVehicle.name}
                className="w-full h-full object-cover"
              />
              
              {selectedVehicle.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
                  {selectedVehicle.images.map((_, dotIdx) => (
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
                  <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Security Deposit</span>
                  <span className="font-bold text-white">₹{selectedVehicle.deposit}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Documents Required</span>
                  <span className="font-bold text-white">{selectedVehicle.documents?.join(', ') || 'Original DL'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">Included</span>
                  <span className="font-bold text-white">1x Standard Helmet</span>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#FF5F00]/15 text-[#FF5F00] border border-[#FF5F00]/30 font-bold rounded-lg flex items-center gap-1 text-[10px] sm:text-xs shrink-0 self-start xs:self-auto">
                <ShieldCheck size={12} /> Fleet Safety Verified
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-base font-bold font-display text-slate-900 uppercase">Fleet Specifications</h3>
              <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-medium">
                {selectedVehicle.description || `Clean, regularly serviced ${selectedVehicle.name} available for self-drive rental in Rishikesh. Perfect for sightseeing tours around Ganga beaches, temples, and cafes.`}
              </p>
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
                  <span className="font-bold uppercase text-slate-600 block">🚗 Customer Parking</span>
                  {selectedPartner?.parking_details}
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">Pickup Desk & Document Rules</span>
                <div className="space-y-2 text-xs font-medium text-slate-600 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6B00] font-black">🕒 Timings:</span>
                    <span>{selectedPartner?.reporting_time}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-1.5 bg-white border border-slate-200/60 p-3 rounded-xl">
                    <span className="font-bold uppercase text-slate-600 block mb-1">📝 Document Verification</span>
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
            {(() => {
              const pMode = selectedVehicle.payment_mode || 'commission_advance';
              const commPct = selectedVehicle.commission_percentage !== undefined && selectedVehicle.commission_percentage !== null ? Number(selectedVehicle.commission_percentage) : 10;
              const fixedAmt = selectedVehicle.fixed_advance_amount !== undefined && selectedVehicle.fixed_advance_amount !== null ? Number(selectedVehicle.fixed_advance_amount) : 0;

              let advanceAmount = 0;
              if (pMode === 'full_payment') {
                advanceAmount = selectedVehicle.price;
              } else if (pMode === 'fixed_advance') {
                advanceAmount = fixedAmt;
              } else {
                advanceAmount = Math.round((selectedVehicle.price * commPct) / 100);
              }
              const remainingAmount = Math.max(0, selectedVehicle.price - advanceAmount);

              let paymentTermsLabel = '';
              if (pMode === 'full_payment') {
                paymentTermsLabel = 'Pay 100% online now to secure your booking.';
              } else {
                paymentTermsLabel = `Pay ₹${advanceAmount.toLocaleString('en-IN')} partial online token now to secure your booking • Pay remaining ₹${remainingAmount.toLocaleString('en-IN')} to operator at venue.`;
              }

              return (
                <div className="bg-[#FFF0E5] border-2 border-[#FF6B00] rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mt-6 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <ShieldCheck size={28} className="text-[#FF6B00] shrink-0 mt-0.5" />
                    <div className="space-y-1 text-left">
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">Secure Slot with Token Advance</h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        {paymentTermsLabel} Free cancellation applies up to 24 hours prior.
                      </p>
                    </div>
                  </div>

                  {checkIfClosed(selectedVehicle).closed ? (
                    <button
                      disabled
                      className="w-full md:w-auto py-3 px-6 bg-slate-300 text-slate-500 text-xs font-black uppercase rounded-xl border-none cursor-not-allowed font-display shrink-0"
                    >
                      Closed Temporarily
                    </button>
                  ) : (
                    <button
                      onClick={() => openBookingModal({
                        id: selectedVehicle.id,
                        name: `${selectedVehicle.name} - ${selectedPartner?.name}`,
                        price: selectedVehicle.price,
                        category: 'bikerent',
                        city_id: selectedVehicle.city_id,
                        vendor_id: selectedVehicle.vendor_id,
                        payment_mode: pMode,
                        commission_percentage: commPct,
                        fixed_advance_amount: fixedAmt,
                        upi_discount: selectedVehicle.upi_discount,
                        vendors: selectedPartner, // Send partner info directly to checkout
                        slots: ['Full Day (09:00 AM - 09:00 PM)', '24 Hours Rent'],
                        is_closed: selectedVehicle.is_closed,
                        closed_reason: selectedVehicle.closed_reason,
                        closed_from: selectedVehicle.closed_from,
                        closed_until: selectedVehicle.closed_until
                      })}
                      className="w-full md:w-auto py-3 px-6 bg-accent-gradient text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display shrink-0"
                    >
                      Book Rental
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Mobile Sticky Booking Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-3.5 px-4 flex items-center justify-between gap-4 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              <div>
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Daily Rent</span>
                <span className="text-lg font-black text-slate-900">₹{selectedVehicle.price.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/918630027341?text=Hi%20TripGod%2C%20I%20want%20to%20rent%20the%20${encodeURIComponent(selectedVehicle.name)}%20from%20${encodeURIComponent(selectedPartner?.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-xl flex items-center justify-center text-white shrink-0 hover:scale-105 active:scale-95 transition-all shadow-xs"
                >
                  <MessageSquare size={16} />
                </a>
                <button
                  onClick={() => {
                    const pMode = selectedVehicle.payment_mode || 'commission_advance';
                    const commPct = selectedVehicle.commission_percentage !== undefined && selectedVehicle.commission_percentage !== null ? Number(selectedVehicle.commission_percentage) : 10;
                    const fixedAmt = selectedVehicle.fixed_advance_amount !== undefined && selectedVehicle.fixed_advance_amount !== null ? Number(selectedVehicle.fixed_advance_amount) : 0;

                    openBookingModal({
                      id: selectedVehicle.id,
                      name: `${selectedVehicle.name} - ${selectedPartner?.name}`,
                      price: selectedVehicle.price,
                      category: 'bikerent',
                      city_id: selectedVehicle.city_id,
                      vendor_id: selectedVehicle.vendor_id,
                      payment_mode: pMode,
                      commission_percentage: commPct,
                      fixed_advance_amount: fixedAmt,
                      upi_discount: selectedVehicle.upi_discount,
                      vendors: selectedPartner,
                      slots: ['Full Day (09:00 AM - 09:00 PM)', '24 Hours Rent'],
                      is_closed: selectedVehicle.is_closed,
                      closed_reason: selectedVehicle.closed_reason,
                      closed_from: selectedVehicle.closed_from,
                      closed_until: selectedVehicle.closed_until
                    });
                  }}
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
