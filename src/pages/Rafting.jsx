import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Star, Calendar, Clock, MapPin, 
  Check, X, ChevronDown, ShieldCheck, HeartCrack, Info, Play
} from 'lucide-react';
import { supabase } from '../supabase';
import OperatorSelector from '../components/OperatorSelector';

const defaultStretches = [
  {
    id: 'rafting-12km',
    name: '12 KM Rafting Stretch',
    stretch: 'Shivpuri → Laxman Jhula',
    price: 1090,
    difficulty: 'Moderate',
    difficultyColor: 'bg-green-100 text-green-800',
    duration: '2-3 Hours',
    rapids: 'Grade II & III (Return to Sender, Roller Coaster, Golf Course)',
    ageLimit: 'Age 14-60 yrs',
    weightLimit: 'Weight 40-100 kg',
    img: '/rafting-4.jpg',
    images: [
      '/rafting-4.jpg',
      '/rafting-1.jpg',
      '/rafting-2.jpg'
    ],
    desc: 'The most popular rafting stretch in Rishikesh. Perfect for beginners and families. Covers 7 thrilling rapids over a scenic 12km stretch, ending near the iconic Laxman Jhula.',
    operators: [
      { id: 'rafting-12km-op1', name: 'River Runners Crew', price: 1090, original_price: 1290, is_limited_offer: true, commission_percentage: 12 },
      { id: 'rafting-12km-op2', name: 'Himalayan Rapids Adventure', price: 1250, original_price: 1400, commission_percentage: 10 }
    ]
  },
  {
    id: 'rafting-16km',
    name: '16 KM Rafting Stretch',
    stretch: 'Shivpuri → Nim Beach',
    price: 1590,
    difficulty: 'Thrilling',
    difficultyColor: 'bg-orange-100 text-orange-800',
    duration: '3.5 Hours',
    rapids: 'Grade II, III & III+ (Roller Coaster, Golf Course, Maelstrom)',
    ageLimit: 'Age 14-55 yrs',
    weightLimit: 'Weight 40-100 kg',
    img: '/rafting-5.jpg',
    images: [
      '/rafting-5.jpg',
      '/rafting-3.jpg',
      '/rafting-1.jpg'
    ],
    desc: 'An extended version of the Shivpuri stretch. It covers additional rapids and terminates at Nim Beach. Designed for adventure lovers seeking extra thrill and longer river time.',
    operators: [
      { id: 'rafting-16km-op1', name: 'White Water Legends', price: 1590, original_price: 1790, is_limited_offer: true, commission_percentage: 15 },
      { id: 'rafting-16km-op2', name: 'Apex Adventure Rishikesh', price: 1690, commission_percentage: 10 }
    ]
  },
  {
    id: 'rafting-26km',
    name: '26 KM Rafting Stretch',
    stretch: 'Marine Drive → Nim Beach',
    price: 2490,
    difficulty: 'Advanced',
    difficultyColor: 'bg-red-100 text-red-800',
    duration: '5-6 Hours',
    rapids: 'Grade III & IV (Three Blind Mice, Crossfire, Body Surfing)',
    ageLimit: 'Age 18-50 yrs',
    weightLimit: 'Weight 45-95 kg',
    img: '/rafting-hero.jpg',
    images: [
      '/rafting-hero.jpg',
      '/rafting-2.jpg',
      '/rafting-3.jpg'
    ],
    desc: 'The ultimate white water rafting test in Rishikesh. Massive rapids, heavy currents, and extreme body-surfing options. Requires high stamina and prior basic rafting experience.',
    operators: [
      { id: 'rafting-26km-op1', name: 'Ganga Extreme Outfitters', price: 2490, original_price: 2990, commission_percentage: 10 },
      { id: 'rafting-26km-op2', name: 'Bull Adventure Crew', price: 2790, commission_percentage: 12 }
    ]
  }
];

