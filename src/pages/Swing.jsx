import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Clock, MapPin, Flame } from 'lucide-react';
import { supabase } from '../supabase';
import ActivityDetail from '../components/ActivityDetail';

const defaultSwingOptions = [
  {
    id: 'swing-default',
    name: 'GIANT SWING RISHIKESH',
    description: "Enjoy the thrill of a lifetime on India's highest Giant Swing. Suspended at a height of 113 metres, you are harnessed securely before the platform retracts and sends you free-falling into a massive, sweeping pendulum arc across the lush mountain valley.",
    price: 3600,
    route: 'Giant Swing activity zone, Shivpuri Canyon, Rishikesh',
    duration: '1.5-2 Hours',
    images: [
      '/swing-hero.png',
      '/swing-1.jpg',
      '/swing-2.jpg',
      '/swing-3.jpg',
      '/swing-4.jpg'
    ],
    inclusions: [
      'Double-redundant Safety Harness',
      'Detailed safety briefing by expert instructors',
      'Official Giant Swing completion certificate',
      'Shuttle service from Tapovan registration office'
    ],
    exclusions: [
      'Full HD DSLR Video (Extra ₹600)',
      'Viewer tickets (₹500/viewer)'
    ],
    rating: 4.9,
    reviewsCount: 312,
    coming_soon: true,
    operators: []
  }
];

