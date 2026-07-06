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
    operators: []
  }
];

export default function Swing({ currentCity, openBookingModal }) {
  const [swingData, setSwingData] = useState([]);
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
          const grouped = {};
          data.forEach(item => {
            const key = item.name.trim();
            if (!grouped[key]) {
              grouped[key] = {
                id: item.id,
                name: item.name,
                description: item.description || defaultSwingOptions[0].description,
                price: Number(item.price),
                route: item.route || defaultSwingOptions[0].route,
                duration: item.duration || defaultSwingOptions[0].duration,
                images: item.images && item.images.length > 0 ? item.images : defaultSwingOptions[0].images,
                inclusions: item.inclusions && item.inclusions.length > 0 ? item.inclusions : defaultSwingOptions[0].inclusions,
                exclusions: item.exclusions && item.exclusions.length > 0 ? item.exclusions : defaultSwingOptions[0].exclusions,
                rating: item.rating || 4.9,
                reviewsCount: item.reviews_count || 320,
                cancellation_policy: item.cancellation_policy || '100% refund up to 24 hours prior to arrival.',
                is_closed: item.is_closed,
                closed_reason: item.closed_reason,
                closed_from: item.closed_from,
                closed_until: item.closed_until,
                operators: []
              };
            }
            
            grouped[key].operators.push(item);
            if (Number(item.price) < grouped[key].price) {
              grouped[key].price = Number(item.price);
            }
            if (item.images && item.images.length > grouped[key].images.length) {
              grouped[key].images = item.images;
            }
          });
          
          const mapped = Object.values(grouped);
          setSwingData(mapped);
        } else {
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

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  // If only one option exists, show details directly
  if (swingData.length === 1 && !selectedSwing) {
    setSelectedSwing(swingData[0]);
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

            {/* Swing Options Cards List */}
            <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black font-display text-black">SELECT SWING PACKAGE</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {swingData.map((opt, idx) => (
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
                          <span className="text-[9px] block font-bold text-slate-400 uppercase">Starting From</span>
                          <span className="text-lg font-black text-black">₹{opt.price.toLocaleString('en-IN')}</span>
                        </div>
                        <button
                          onClick={() => setSelectedSwing(opt)}
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
            {swingData.length > 1 && (
              <div className="max-w-4xl mx-auto px-6 pt-6">
                <button
                  onClick={() => setSelectedSwing(null)}
                  className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-650 hover:text-black hover:border-black transition-colors bg-white cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back to Swing Packages
                </button>
              </div>
            )}

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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
