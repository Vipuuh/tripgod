import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Clock, MapPin, Flame } from 'lucide-react';
import { supabase } from '../supabase';
import ActivityDetail from '../components/ActivityDetail';

const defaultCamps = [
  {
    id: 'camping-default',
    name: 'RIVERSIDE CAMPING RISHIKESH',
    description: 'Immerse yourself in nature at our luxury riverside campsite in Shivpuri. Wake up to the sound of flowing water and the chirping of birds. The camping package includes overnight accommodation in clean, spacious Swiss tents with attached washrooms, delicious buffet meals, bonfire evenings, and adventure activities like volleyball and hiking.',
    price: 1800,
    route: 'Shivpuri Riverside Campsite, Rishikesh',
    duration: '1 Night / 2 Days',
    images: [
      '/camping-hero.jpg',
      '/camping-1.jpg',
      '/camping-2.jpg',
      '/camping-3.jpg',
      '/camping-4.jpg'
    ],
    inclusions: [
      'Swiss tent accommodation with attached modern bathrooms',
      'Welcome drinks & snacks upon arrival',
      'All Meals: Buffet Dinner, Morning Breakfast & Evening Snacks',
      'Bonfire, light music, and volleyball/hiking games'
    ],
    exclusions: [
      'Locker facilities (Available at checkout counter)',
      'Private transport to the campsite from town center',
      'Personal toiletry items'
    ],
    rating: 4.6,
    reviewsCount: 618,
    coming_soon: false,
    operators: []
  }
];

export default function Camping({ currentCity, openBookingModal }) {
  const [campsData, setCampsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamp, setSelectedCamp] = useState(null);

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
    const fetchCamping = async () => {
      setLoading(true);
      try {
        let query = supabase.from('rafting')
          .select('*, vendors(*)')
          .eq('activity_type', 'camping');
        
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
                description: item.description || defaultCamps[0].description,
                price: Number(item.price),
                route: item.route || defaultCamps[0].route,
                duration: item.duration || defaultCamps[0].duration,
                images: item.images && item.images.length > 0 ? item.images : defaultCamps[0].images,
                inclusions: item.inclusions && item.inclusions.length > 0 ? item.inclusions : defaultCamps[0].inclusions,
                exclusions: item.exclusions && item.exclusions.length > 0 ? item.exclusions : defaultCamps[0].exclusions,
                rating: item.rating || 4.8,
                reviewsCount: item.reviews_count || 320,
                cancellation_policy: item.cancellation_policy || '100% refund up to 24 hours prior to arrival.',
                is_closed: item.is_closed,
                closed_reason: item.closed_reason,
                closed_from: item.closed_from,
                closed_until: item.closed_until,
                free_video_type: item.free_video_type || 'none',
                coming_soon: !!item.coming_soon,
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
          setCampsData(mapped);
        } else {
          setCampsData(defaultCamps);
        }
      } catch (err) {
        console.error('Failed to fetch camping data:', err);
        setCampsData(defaultCamps);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCamping();
  }, [currentCity]);

  const handleSelectCamp = (camp) => {
    setSelectedCamp(camp);
    if (camp) {
      window.history.pushState(null, '', `/camping/${camp.id}`);
    } else {
      window.history.pushState(null, '', '/camping');
    }
  };

  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      if (path.startsWith('/camping/')) {
        const campId = path.substring('/camping/'.length);
        if (campsData.length > 0) {
          const matched = campsData.find(c => c.id === campId);
          if (matched) {
            setSelectedCamp(matched);
          }
        }
      } else {
        setSelectedCamp(null);
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [campsData]);

  // Auto-select if only one option (moved to useEffect to avoid setState-in-render crash)
  useEffect(() => {
    if (campsData.length === 1 && !selectedCamp) {
      setSelectedCamp(campsData[0]);
    }
  }, [campsData]);

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
        {!selectedCamp ? (
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
                style={{ backgroundImage: `url('/camping-hero.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-[10px] font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mx-auto">
                  <Flame size={10} fill="currentColor" /> Premium Riverside Stays
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  Camping in Rishikesh
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-xs sm:text-sm font-medium">
                  Stay in clean Swiss luxury tents by the river Ganges. Includes delicious meals, bonfire, and games.
                </p>
              </div>
            </div>

            {/* Camp Cards List */}
            <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black font-display text-black">SELECT CAMPING PACKAGE</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {campsData.map((camp, idx) => (
                  <motion.div
                    key={camp.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="flex flex-col bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={camp.images[0] || '/camping-hero.jpg'}
                        alt={camp.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                      {checkIfClosed(camp).closed && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow-md">
                            Closed
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg font-display text-black leading-snug">{camp.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Clock size={13} className="text-accent" />
                          <span>{camp.duration}</span>
                          <span className="text-slate-300">•</span>
                          <MapPin size={13} className="text-accent" />
                          <span className="truncate max-w-[150px]">{camp.route}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {camp.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                        <div>
                          {camp.coming_soon ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded">
                              Coming Soon
                            </span>
                          ) : (
                            <>
                              <span className="text-[9px] block font-bold text-slate-400 uppercase">Starting From</span>
                              <span className="text-lg font-black text-black">₹{(Number(camp.price) || 0).toLocaleString('en-IN')}</span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelectCamp(camp)}
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
            {/* Show back button only if there are multiple camp packages to return to */}
            {campsData.length > 1 && (
              <div className="max-w-4xl mx-auto px-6 pt-6">
                <button
                  onClick={() => handleSelectCamp(null)}
                  className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-650 hover:text-black hover:border-black transition-colors bg-white cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back to Camp Packages
                </button>
              </div>
            )}

            <ActivityDetail
              id={selectedCamp.id}
              title={selectedCamp.name}
              category="camping"
              price={selectedCamp.price}
              rating={selectedCamp.rating}
              reviewsCount={selectedCamp.reviewsCount}
              heroImage={selectedCamp.images}
              tagline="Unwind under the stars in premium tents by the river."
              description={selectedCamp.description}
              highlights={[
                { label: 'Stay Duration', value: selectedCamp.duration },
                { label: 'Tent Type', value: 'Swiss Luxury Tent' },
                { label: 'Location', value: selectedCamp.route }
              ]}
              inclusions={selectedCamp.inclusions}
              exclusions={selectedCamp.exclusions}
              eligibility={[
                'Primary Guest must be 18 years or older',
                'All ages allowed for accompanying family/friends'
              ]}
              notSuitableFor={[
                'No major medical restrictions',
                'Wheelchair users (due to natural steps leading down to riverbed)'
              ]}
              location={selectedCamp.route}
              cancellation={selectedCamp.cancellation_policy}
              openBookingModal={openBookingModal}
              operators={selectedCamp.operators}
              is_closed={selectedCamp.is_closed}
              closed_reason={selectedCamp.closed_reason}
              closed_from={selectedCamp.closed_from}
              closed_until={selectedCamp.closed_until}
              free_video_type={selectedCamp.free_video_type}
              coming_soon={selectedCamp.coming_soon}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