export default function Swing({ currentCity, openBookingModal }) {
  const [swingData, setSwingData] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSwing, setSelectedSwing] = useState(null);

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
    const fetchSwing = async () => {
      setLoading(true);
      try {
        let query = supabase.from('rafting')
          .select('*, vendors(*)')
          .eq('activity_type', 'swing');
        
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data && data.length > 0) {
          // 1. Raw mapping
          const mappedSwing = data.map(item => ({
            ...item,
            price: Number(item.price),
            rating: item.coming_soon ? 0 : (item.rating || 4.9),
            reviewsCount: item.coming_soon ? 0 : (item.reviews_count || 320),
            coming_soon: item.coming_soon !== undefined && item.coming_soon !== null ? !!item.coming_soon : false,
            upi_discount: item.upi_discount ? Number(item.upi_discount) : null
          }));
          setSwingData(mappedSwing);

          // 2. Group into Partners List
          const partnersMap = {};
          data.forEach(item => {
            const vendor = item.vendors;
            if (!vendor) return;
            if (!partnersMap[vendor.id]) {
              partnersMap[vendor.id] = {
                id: vendor.id,
                name: vendor.name,
                star_rating: vendor.star_rating || 4.8,
                address: vendor.address || 'Rishikesh, Uttarakhand',
                landmark: vendor.landmark || 'Nearby Mohan Chatti',
                shop_image: vendor.shop_image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600',
                swings: []
              };
            }
            partnersMap[vendor.id].swings.push({
              ...item,
              price: Number(item.price),
              rating: item.coming_soon ? 0 : (item.rating || 4.9),
              reviewsCount: item.coming_soon ? 0 : (item.reviews_count || 320),
              coming_soon: item.coming_soon !== undefined && item.coming_soon !== null ? !!item.coming_soon : false,
              upi_discount: item.upi_discount ? Number(item.upi_discount) : null,
              operators: [item]
            });
          });
          setPartnersData(Object.values(partnersMap));
        } else {
          // Mock partners for demo
          setPartnersData([
            {
              id: 'demo-swing-partner-1',
              name: 'Mohan Chatti Adventure Hub',
              star_rating: 4.9,
              address: 'Mohan Chatti, Rishikesh',
              landmark: 'Ganga Valley Office',
              shop_image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600',
              swings: defaultSwingOptions.map(s => ({ ...s, price: Number(s.price) }))
            }
          ]);
          setSwingData(defaultSwingOptions);
        }
      } catch (err) {
        console.error('Failed to fetch swing data:', err);
        setSwingData(defaultSwingOptions);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSwing();
  }, [currentCity]);

  const handleSelectSwing = (swing) => {
    setSelectedSwing(swing);
    if (swing) {
      window.history.pushState(null, '', `/swing/${swing.id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState(null, '', '/swing');
    }
  };

  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      if (path.startsWith('/swing/')) {
        const swingId = path.substring('/swing/'.length);
        if (swingData.length > 0) {
          const matched = swingData.find(s => s.id === swingId);
          if (matched) {
            setSelectedSwing(matched);
          }
        }
      } else {
        setSelectedSwing(null);
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [swingData]);

  // Auto-select if only one option (moved to useEffect to avoid setState-in-render crash)
  useEffect(() => {
    if (swingData.length === 1 && !selectedSwing) {
      setSelectedSwing(swingData[0]);
    }
  }, [swingData]);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {!selectedSwing ? (
          /* SECTION A: LISTING VIEW */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-20"
          >
            {/* Hero Banner */}
            <div className="relative h-[40vh] bg-black flex items-center justify-center text-center">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url('/swing-hero.png')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-[10px] font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mx-auto">
                  <Flame size={10} fill="currentColor" /> Ultimate Pendulum Thrills
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  Giant Swing Rishikesh
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-xs sm:text-sm font-medium">
                  Swing 113 metres above deep river valleys, solo or in couples. Experience speeds up to 110 km/h.
                </p>
              </div>
            </div>

            {/* PARTNERS LIST */}
            {!selectedPartner ? (
              <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black font-display text-black uppercase">SELECT SWING PARTNERS</h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
                </div>

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
                          src={partner.shop_image || '/swing-hero.png'}
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
                            Offers {partner.swings.length} swing package(s) with pre-verified slots.
                          </p>
                        </div>

                        <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] block font-bold text-slate-400 uppercase text-left">Starting From</span>
                            <span className="text-lg font-black text-black">
                              ₹{partner.swings.length > 0 ? Math.min(...partner.swings.map(s => s.price)).toLocaleString('en-IN') : '0'}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedPartner(partner)}
                            className="py-2.5 px-4 bg-accent hover:bg-[#FF3E00] text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-none flex items-center gap-1"
                          >
                            View Packages <ChevronLeft className="rotate-180" size={14} />
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
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider select-none animate-pulse">Verified Partner</span>
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
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left font-display">Available Swing Packages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {selectedPartner.swings.map((opt, idx) => (
                      <motion.div
                        key={opt.id || idx}
                        className="flex flex-col bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="relative h-48 overflow-hidden bg-slate-100">
                          <img
                            src={opt.images[0] || '/swing-hero.png'}
                            alt={opt.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          />
                          {checkIfClosed(opt).closed && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-md">
                                Closed
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-bold text-base font-display text-black text-left leading-snug uppercase">{opt.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 text-left">
                              <Clock size={13} className="text-accent" />
                              <span>{opt.duration}</span>
                              <span className="text-slate-300">•</span>
                              <MapPin size={13} className="text-accent" />
                              <span className="truncate max-w-[120px]">{opt.route}</span>
                            </div>
                            <p className="text-xs text-slate-555 text-left line-clamp-3 leading-relaxed">
                              {opt.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                            <div>
                              {opt.coming_soon ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded">
                                  Coming Soon
                                </span>
                              ) : (
                                <>
                                  <span className="text-[9px] block font-bold text-slate-400 uppercase text-left">Starting From</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-black text-black">₹{(Number(opt.price) || 0).toLocaleString('en-IN')}</span>
                                    {opt.upi_discount > 0 && (
                                      <span className="text-[9px] font-black text-[#FF6B00] bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 select-none">
                                        💳 UPI: Save ₹{opt.upi_discount}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                handleSelectSwing(opt);
                              }}
                              className="py-2.5 px-4 bg-accent hover:bg-[#FF3E00] text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-none flex items-center gap-1"
                            >
                              View Details <ChevronLeft className="rotate-180" size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* SECTION B: DETAILED VIEW */
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div className="max-w-4xl mx-auto px-6 pt-6">
              <button
                onClick={() => handleSelectSwing(null)}
                className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-650 hover:text-black hover:border-black transition-colors bg-white cursor-pointer select-none"
              >
                <ChevronLeft size={16} /> Back to Swing Packages
              </button>
            </div>
            {/* balanced brace */}

            <ActivityDetail
              id={selectedSwing.id}
              title={selectedSwing.name}
              category="swing"
              price={selectedSwing.price}
              rating={selectedSwing.rating}
              reviewsCount={selectedSwing.reviewsCount}
              heroImage={selectedSwing.images}
              tagline="Swing 113 metres above deep river valleys, solo or in couples."
              description={selectedSwing.description}
              highlights={[
                { label: 'Platform Height', value: '113 Metres' },
                { label: 'Duration', value: selectedSwing.duration },
                { label: 'Location', value: selectedSwing.route }
              ]}
              inclusions={selectedSwing.inclusions}
              exclusions={selectedSwing.exclusions}
              eligibility={[
                'Age 12 to 65 Years',
                'Weight 35 kg to 110 kg (Combined max 200kg for couples)'
              ]}
              notSuitableFor={[
                'Pregnant women',
                'Heart conditions, high BP or breathing ailments',
                'Epilepsy or chronic back/neck spinal conditions'
              ]}
              location={selectedSwing.route}
              cancellation={selectedSwing.cancellation_policy}
              openBookingModal={openBookingModal}
              operators={selectedSwing.operators}
              is_closed={selectedSwing.is_closed}
              closed_reason={selectedSwing.closed_reason}
              closed_from={selectedSwing.closed_from}
              closed_until={selectedSwing.closed_until}
              free_video_type={selectedSwing.free_video_type}
              coming_soon={selectedSwing.coming_soon}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
