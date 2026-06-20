import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bike, Calendar, MapPin, FileText, 
  ShieldCheck, ArrowRight, Gauge, Shield, Milestone,
  ChevronLeft
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
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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
          const mapped = data.map(item => ({
            ...item,
            type: item.name.toLowerCase().includes('scooty') || item.name.toLowerCase().includes('activa') ? 'Automatic Scooter' : 'Cruiser Motorcycle',
            spec: item.description,
            img: item.images && item.images.length > 0 ? item.images[0] : '/scooty-rent.jpg',
            details: [
              { label: 'Deposit', value: `₹${item.deposit}` },
              { label: 'Required', value: item.documents && item.documents.length > 0 ? item.documents[0] : 'License' },
              { label: 'Pickup', value: item.pickup_location || 'Local Stand' }
            ]
          }));
          setVehicles(mapped);
        } else {
          setVehicles(defaultVehicles);
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
      if (!grouped[key]) {
        grouped[key] = {
          name: v.name,
          type: v.type,
          spec: v.spec,
          img: v.img,
          details: v.details || [],
          minPrice: Number(v.price),
          operators: []
        };
      }
      if (Number(v.price) < grouped[key].minPrice) {
        grouped[key].minPrice = Number(v.price);
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
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">{selectedVehicle.spec}</p>

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
            <div className="space-y-1">
              <span className="text-[10px] text-accent font-black uppercase tracking-wider block">Comparison Desk</span>
              <h3 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight">
                Select Your Operator
              </h3>
            </div>
            
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
                  vendors: raw.vendors,
                  slots: ['Full Day (09:00 AM - 09:00 PM)', '24 Hours Rent']
                });
              }}
              activityName={selectedVehicle.name}
            />
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

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        {/* Vehicles Grid */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-2"
          >
            <span className="text-xs font-bold uppercase text-gray-500 tracking-widest font-sans">Premium Fleet</span>
            <h2 className="text-xl md:text-3xl font-bold font-display text-black">EXPLORE RISHIKESH ON YOUR TERMS</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {groupedList.map((v, idx) => {
              const hasMultiple = v.operators.length > 1;
              const hasDiscount = v.operators.some(op => op.original_price && Number(op.original_price) > Number(op.price));
              const originalPriceToShow = hasDiscount ? Math.max(...v.operators.map(op => Number(op.original_price || 0))) : null;

              return (
                <motion.div 
                  key={v.name || idx}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="border border-white/60 bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:scale-[1.01] hover:border-accent/40 transition-all flex flex-col justify-between group shadow-[0_8px_32px_rgba(0,0,0,0.04)] cursor-pointer"
                  onClick={() => setSelectedVehicle(v)}
                >
                  <div className="h-36 sm:h-40 bg-gray-100 overflow-hidden relative border-b border-black/5">
                    <img src={v.img} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {v.operators.some(op => op.is_limited_offer) && (
                      <span className="absolute top-3 left-3 bg-[#FF5F00] text-white text-[8px] font-black py-1 px-2.5 rounded-full shadow-[0_4px_10px_rgba(255,95,0,0.25)] tracking-wider z-10">
                        LIMITED TIME OFFER
                      </span>
                    )}
                    <div className="absolute top-4 right-4 bg-black text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5 z-10">
                      {originalPriceToShow && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{originalPriceToShow}
                        </span>
                      )}
                      <span className="text-[#FF6B00]">₹{v.minPrice}/day</span>
                    </div>
                  </div>
   
                  {/* Info */}
                  <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                            {v.type}
                          </span>
                          <h3 className="text-base font-bold font-display text-black">{v.name}</h3>
                        </div>
                        <span className="text-[9px] bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] font-black px-2 py-0.5 rounded-md truncate max-w-[100px] shrink-0 mt-1">
                          {v.operators.length} Operator{v.operators.length > 1 ? 's' : ''}
                        </span>
                      </div>
   
                      <p className="text-xs text-gray-600 font-medium">{v.spec}</p>
  
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
   
                    <div className="pt-3 border-t border-black/5 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(v);
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
                      >
                        {hasMultiple ? 'Compare Operators' : 'View Operators'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Logistics (Documents & Pickup Points) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-black/5">
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
