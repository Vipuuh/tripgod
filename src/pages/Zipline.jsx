import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Clock, MapPin, Flame } from 'lucide-react';
import { supabase } from '../supabase';
import ActivityDetail from '../components/ActivityDetail';

const defaultZiplineOptions = [
  {
    id: 'zipline-default',
    name: 'ZIPLINE OVER GANGA RISHIKESH',
    description: "Glide securely suspended above the rapids of Ganga. India's longest and fastest zipline stretches 400 metres across the river valley, offering breathtaking panoramic views of Rishikesh's green hills and the white-water river below.",
    price: 2000,
    route: 'Ganga Zipline activity point, Shivpuri, Rishikesh',
    duration: '45 Minutes',
    images: [
      '/zipline-hero.jpg',
      '/zipline-1.jpg',
      '/zipline-2.jpg',
      '/zipline-3.jpg'
    ],
    inclusions: [
      'Full Safety Body Harness & Carabiner Hook',
      'Sturdy Polycarbonate Helmet',
      'Safety Briefing by Certified Instructors',
      'Access to Zipline platforms'
    ],
    exclusions: [
      'GoPro / Drone Footage (Available for ₹600 extra)',
      'Transport back to town office'
    ],
    rating: 4.8,
    reviewsCount: 845,
    coming_soon: true,
    operators: []
  }
];

export default function Zipline({ currentCity, openBookingModal }) {
  const [zipData, setZipData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZip, setSelectedZip] = useState(null);

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
    const fetchZipline = async () => {
      setLoading(true);
      try {
        let query = supabase.from('rafting')
          .select('*, vendors(*)')
          .eq('activity_type', 'zipline');
        
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data && data.length > 0) {
          const grouped = {};
          data.forEach(item => {
            const key = item.name.trim();
            if (!grouped[key]) {
              grouped[key] = {
                id: item.id,
                name: item.name,
                description: item.description || defaultZiplineOptions[0].description,
                price: Number(item.price),
                route: item.route || defaultZiplineOptions[0].route,
                duration: item.duration || defaultZiplineOptions[0].duration,
                images: item.images && item.images.length > 0 ? item.images : defaultZiplineOptions[0].images,
                inclusions: item.inclusions && item.inclusions.length > 0 ? item.inclusions : defaultZiplineOptions[0].inclusions,
                exclusions: item.exclusions && item.exclusions.length > 0 ? item.exclusions : defaultZiplineOptions[0].exclusions,
                rating: item.coming_soon ? 0 : (item.rating || 4.8),
                reviewsCount: item.coming_soon ? 0 : (item.reviews_count || 320),
                cancellation_policy: item.cancellation_policy || '100% refund up to 24 hours prior to arrival.',
                is_closed: item.is_closed,
                closed_reason: item.closed_reason,
                closed_from: item.closed_from,
                closed_until: item.closed_until,
                free_video_type: item.free_video_type || 'none',
                coming_soon: item.coming_soon !== undefined && item.coming_soon !== null ? !!item.coming_soon : true,
                upi_discount: item.upi_discount ? Number(item.upi_discount) : null,
                operators: []
              };
            }
            
            grouped[key].operators.push(item);
            if (Number(item.price) < grouped[key].price) {
              grouped[key].price = Number(item.price);
              grouped[key].upi_discount = item.upi_discount ? Number(item.upi_discount) : null;
            }
            if (item.images && item.images.length > grouped[key].images.length) {
              grouped[key].images = item.images;
            }
          });
          
          const mapped = Object.values(grouped);
          setZipData(mapped);
        } else {
          setZipData(defaultZiplineOptions);
        }
      } catch (err) {
        console.error('Failed to fetch zipline data:', err);
        setZipData(defaultZiplineOptions);
      } finally {
        setLoading(false);
      }
    };
    
    fetchZipline();
  }, [currentCity]);

  const handleSelectZip = (zip) => {
    setSelectedZip(zip);
    if (zip) {
      window.history.pushState(null, '', `/zipline/${zip.id}`);
    } else {
      window.history.pushState(null, '', '/zipline');
    }
  };

  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      if (path.startsWith('/zipline/')) {
        const zipId = path.substring('/zipline/'.length);
        if (zipData.length > 0) {
          const matched = zipData.find(z => z.id === zipId);
          if (matched) {
            setSelectedZip(matched);
          }
        }
      } else {
        setSelectedZip(null);
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [zipData]);

  // Auto-select if only one option (moved to useEffect to avoid setState-in-render crash)
  useEffect(() => {
    if (zipData.length === 1 && !selectedZip) {
      setSelectedZip(zipData[0]);
    }
  }, [zipData]);

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
        {!selectedZip ? (
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
                style={{ backgroundImage: `url('/zipline-hero.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-[10px] font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mx-auto">
                  <Flame size={10} fill="currentColor" /> Glide Above The Rapids
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  Zipline Rishikesh
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-xs sm:text-sm font-medium">
                  Glide securely suspended across 400 metres above the roaring currents of the holy Ganges.
                </p>
              </div>
            </div>

            {/* Zipline Options Cards List */}
            <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black font-display text-black">SELECT ZIPLINE PACKAGE</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {zipData.map((opt, idx) => (
                  <motion.div
                    key={opt.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="flex flex-col bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={opt.images[0] || '/zipline-hero.jpg'}
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
                    
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-bold text-base font-display text-black leading-snug">{opt.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Clock size={13} className="text-accent" />
                          <span>{opt.duration}</span>
                          <span className="text-slate-300">•</span>
                          <MapPin size={13} className="text-accent" />
                          <span className="truncate max-w-[150px]">{opt.route}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
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
                              <span className="text-[9px] block font-bold text-slate-400 uppercase">Starting From</span>
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
                          onClick={() => handleSelectZip(opt)}
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
            {/* Show back button only if there are multiple options */}
            {zipData.length > 1 && (
              <div className="max-w-4xl mx-auto px-6 pt-6">
                <button
                  onClick={() => handleSelectZip(null)}
                  className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-650 hover:text-black hover:border-black transition-colors bg-white cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back to Zipline Packages
                </button>
              </div>
            )}

            <ActivityDetail
              id={selectedZip.id}
              title={selectedZip.name}
              category="zipline"
              price={selectedZip.price}
              rating={selectedZip.rating}
              reviewsCount={selectedZip.reviewsCount}
              heroImage={selectedZip.images}
              tagline="Glide securely suspended above the rapids of Ganga."
              description={selectedZip.description}
              highlights={[
                { label: 'Zipline Length', value: '400 Metres' },
                { label: 'Duration', value: selectedZip.duration },
                { label: 'Location', value: selectedZip.route }
              ]}
              inclusions={selectedZip.inclusions}
              exclusions={selectedZip.exclusions}
              eligibility={[
                'Age 12 years and above',
                'Weight 30 kg to 100 kg',
                'Physical fitness for brief uphill walk'
              ]}
              notSuitableFor={[
                'Pregnant women',
                'High blood pressure or heart problems',
                'Vertigo or severe fear of heights'
              ]}
              location={selectedZip.route}
              cancellation={selectedZip.cancellation_policy}
              openBookingModal={openBookingModal}
              operators={selectedZip.operators}
              is_closed={selectedZip.is_closed}
              closed_reason={selectedZip.closed_reason}
              closed_from={selectedZip.closed_from}
              closed_until={selectedZip.closed_until}
              free_video_type={selectedZip.free_video_type}
              coming_soon={selectedZip.coming_soon}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