const faqs = [
  { q: "Is swimming mandatory for river rafting?", a: "No, swimming is not mandatory. Every rafter is equipped with a high-buoyancy life jacket and a certified rescue guide who provides safety briefings before launching." },
  { q: "What is the best time of year for rafting in Rishikesh?", a: "The rafting season runs from September to June. The best months are October to November and March to May when the weather is pleasant and the water flows are ideal." },
  { q: "Can we book transport with the rafting package?", a: "Yes, you can select transport add-ons in the booking modal, or book a private pickup drop separately under our transfers service." },
  { q: "Where do we change clothes after rafting?", a: "There are changing rooms available at our booking office near Laxman Jhula and at the final rafting endpoint (Nim Beach/Laxman Jhula)." }
];

export default function Rafting({ currentCity, openBookingModal }) {
  const [stretchesData, setStretchesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStretch, setSelectedStretch] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [showOperatorModal, setShowOperatorModal] = useState(false);

  // Swipe gesture support
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
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && selectedStretch?.images?.length > 1) {
      setCurrentImgIdx(prev => (prev + 1) % selectedStretch.images.length);
    } else if (isRightSwipe && selectedStretch?.images?.length > 1) {
      setCurrentImgIdx(prev => (prev - 1 + selectedStretch.images.length) % selectedStretch.images.length);
    }
  };

  useEffect(() => {
    const fetchRafting = async () => {
      setLoading(true);
      try {
        let query = supabase.from('rafting').select('*, vendors(*)');
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (data && data.length > 0) {
          const fallbackImages = {
            9: ['/rafting-4.jpg', '/rafting-1.jpg', '/rafting-2.jpg'],
            12: ['/rafting-4.jpg', '/rafting-1.jpg', '/rafting-2.jpg'],
            16: ['/rafting-5.jpg', '/rafting-2.jpg', '/rafting-3.jpg'],
            24: ['/rafting-6.jpg', '/rafting-3.jpg', '/rafting-1.jpg'],
            36: ['/rafting-7.jpg', '/rafting-1.jpg', '/rafting-2.jpg']
          };

          const grouped = {};
          data.forEach(item => {
            const dist = Number(item.distance_km) || 12;
            const key = `${dist} KM`;
            
            if (!grouped[key]) {
              grouped[key] = {
                id: item.id,
                name: `${dist} KM Rafting Stretch`,
                stretch: item.route || (dist === 12 ? 'Brahmpuri to Laxman Jhula' : dist === 16 ? 'Shivpuri to Nim Beach' : dist === 24 ? 'Marine Drive to Nim Beach' : 'Kaudiyala to Nim Beach'),
                difficulty: dist >= 24 ? 'Advanced' : 'Moderate',
                difficultyColor: dist >= 24 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800',
                price: Number(item.price),
                img: item.images && item.images.length > 0 ? item.images[0] : (fallbackImages[dist] ? fallbackImages[dist][0] : '/rafting-4.jpg'),
                images: item.images && item.images.length > 0 ? item.images : (fallbackImages[dist] || ['/rafting-4.jpg']),
                duration: item.duration || (dist === 12 ? '1.5-2 Hours' : dist === 16 ? '2.5-3 Hours' : dist === 24 ? '3.5-4 Hours' : '5-6 Hours'),
                rapids: item.rapids || (dist === 12 ? 'Grade I & II rapids' : dist === 16 ? 'Grade II & III (Roller Coaster, Golf Course)' : 'Grade III & IV (Wall, Three Blind Mice)'),
                ageLimit: item.age_limit ? `Age ${item.age_limit}+ yrs` : (dist === 12 ? 'Age 14-60 yrs' : 'Age 14-55 yrs'),
                weightLimit: 'Weight 40-100 kg',
                desc: item.description || (dist === 12 ? 'Perfect for beginners and families. Covers 7 thrilling rapids over a scenic 12km stretch.' : dist === 16 ? 'A thrilling rafting run with multiple Grade III rapids, suitable for adventure seekers.' : 'An advanced white-water rafting trip with massive rapids and high speed flows.'),
                inclusions: item.inclusions && item.inclusions.length > 0 ? item.inclusions : ['Certified Safety Crew', 'High Quality Gear Included', 'Certified Ganga River Guide'],
                exclusions: item.exclusions && item.exclusions.length > 0 ? item.exclusions : ['Any personal expenses', 'Tips for guides'],
                cancellation_policy: item.cancellation_policy || '100% refund up to 24 hours prior.',
                operators: []
              };
            }
            
            grouped[key].operators.push(item);
            if (Number(item.price) < grouped[key].price) {
              grouped[key].price = Number(item.price);
            }
            if (item.images && item.images.length > grouped[key].images.length) {
              grouped[key].images = item.images;
              grouped[key].img = item.images[0];
            }
          });
          const mapped = Object.values(grouped);
          setStretchesData(mapped);
        } else {
          setStretchesData(defaultStretches);
        }
      } catch (err) {
        console.error('Error fetching rafting packages:', err);
        setStretchesData(defaultStretches);
      } finally {
        setLoading(false);
      }
    };
    fetchRafting();
  }, [currentCity]);

  const reviews = [
    { name: 'Amit Sharma', stars: 5, text: 'The 12km stretch was perfect! We did body surfing in the Ganga. Absolutely thrilling and safe.' },
    { name: 'Gaurav K.', stars: 5, text: 'We chose the 26km Marine Drive stretch. It was heavy on rapids! The DSLR video quality was outstanding.' },
    { name: 'Neelam J.', stars: 5, text: 'TripGod organized our trip so well. Booking was completed over WhatsApp within 5 minutes.' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReviewIdx((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play image gallery slideshow (slides every 4 seconds)
  useEffect(() => {
    if (!selectedStretch || !selectedStretch.images || selectedStretch.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % selectedStretch.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedStretch, currentImgIdx]);

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

  return (
    <div className="w-full min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {!selectedStretch ? (
          /* SECTION A: LISTING VIEW */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-20"
          >
            {/* Hero Banner */}
            <div className="relative h-[50vh] bg-black flex items-center justify-center text-center">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=1200')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-xs font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full">
                  Rishikesh Water Sports
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  White Water Rafting
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-sm sm:text-base font-medium">
                  Ride the wild rapids of the sacred Ganga. Choose from 12KM, 16KM, or 26KM stretches.
                </p>
              </div>
            </div>

            {/* Stretch Cards List */}
            <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-2"
              >
                <h2 className="text-2xl md:text-4xl font-black font-display text-black">SELECT YOUR STRETCH</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
              </motion.div>

              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {stretchesData.map((str) => (
                  <motion.div
                    key={str.id}
                    variants={fadeInUp}
                    whileHover={{ y: -5 }}
                    onClick={() => {
                      setSelectedStretch(str);
                      setCurrentImgIdx(0);
                      window.scrollTo(0, 0);
                    }}
                    className="border border-white/60 bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer hover:border-accent/40 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all flex flex-col justify-between h-full group shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                  >
                    <div>
                      {/* Image Box */}
                      <div className="h-36 sm:h-40 bg-gray-100 overflow-hidden relative border-b border-black/5">
                        <img 
                          src={str.img} 
                          alt={str.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          loading="lazy" 
                        />
                      </div>
                      
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xl font-black font-display text-black">{str.km || str.name}</span>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded ${str.difficultyColor}`}>
                              {str.difficulty}
                            </span>
                            {str.vendors?.name && (
                              <span className="text-[9px] bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] font-black px-2 py-0.5 rounded truncate max-w-[120px]">
                                {str.vendors.name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-base font-display text-black leading-tight">{str.stretch}</h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{str.duration}</p>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed line-clamp-3">
                          {str.desc}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 bg-gray-50 border-t border-black/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] block font-bold text-gray-500 uppercase">From</span>
                        <span className="text-xl font-black text-black">₹{str.price.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-xs font-black uppercase text-black flex items-center gap-1 group-hover:underline decoration-accent decoration-2">
                        View Details <ChevronLeft className="rotate-180" size={14} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* SECTION B: DETAILED VIEW */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="pb-24 pt-6"
          >
            {/* Back Button and Title */}
            <div className="max-w-4xl mx-auto px-6 space-y-6">
              <button
                onClick={() => { setSelectedStretch(null); setShowOperatorModal(false); }}
                className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-600 hover:text-black hover:border-black transition-colors"
              >
                <ChevronLeft size={16} /> Back to Stretches
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-black text-accent font-black tracking-widest px-2 py-0.5 rounded uppercase">
                      RAFTING
                    </span>
                    <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded uppercase ${selectedStretch.difficultyColor}`}>
                      {selectedStretch.difficulty}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold font-display text-black">{selectedStretch.name}</h1>
                  {selectedStretch.vendors?.name && (
                    <p className="text-[11px] font-bold text-[#FF5F00] uppercase tracking-wider flex items-center gap-1">
                      Operator: <span className="bg-[#FF5F00]/10 px-2 py-0.5 rounded font-black">{selectedStretch.vendors.name}</span>
                    </p>
                  )}
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} className="text-black" /> {selectedStretch.stretch}
                  </p>
                </div>
                
                <div 
                  onClick={() => setShowOperatorModal(true)}
                  className="text-left sm:text-right bg-[#FF5F00]/5 border border-[#FF5F00]/15 p-3 rounded-xl flex flex-col cursor-pointer hover:border-[#FF5F00]/40 transition-all active:scale-[0.98]"
                >
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Price per person</span>
                  <span className="text-2xl font-black text-black">Starts from ₹{selectedStretch.price.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] font-bold text-[#FF5F00] uppercase mt-0.5">Compare Operators & Book</span>
                </div>
              </div>

              {/* Slider / Image Gallery */}
              <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="h-48 sm:h-72 w-full rounded-2xl overflow-hidden relative border border-black/10 group cursor-grab active:cursor-grabbing"
              >
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentImgIdx}
                    src={selectedStretch.images[currentImgIdx]} 
                    alt={`${selectedStretch.name} view ${currentImgIdx + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover absolute inset-0 pointer-events-none select-none"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />
                
                {/* Left/Right Navigation Buttons */}
                <button 
                  onClick={() => setCurrentImgIdx((prev) => (prev - 1 + selectedStretch.images.length) % selectedStretch.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md hover:bg-black/75 z-10"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentImgIdx((prev) => (prev + 1) % selectedStretch.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md hover:bg-black/75 z-10"
                >
                  <ChevronLeft size={16} className="rotate-180" />
                </button>

                {/* Bottom Slide Indicators (Dots) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
                  {selectedStretch.images.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setCurrentImgIdx(dotIdx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer border-none ${dotIdx === currentImgIdx ? 'bg-white w-3' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Specs card below image */}
              <div className="flex flex-col xs:flex-row gap-2.5 xs:items-center justify-between text-white text-[11px] sm:text-xs bg-black/85 p-3.5 sm:p-4 rounded-2xl border border-white/5 shadow-sm">
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <span className="block text-gray-400 text-[9px] sm:text-[10px] uppercase font-bold">Duration</span>
                    <span className="font-bold text-white">{selectedStretch.duration}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-[9px] sm:text-[10px] uppercase font-bold">Rapids Category</span>
                    <span className="font-bold text-white">{selectedStretch.difficulty}</span>
                  </div>
                </div>
                <div className="self-start xs:self-auto px-2.5 py-1 bg-[#FF5F00]/15 text-[#FF5F00] border border-[#FF5F00]/30 font-bold rounded-lg flex items-center gap-1 text-[10px] sm:text-xs flex-shrink-0">
                  <Play size={12} fill="currentColor" /> Free DSLR Video
                </div>
              </div>

              {/* About and Highlights */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-display text-black uppercase tracking-tight">About this Experience</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {selectedStretch.desc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 border border-black/5 rounded-xl bg-gray-50">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Rapids Profile</span>
                    <span className="text-xs font-bold text-black">{selectedStretch.rapids}</span>
                  </div>
                  <div className="p-3 border border-black/5 rounded-xl bg-gray-50">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Age Eligibility</span>
                    <span className="text-xs font-bold text-black">{selectedStretch.ageLimit}</span>
                  </div>
                  <div className="p-3 border border-black/5 rounded-xl bg-gray-50">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Weight Limits</span>
                    <span className="text-xs font-bold text-black">{selectedStretch.weightLimit}</span>
                  </div>
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-black/5">
                <div className="space-y-3">
                  <h4 className="font-bold text-sm font-display text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Check size={16} className="text-green-600 stroke-[3]" /> What's Included
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-gray-600">
                    <li className="flex items-center gap-2">• High Buoyancy Life Jacket</li>
                    <li className="flex items-center gap-2">• Carbon Fiber / High Grade Helmet</li>
                    <li className="flex items-center gap-2">• Balanced Oar Paddle</li>
                    <li className="flex items-center gap-2">• Certified Ganga River Guide (Rescue Expert)</li>
                    <li className="flex items-center gap-2">• Free DSLR Video & Cliff Jump Footage</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-sm font-display text-black uppercase tracking-wider flex items-center gap-1.5">
                    <X size={16} className="text-red-600 stroke-[3]" /> What's Excluded
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-gray-600">
                    <li className="flex items-center gap-2">• Personal expenses & dry bags</li>
                    <li className="flex items-center gap-2">• Transport from endpoint back to start point</li>
                    <li className="flex items-center gap-2">• Locker fees & heavy luggage management</li>
                  </ul>
                </div>
              </div>

              {/* Safety, Eligibility and Restrictions */}
              <div className="p-6 border border-red-100 bg-red-50/50 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm font-display text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartCrack size={16} className="text-red-700" /> Safety & Health Eligibility
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-gray-700">
                  <div className="space-y-2">
                    <span className="block font-bold text-red-800">Who is Eligible:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Minimum age 14 years, Max age 60 years</li>
                      <li>Fits within 40-100 kg weight envelope</li>
                      <li>Swimmers & non-swimmers both are allowed</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <span className="block font-bold text-red-800">NOT Suitable For:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Pregnant women</li>
                      <li>Heart patients or individuals with high blood pressure</li>
                      <li>Prior back, neck, or spine injuries</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Operator Selection Modal */}
              <AnimatePresence>
                {showOperatorModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg p-6 md:p-8 max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative font-sans text-black"
                    >
                      {/* Close Button */}
                      <button
                        onClick={() => setShowOperatorModal(false)}
                        className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <X size={18} />
                      </button>

                      {/* Header */}
                      <div className="space-y-1 pr-8">
                        <span className="text-[10px] text-accent font-black uppercase tracking-wider block">
                          Comparison Desk
                        </span>
                        <h3 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight">
                          Select Your Operator
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Choose from certified local safety crews for {selectedStretch.name}
                        </p>
                      </div>

                      {/* Operator List Container */}
                      <div className="pt-2">
                        <OperatorSelector
                          operators={
                            selectedStretch.operators && selectedStretch.operators.length > 0
                              ? selectedStretch.operators.map(op => ({
                                  id: op.id,
                                  vendorName: op.vendors?.name || op.name || 'Local Operator',
                                  shopImage: op.vendors?.shop_image || null,
                                  starRating: op.vendors?.star_rating !== undefined ? op.vendors.star_rating : 4.5,
                                  landmark: op.vendors?.landmark || op.vendors?.address || 'Rishikesh',
                                  price: Number(op.price || selectedStretch.price),
                                  originalPrice: op.original_price ? Number(op.original_price) : null,
                                  isLimitedOffer: !!op.is_limited_offer,
                                  commissionPercentage: op.commission_percentage || op.vendors?.commission_percentage || 10,
                                  _raw: op
                                }))
                              : [
                                  {
                                    id: selectedStretch.id,
                                    vendorName: 'Local Rishikesh Crew',
                                    shopImage: null,
                                    starRating: 4.5,
                                    landmark: selectedStretch.stretch || 'Shivpuri, Rishikesh',
                                    price: selectedStretch.price,
                                    originalPrice: selectedStretch.original_price || null,
                                    isLimitedOffer: selectedStretch.is_limited_offer || false,
                                    commissionPercentage: selectedStretch.commission_percentage || 10,
                                    _raw: selectedStretch
                                  }
                                ]
                          }
                          onBookOperator={(op) => {
                            setShowOperatorModal(false);
                            const raw = op._raw;
                            openBookingModal({
                              id: raw.id || selectedStretch.id,
                              name: `${selectedStretch.name} - ${op.vendorName}`,
                              stretch: selectedStretch.stretch,
                              price: op.price,
                              category: 'rafting',
                              city_id: raw.city_id,
                              vendor_id: raw.vendor_id,
                              commission_percentage: raw.commission_percentage || raw.vendors?.commission_percentage,
                              vendors: raw.vendors
                            });
                          }}
                          activityName={selectedStretch.name}
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Logistics Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-black/5">
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Pickup Point & Details</span>
                  <p className="text-sm font-semibold text-black flex items-center gap-1">
                    <MapPin size={16} /> Tapovan / Laxman Jhula Office, Rishikesh
                  </p>
                  <p className="text-xs text-gray-500">Arrive at least 15 minutes before your scheduled slot for registration and briefing.</p>
                </div>
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Cancellation Policy</span>
                  <p className="text-sm font-semibold text-black flex items-center gap-1">
                    <Info size={16} /> 100% Refund Guarantee
                  </p>
                  <p className="text-xs text-gray-500">Cancel up to 24 hours before the activity schedule time to receive a full refund of your 10% deposit.</p>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-4 pt-6 border-t border-black/5">
                <h4 className="font-bold text-lg font-display text-black uppercase tracking-tight">Rafting FAQs</h4>
                <div className="space-y-2.5">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="border border-black/10 rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full py-4 px-5 text-left font-bold text-sm text-black flex justify-between items-center bg-gray-50 hover:bg-gray-100/50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={16} className={`transform transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {activeFaq === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="p-5 text-xs text-gray-600 leading-relaxed font-medium border-t border-black/5">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pay 10% Banner */}
              <div className="bg-[#FFF0E5] border-2 border-[#FF6B00] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-black mt-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={28} className="text-black flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-tight">SECURE YOUR BOOKING FOR 10% ADVANCE</h4>
                    <p className="text-xs text-gray-600 font-medium">Pay only ₹{Math.round(selectedStretch.price * 0.1)} per person online today. Cancel anytime for full refund.</p>
                  </div>
                </div>
                <button
                  onClick={() => openBookingModal({
                    id: selectedStretch.id,
                    name: selectedStretch.name,
                    stretch: selectedStretch.stretch,
                    price: selectedStretch.price,
                    category: 'rafting',
                    city_id: selectedStretch.city_id,
                    vendor_id: selectedStretch.vendor_id
                  })}
                  className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
                >
                  Book Now
                </button>
              </div>

              {/* Auto Sliding Reviews */}
              <div className="border border-black/5 bg-gray-50 rounded-xl p-6 relative overflow-hidden min-h-[130px] flex items-center mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeReviewIdx}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="space-y-2 w-full"
                  >
                    <div className="flex text-yellow-400 gap-0.5">
                      {[...Array(reviews[activeReviewIdx].stars)].map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-sm font-medium italic text-black pr-16 leading-relaxed">
                      "{reviews[activeReviewIdx].text}"
                    </p>
                    <span className="text-xs font-bold text-gray-500">— {reviews[activeReviewIdx].name}</span>
                  </motion.div>
                </AnimatePresence>
                <span className="absolute right-6 top-6 text-[10px] bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 font-bold px-2 py-0.5 rounded">Rafting Guest</span>
              </div>
            </div>

            {/* Mobile / Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-black/10 p-4 z-40 flex items-center justify-between max-w-4xl mx-auto rounded-t-xl shadow-xl">
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">{selectedStretch.name}</span>
                <span className="text-lg font-black text-black">
                  Starts from ₹{selectedStretch.price.toLocaleString('en-IN')}<span className="text-xs text-gray-500 font-semibold">/person</span>
                </span>
              </div>
              <button
                onClick={() => setShowOperatorModal(true)}
                className="py-3.5 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
              >
                Choose Operator
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
