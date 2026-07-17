import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bike, Calendar, MapPin, FileText, 
  ShieldCheck, ArrowRight, Gauge, Shield, Milestone,
  ChevronLeft, Star
} from 'lucide-react';
import { supabase } from '../supabase';
import OperatorSelector from '../components/OperatorSelector';

const defaultVehicles = [
  {
    id: 'bike-activa',
    name: 'Activa or Similar',
    type: 'Automatic Scooter',
    spec: 'Easy Handling | Practical for Rishikesh Streets',
    price: 800,
    img: '/scooty-rent.jpg',
    rating: 4.7,
    reviewsCount: 430,
    details: [
      { label: 'Transmission', value: 'Automatic' },
      { label: 'Type', value: 'Gearless Scooter' },
      { label: 'Included', value: '1x Helmet' }
    ]
  },
  {
    id: 'bike-classic',
    name: 'Royal Enfield Classic',
    type: 'Cruiser Motorcycle',
    spec: '350cc | Comfort Seat | Iconic Thump',
    price: 1300,
    img: '/classic-rent.png',
    rating: 4.8,
    reviewsCount: 312,
    details: [
      { label: 'Engine', value: '349 cc' },
      { label: 'Type', value: 'Cruiser' },
      { label: 'Included', value: '1x Helmet' }
    ]
  },
  {
    id: 'bike-hunter',
    name: 'Hunter 350',
    type: 'Urban Roadster',
    spec: '350cc | Nimble Handling | Retro Styling',
    price: 1300,
    img: '/hunter-rent.jpg',
    rating: 4.8,
    reviewsCount: 204,
    details: [
      { label: 'Engine', value: '349 cc' },
      { label: 'Type', value: 'Roadster' },
      { label: 'Included', value: '1x Helmet' }
    ]
  },
  {
    id: 'bike-xpulse',
    name: 'Xpulse 200',
    type: 'Dual-Purpose Dual-Sport',
    spec: '200cc | Light Weight | Long Travel Suspension',
    price: 1300,
    img: '/xpulse-rent.jpg',
    rating: 4.7,
    reviewsCount: 185,
    details: [
      { label: 'Engine', value: '199-cc' },
      { label: 'Type', value: 'Adventure/Offroad' },
      { label: 'Included', value: '1x Helmet' }
    ]
  },
  {
    id: 'bike-himalayan',
    name: 'Himalayan 450 CC',
    type: 'Adventure Tourer',
    spec: '450cc | Sherpa Liquid-Cooled Engine',
    price: 1600,
    img: '/himalayan-rent.jpg',
    rating: 4.9,
    reviewsCount: 220,
    details: [
      { label: 'Engine', value: '452 cc' },
      { label: 'Type', value: 'Adventure' },
      { label: 'Included', value: '1x Helmet' }
    ]
  }
];

const pickupPoints = [
  'Jankipul Office Desk',
  'Ramjhula Pickup point',
  'Laxmanjhula Main Square',
  'Rishikesh Railway Station'
];

