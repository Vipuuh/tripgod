import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Clock, MapPin, Flame, Video } from 'lucide-react';
import { supabase } from '../supabase';
import ActivityDetail from '../components/ActivityDetail';

const defaultBungeeOptions = [
  {
    id: 'bungee-117mv',
    name: '117M Bungee Jump with DSLR Video',
    description: 'The ultimate bungee jumping experience in India. Leap from a height of 117 metres above a rocky river valley. Includes high-definition DSLR video footage capturing your jump.',
    price: 4600,
    route: 'Jumpin Heights Zone, Rishikesh',
    duration: '1.5-2 Hours',
    images: ['/bungee-hero.jpg', '/bungee-2.jpg', '/bungee-3.jpg'],
    inclusions: [
      '117 Metres Bungee Jump from Cantilever Platform',
      'Safety briefing & certified jump instructors',
      'High-definition DSLR video footage included',
      'Officially signed Jump Certificate'
    ],
    exclusions: [
      'Transport to jump site (available as add-on)',
      'Entry ticket to the bungee park (Rs. 100/person)'
    ],
    rating: 4.9,
    reviewsCount: 412,
    operators: [],
    height: '117M',
    videoIncluded: true
  },
  {
    id: 'bungee-117m',
    name: '117M Bungee Jump without Video',
    description: 'The classic 117-metre high bungee jump. Jump from India\'s tallest cantilever platform. Capture the memories in your heart! (DSLR Video can be bought at the counter separately).',
    price: 4200,
    route: 'Jumpin Heights Zone, Rishikesh',
    duration: '1.5 Hours',
    images: ['/bungee-4.jpg', '/bungee-2.jpg', '/bungee-3.jpg'],
    inclusions: [
      '117 Metres Bungee Jump from Cantilever Platform',
      'Safety briefing & certified jump instructors',
      'Officially signed Jump Certificate'
    ],
    exclusions: [
      'DSLR Video footage (can buy at counter)',
      'Transport to jump site'
    ],
    rating: 4.8,
    reviewsCount: 320,
    operators: [],
    height: '117M',
    videoIncluded: false
  },
  {
    id: 'bungee-combo',
    name: 'Combo: Bungee Jump (111M) + Giant Swing (113M) with Video',
    description: 'Get the best of both worlds! Leap off the 111M bungee platform, then take a massive swing on the 113M Giant Swing. Includes high-quality DSLR video footage for both activities.',
    price: 5300,
    route: 'Mohanchatti Adventure Canyon, Rishikesh',
    duration: '3-4 Hours',
    images: ['/bungee-5.jpg', '/swing-hero.png', '/bungee-3.jpg'],
    inclusions: [
      '111 Metres Bungee Jump',
      '113 Metres Giant Swing',
      'DSLR video footage for both activities',
      'Safety certificates for both jumps'
    ],
    exclusions: [
      'Transport to the park',
      'Food & drinks'
    ],
    rating: 4.9,
    reviewsCount: 570,
    operators: [],
    height: '111M & 113M',
    videoIncluded: true
  }
];

export default function Bungee({ currentCity, openBookingModal }) {
  const [bungeeData, setBungeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBungee, setSelectedBungee] = useState(null);

  useEffect(() => {
    const fetchBungee = async () => {
      setLoading(true);
      try {
        let query = supabase.from('rafting')
          .select('*, vendors(*)')
          .eq('activity_type', 'bungee');
        
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
                description: item.description || defaultBungeeOptions[0].description,
                price: Number(item.price),
                route: item.route || defaultBungeeOptions[0].route,
                duration: item.duration || defaultBungeeOptions[0].duration,
                images: item.images && item.images.length > 0 ? item.images : defaultBungeeOptions[0].images,
                inclusions: item.inclusions && item.inclusions.length > 0 ? item.inclusions : defaultBungeeOptions[0].inclusions,
                exclusions: item.exclusions && item.exclusions.length > 0 ? item.exclusions : defaultBungeeOptions[0].exclusions,
                rating: item.rating || 4.8,
                reviewsCount: item.reviews_count || 320,
                cancellation_policy: item.cancellation_policy || '100% refund up to 24 hours prior.',
                height: item.distance_km ? `${item.distance_km}M` : '117M',
                videoIncluded: item.name.toLowerCase().includes('with video') || item.name.toLowerCase().includes('with dslr video'),
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
          setBungeeData(mapped);
        } else {
          setBungeeData(defaultBungeeOptions);
        }
      } catch (err) {
        console.error('Failed to fetch bungee data:', err);
        setBungeeData(defaultBungeeOptions);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBungee();
  }, [currentCity]);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  // If only one option exists, show details directly
  if (bungeeData.length === 1 && !selectedBungee) {
    setSelectedBungee(bungeeData[0]);
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {!selectedBungee ? (
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
                style={{ backgroundImage: `url('/bungee-hero.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-[10px] font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mx-auto">
                  <Flame size={10} fill="currentColor" /> India's Tallest Cantilevers
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  Bungee Jumping
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-xs sm:text-sm font-medium">
                  Leap into space from heights up to 117 metres. Guided by professional international crews.
                </p>
              </div>
            </div>

            {/* Bungee Jump Options List */}
            <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black font-display text-black">SELECT JUMP PACKAGE</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {bungeeData.map((opt, idx) => (
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
                        src={opt.images[0] || '/bungee-hero.jpg'}
                        alt={opt.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-xs text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                        Height: {opt.height}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-base font-display text-black leading-snug">{opt.name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Clock size={13} className="text-accent" />
                          <span>{opt.duration}</span>
                          <span className="text-slate-300">•</span>
                          {opt.videoIncluded && (
                            <span className="text-[10px] text-green-700 bg-green-50 border border-green-150 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                              <Video size={10} /> Video Inc.
                            </span>
                          )}
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
                          onClick={() => setSelectedBungee(opt)}
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
            {bungeeData.length > 1 && (
              <div className="max-w-4xl mx-auto px-6 pt-6">
                <button
                  onClick={() => setSelectedBungee(null)}
                  className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-650 hover:text-black hover:border-black transition-colors bg-white cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back to Jump Packages
                </button>
              </div>
            )}

            <ActivityDetail
              id={selectedBungee.id}
              title={selectedBungee.name}
              category="bungee"
              price={selectedBungee.price}
              rating={selectedBungee.rating}
              reviewsCount={selectedBungee.reviewsCount}
              heroImage={selectedBungee.images}
              tagline={`Leap from India's premium ${selectedBungee.height} cantilever platform.`}
              description={selectedBungee.description}
              highlights={[
                { label: 'Platform Height', value: selectedBungee.height },
                { label: 'Jump Duration', value: selectedBungee.duration },
                { label: 'Location', value: selectedBungee.route }
              ]}
              inclusions={selectedBungee.inclusions}
              exclusions={selectedBungee.exclusions}
              eligibility={[
                'Age 12 to 65 Years',
                'Weight 35 kg to 110 kg'
              ]}
              notSuitableFor={[
                'Pregnant women',
                'Heart conditions, high BP or breathing ailments',
                'Epilepsy or chronic back/neck spinal conditions'
              ]}
              location={selectedBungee.route}
              cancellation={selectedBungee.cancellation_policy}
              openBookingModal={openBookingModal}
              operators={selectedBungee.operators}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