export default function BikeRent({ currentCity, openBookingModal }) {
  const [vehicles, setVehicles] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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

  useEffect(() => {
    setSelectedVehicle(null);
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
          const mapped = data.map((item, idx) => ({
            ...item,
            type: item.name.toLowerCase().includes('scooty') || item.name.toLowerCase().includes('activa') ? 'Automatic Scooter' : 'Cruiser Motorcycle',
            spec: item.description,
            img: item.images && item.images.length > 0 ? item.images[0] : '/scooty-rent.jpg',
            rating: item.rating || item.vendors?.star_rating || Number((4.5 + ((idx * 3) % 5) / 10).toFixed(1)),
            reviewsCount: item.reviews_count || (120 + ((idx * 67) % 250)),
            upi_discount: item.upi_discount !== null && item.upi_discount !== undefined ? Number(item.upi_discount) : null,
            details: [
              { label: 'Deposit', value: `₹${item.deposit}` },
              { label: 'Required', value: item.documents && item.documents.length > 0 ? item.documents[0] : 'License' },
              { label: 'Pickup', value: item.pickup_location || 'Local Stand' }
            ]
          }));
          setVehicles(mapped);

          // Group by partners
          const partnersMap = {};
          mapped.forEach(item => {
            const vendor = item.vendors;
            if (!vendor) return;
            if (!partnersMap[vendor.id]) {
              partnersMap[vendor.id] = {
                id: vendor.id,
                name: vendor.name,
                star_rating: vendor.star_rating || 4.8,
                address: vendor.address || 'Rishikesh, Uttarakhand',
                landmark: vendor.landmark || 'Tapovan',
                shop_image: vendor.shop_image || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600',
                vehicles: []
              };
            }
            partnersMap[vendor.id].vehicles.push({
              ...item,
              operators: [item]
            });
          });
          setPartnersData(Object.values(partnersMap));
        } else {
          setVehicles(defaultVehicles);
          setPartnersData([
            {
              id: 'demo-rental-partner',
              name: 'TripGod Rentals Tapovan',
              star_rating: 4.8,
              address: 'Badrinath Road, Tapovan, Rishikesh',
              landmark: 'Near Laxman Jhula Chowk',
              shop_image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600',
              vehicles: defaultVehicles.map(v => ({ ...v, operators: [v] }))
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching bikes:', err);
        setVehicles(defaultVehicles);
      } finally {
        setLoading(false);
      }
    };
    fetchBikes();
  }, [currentCity]);
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 35 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  const getGroupedVehicles = () => {
    const grouped = {};
    vehicles.forEach(v => {
      const key = v.name;
      const priceVal = Number(v.price) || 0;
      if (priceVal <= 0) return; // Safeguard: skip operators with invalid/zero prices!
      
      if (!grouped[key]) {
        grouped[key] = {
          name: v.name,
          type: v.type,
          spec: v.spec,
          img: v.img,
          details: v.details || [],
          minPrice: priceVal,
          rating: v.rating || 4.7,
          reviewsCount: v.reviewsCount || 150,
          upi_discount: v.upi_discount || null,
          is_closed: v.is_closed,
          closed_reason: v.closed_reason,
          closed_from: v.closed_from,
          closed_until: v.closed_until,
          operators: []
        };
      }
      if (priceVal < grouped[key].minPrice) {
        grouped[key].minPrice = priceVal;
      }
      grouped[key].operators.push(v);
    });
    return Object.values(grouped);
  };

  const groupedList = getGroupedVehicles();

  if (selectedVehicle) {
    return (
      <div className="w-full min-h-screen bg-white pb-20 font-sans">
        {/* Back button header */}
        <div className="bg-slate-50 border-b border-slate-100 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center">
            <button
              onClick={() => setSelectedVehicle(null)}
              className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider hover:text-accent cursor-pointer border-none bg-transparent"
            >
              <ChevronLeft size={16} /> Back to Fleet
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {checkIfClosed(selectedVehicle).closed && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex flex-col gap-1.5 text-left shadow-sm">
              <span className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5 text-red-700">
                ⚠️ VEHICLE RENTAL TEMPORARILY CLOSED
              </span>
              <p className="text-xs font-semibold leading-relaxed">
                This vehicle model is currently unavailable for rent: {checkIfClosed(selectedVehicle).reason}
              </p>
              {checkIfClosed(selectedVehicle).reopenDate && (
                <span className="text-[10px] bg-red-100 text-red-700 font-black uppercase px-2.5 py-1 rounded-lg mt-1 w-max">
                  Expected Reopening: {new Date(checkIfClosed(selectedVehicle).reopenDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          )}

          {/* Vehicle Info Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 h-56 md:h-72 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
              <img src={selectedVehicle.img} alt={selectedVehicle.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[10px] text-accent font-black uppercase tracking-wider block">
                  {selectedVehicle.type}
                </span>
                <h2 className="text-2xl font-black font-display text-slate-900 uppercase">
                  {selectedVehicle.name}
                </h2>
                
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <div className="flex items-center gap-1 text-xs text-black font-black">
                    <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                    <span>{selectedVehicle.rating}</span>
                    <span className="text-gray-500 font-bold">({selectedVehicle.reviewsCount} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">{selectedVehicle.spec}</p>

              {/* Specifications List */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {selectedVehicle.details.map((d, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                    <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider">{d.label}</span>
                    <span className="text-xs text-slate-800 font-bold truncate block mt-0.5">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Operator Selector Component */}
          <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 space-y-6">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Choose Your Booking Option
                </h3>
                <span className="text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {(selectedVehicle.operators?.length || 1)} Options Available
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                All providers deliver the same vehicle model. Simply choose the pickup location and price option that works best for you.
              </p>
            </div>
            
            {selectedVehicle.upi_discount && Number(selectedVehicle.upi_discount) > 0 && (
              <div className="mb-4 flex items-center gap-3 bg-[#008F5D]/5 border border-[#008F5D]/15 p-3.5 rounded-2xl text-left">
                <span className="w-8 h-8 rounded-full bg-[#008F5D]/10 flex items-center justify-center text-[#008F5D] shrink-0 text-sm">
                  💳
                </span>
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-black text-slate-950">
                    Pay via UPI & Get Extra ₹{selectedVehicle.upi_discount} OFF
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-bold mt-0.5">
                    Pay using any UPI app instantly & save extra on your advance payment.
                  </span>
                </div>
              </div>
            )}

            {checkIfClosed(selectedVehicle).closed ? (
              <div className="p-6 bg-red-50/50 border border-red-100 rounded-2xl text-center font-sans space-y-2">
                <p className="text-xs font-black text-red-700 uppercase tracking-wider">⚠️ Bookings Temporarily Disabled</p>
                <p className="text-[11px] text-red-650 font-medium">This rental vehicle is currently closed for the season. You will not be able to confirm a slot at this time.</p>
              </div>
            ) : (
              <OperatorSelector
                operators={selectedVehicle.operators.map(op => ({
                  id: op.id,
                  vendorName: op.vendors?.name || op.name || 'Local Operator',
                  shopImage: op.vendors?.shop_image || null,
                  starRating: op.vendors?.star_rating !== undefined ? op.vendors.star_rating : 4.5,
                  landmark: op.vendors?.landmark || op.vendors?.address || 'Rishikesh',
                  price: Number(op.price || selectedVehicle.minPrice),
                  originalPrice: op.original_price ? Number(op.original_price) : null,
                  isLimitedOffer: !!op.is_limited_offer,
                  commissionPercentage: op.commission_percentage || op.vendors?.commission_percentage || 10,
                  _raw: op
                }))}
                onBookOperator={(op) => {
                  const raw = op._raw;
                  openBookingModal({
                    id: raw.id,
                    name: `${selectedVehicle.name} - ${op.vendorName}`,
                    price: op.price,
                    category: 'bikerent',
                    city_id: raw.city_id,
                    vendor_id: raw.vendor_id,
                    commission_percentage: raw.commission_percentage || raw.vendors?.commission_percentage,
                    upi_discount: selectedVehicle.upi_discount,
                    vendors: raw.vendors,
                    slots: ['Full Day (09:00 AM - 09:00 PM)', '24 Hours Rent'],
                    is_closed: selectedVehicle.is_closed || raw.is_closed,
                    closed_reason: selectedVehicle.closed_reason || raw.closed_reason,
                    closed_from: selectedVehicle.closed_from || raw.closed_from,
                    closed_until: selectedVehicle.closed_until || raw.closed_until
                  });
                }}
                activityName={selectedVehicle.name}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white pb-20">
      {/* Hero */}
      <div className="relative h-[40vh] bg-black flex items-center justify-center text-center">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-65"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative z-10 space-y-3 px-6">
          <span className="text-xs font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full">
            Rishikesh 2-Wheeler Rentals
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
            Bike & Scooty Rent
          </h1>
          <p className="text-gray-300 max-w-lg mx-auto text-sm sm:text-base font-medium">
            Explore the streets, cafes, and temples of Rishikesh on your own terms.
          </p>
        </div>
      </div>

      {/* PARTNERS LIST */}
      {!selectedPartner ? (
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-2"
          >
            <span className="text-xs font-bold uppercase text-gray-500 tracking-widest font-sans">Verified Fleet Operators</span>
            <h2 className="text-xl md:text-3xl font-bold font-display text-black uppercase">SELECT RENTAL PARTNERS</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partnersData.map((partner, idx) => (
              <motion.div
                key={partner.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex flex-col bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={partner.shop_image || '/scooty-rent.jpg'}
                    alt={partner.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-xs text-white text-[9px] font-black py-1.5 px-3 rounded-lg shadow-md tracking-wider flex items-center gap-1">
                    ⭐ {partner.star_rating}
                  </div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg font-display text-black leading-snug uppercase text-left">{partner.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 text-left">
                      <MapPin size={13} className="text-accent shrink-0" />
                      <span className="truncate max-w-[200px]">{partner.address}</span>
                    </div>
                    {partner.landmark && (
                      <div className="text-[10px] text-slate-400 font-bold uppercase text-left">
                        🏢 {partner.landmark}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 text-left pt-1.5 leading-relaxed">
                      Offers {partner.vehicles.length} vehicle rental option(s) with pre-verified helmets.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] block font-bold text-slate-400 uppercase text-left">Starting From</span>
                      <span className="text-lg font-black text-black">
                        ₹{partner.vehicles.length > 0 ? Math.min(...partner.vehicles.map(v => v.price)).toLocaleString('en-IN') : '0'}/day
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedPartner(partner)}
                      className="py-2.5 px-4 bg-accent hover:bg-[#FF3E00] text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-none flex items-center gap-1"
                    >
                      View Vehicles <ChevronLeft className="rotate-180" size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* PARTNER DETAILS & PACKAGES LIST */
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
          {/* Back button */}
          <button
            onClick={() => setSelectedPartner(null)}
            className="flex items-center gap-1 text-slate-500 hover:text-black font-black text-xs uppercase bg-transparent border-none cursor-pointer p-0 select-none text-left"
          >
            <ChevronLeft size={16} /> Back to Partners
          </button>

          {/* Partner Banner Block */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 md:p-8 flex flex-col md:flex-row items-center gap-6 text-left shadow-xs">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
              <img src={selectedPartner.shop_image} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-2 flex-grow">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-black uppercase">{selectedPartner.name}</h2>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider select-none animate-pulse">Verified Rental Partner</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-1">
                  <Star size={13} className="fill-amber-500 text-amber-500" />
                  <span>{selectedPartner.star_rating} Rating</span>
                </div>
                <span>•</span>
                <span>📍 {selectedPartner.address}</span>
                {selectedPartner.landmark && (
                  <>
                    <span>•</span>
                    <span>🏢 {selectedPartner.landmark}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left font-display">Available Vehicles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {selectedPartner.vehicles.map((v, idx) => {
                const hasDiscount = v.original_price && Number(v.original_price) > Number(v.price);
                return (
                  <motion.div
                    key={v.id || idx}
                    className="flex flex-col bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    onClick={() => setSelectedVehicle(v)}
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={v.img}
                        alt={v.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                      {checkIfClosed(v).closed && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-md">
                            Closed
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block text-left">
                              {v.type}
                            </span>
                            <h3 className="text-base font-bold font-display text-black text-left">{v.name}</h3>
                            {v.upi_discount > 0 && (
                               <span className="text-[9px] font-black text-[#FF6B00] bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block select-none mt-1">
                                 💳 UPI: Save ₹{v.upi_discount}
                               </span>
                             )}
                            
                            <div className="flex items-center gap-1 text-[11px] text-black font-bold mt-0.5 text-left">
                              <Star size={11} className="text-[#FF5F00]" fill="#FF5F00" />
                              <span>{v.rating}</span>
                              <span className="text-gray-500 font-semibold">({v.reviewsCount} reviews)</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-left line-clamp-3 leading-relaxed">
                          {v.spec}
                        </p>
                        {/* Specifications List */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2">
                          {v.details.slice(0, 3).map((d, i) => (
                            <div key={i} className="p-2 bg-slate-50 rounded text-center border border-black/5">
                              <span className="block text-[8px] text-gray-400 font-bold uppercase">{d.label}</span>
                              <span className="text-[10px] text-black font-bold truncate block">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] block font-bold text-slate-400 uppercase text-left">Rent Rate</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-black">₹{(Number(v.price) || 0).toLocaleString('en-IN')}/day</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedVehicle(v);
                          }}
                          className="py-2.5 px-4 bg-accent hover:bg-[#FF3E00] text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-none flex items-center gap-1 font-display"
                        >
                          Book Now <ChevronLeft className="rotate-180" size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

        {/* Logistics (Documents & Pickup Points) */}
        <div className="max-w-6xl mx-auto px-6 pt-12 border-t border-black/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Documents */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-display text-black flex items-center gap-2">
              <FileText className="text-black" /> DOCUMENTS REQUIRED
            </h3>
            
            <div className="bg-gray-50 border-2 border-black rounded-2xl p-6 space-y-4 font-sans">
              <div className="flex gap-3">
                <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-black">Valid Driving License (DL)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">A physical, valid Indian or International driving license is mandatory. Learners licenses are not accepted.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-black">Original Govt. Photo ID</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Please submit an original Aadhaar Card, Passport, or Voter ID Card. This will be safely returned to you upon vehicle return.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-black">Refundable Security Deposit</h4>
                  <p className="text-xs text-gray-500 mt-0.5">A small refundable security deposit of ₹1,000 to ₹2,000 depending on the vehicle is collected at the pick-up desk.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pickup points */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-display text-black flex items-center gap-2">
              <MapPin className="text-black" /> PICKUP & RETURN LOCATIONS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pickupPoints.map((point, idx) => (
                <div 
                  key={idx}
                  className="p-4 border-2 border-black rounded-xl bg-white flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FF5F00]/10 border border-[#FF5F00]/20 flex items-center justify-center text-[#FF5F00] font-bold text-xs">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-xs text-gray-800 tracking-tight">{point}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-xs font-semibold leading-relaxed border border-yellow-200">
              Note: Vehicles must be returned to the same station they were picked up from, unless custom dropping is booked with our customer support in advance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
