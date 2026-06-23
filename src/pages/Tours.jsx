import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, Calendar, ShieldCheck, Waves, ChevronLeft, Star, 
  ChevronDown, ChevronUp, Check, X, Hotel, Car, Utensils, Compass, 
  Flame, Footprints, Moon, Sun, ShoppingBag, Eye, Tag, Info, Ticket, 
  Headphones, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../supabase';

const stripEmojis = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1F000}-\u{1F0DF}]/gu, '')
    .replace(/[\u{1F0E0}-\u{1F0FF}]/gu, '')
    .replace(/[\u{1F100}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F200}-\u{1F2FF}]/gu, '')
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();
};

const getTagIcon = (tag, iconClass = "w-5 h-5 text-slate-500 shrink-0") => {
  const cleaned = stripEmojis(tag).toLowerCase();
  if (cleaned.includes('stay') || cleaned.includes('camp') || cleaned.includes('hotel') || cleaned.includes('tent')) {
    return <Hotel className={iconClass} />;
  }
  if (cleaned.includes('cab') || cleaned.includes('car') || cleaned.includes('drive') || cleaned.includes('pickup') || cleaned.includes('transfer') || cleaned.includes('return')) {
    return <Car className={iconClass} />;
  }
  if (cleaned.includes('meals') || cleaned.includes('breakfast') || cleaned.includes('dinner') || cleaned.includes('food') || cleaned.includes('cuisine') || cleaned.includes('lunch')) {
    return <Utensils className={iconClass} />;
  }
  if (cleaned.includes('driver') || cleaned.includes('guide') || cleaned.includes('orientation') || cleaned.includes('local')) {
    return <Compass className={iconClass} />;
  }
  if (cleaned.includes('bonfire')) {
    return <Flame className={iconClass} />;
  }
  if (cleaned.includes('trek') || cleaned.includes('hiking') || cleaned.includes('walk')) {
    return <Footprints className={iconClass} />;
  }
  if (cleaned.includes('night') || cleaned.includes('stargazing') || cleaned.includes('sky')) {
    return <Moon className={iconClass} />;
  }
  if (cleaned.includes('shopping')) {
    return <ShoppingBag className={iconClass} />;
  }
  if (cleaned.includes('sightseeing') || cleaned.includes('view') || cleaned.includes('photo') || cleaned.includes('spots') || cleaned.includes('darshan') || cleaned.includes('aarti')) {
    return <Eye className={iconClass} />;
  }
  return <Tag className={iconClass} />;
};

const getLucideIcon = (iconName) => {
  switch (iconName) {
    case 'Ticket':
      return <Ticket className="w-5 h-5 text-[#FF5722]" />;
    case 'Shield':
      return <ShieldCheck className="w-5 h-5 text-[#FF5722]" />;
    case 'Headset':
      return <Headphones className="w-5 h-5 text-[#FF5722]" />;
    case 'Hotel':
      return <Hotel className="w-5 h-5 text-[#FF5722]" />;
    case 'Car':
      return <Car className="w-5 h-5 text-[#FF5722]" />;
    case 'Utensils':
      return <Utensils className="w-5 h-5 text-[#FF5722]" />;
    case 'Compass':
      return <Compass className="w-5 h-5 text-[#FF5722]" />;
    default:
      return <CheckCircle2 className="w-5 h-5 text-[#FF5722]" />;
  }
};

const getMockItinerary = (tourName, duration) => {
  if (tourName.toLowerCase().includes('kedarnath')) {
    return [
      {
        day: 1,
        title: 'Rishikesh to Guptkashi',
        tags: ['Pickup', 'Luxury Camp', 'Bonfire'],
        description: 'Drive from Rishikesh to Guptkashi along the Ganges and Mandakini rivers. Arrive, check into luxury camps, and enjoy a warm bonfire in the evening.'
      },
      {
        day: 2,
        title: 'Guptkashi to Kedarnath',
        tags: ['Kedarnath Trek', 'Temple Stay', 'Evening Aarti'],
        description: 'Early morning drive to Sonprayag/Gaurikund, then start the 16km trek to Kedarnath. Check into guest house near the temple and attend the divine evening Aarti.'
      },
      {
        day: 3,
        title: 'Kedarnath to Guptkashi',
        tags: ['Morning Darshan', 'Trek Down', 'Hotel Stay'],
        description: 'Wake up early for the morning Abhishek and Darshan of Lord Kedarnath. Trek down to Gaurikund and drive back to Guptkashi for hotel check-in and rest.'
      },
      {
        day: 4,
        title: 'Guptkashi to Rishikesh',
        tags: ['Return Drive', 'Devprayag', 'Drop-off'],
        description: 'Drive back to Rishikesh, visiting Devprayag confluence on the way. Tour ends with drop-off at Rishikesh railway station or your preferred hotel.'
      }
    ];
  } else if (tourName.toLowerCase().includes('chopta') || tourName.toLowerCase().includes('tungnath')) {
    return [
      {
        day: 1,
        title: 'Rishikesh to Chopta',
        tags: ['Scenic Drive', 'Alpine Camp', 'Stargazing'],
        description: 'Drive from Rishikesh to Chopta, the mini Switzerland of Uttarakhand. Stay in alpine tents under the starry skies.'
      },
      {
        day: 2,
        title: 'Chopta to Tungnath & Chandrashila',
        tags: ['Summit Trek', 'Himalayan View', 'Bonfire Night'],
        description: 'Trek 4km to Tungnath Temple and a further 1.5km to Chandrashila Peak for stunning 360-degree views of the Garhwal Himalayas. Return to camp for a cozy bonfire.'
      },
      {
        day: 3,
        title: 'Chopta to Rishikesh',
        tags: ['Drive Back', 'Devprayag', 'Farewell'],
        description: 'Drive back to Rishikesh via Devprayag confluence. Tour concludes with drop-off at your location.'
      }
    ];
  } else {
    const daysMatch = duration.match(/(\d+)\s*Day/i);
    const numDays = daysMatch ? parseInt(daysMatch[1], 10) : 3;
    const items = [];
    for (let i = 1; i <= numDays; i++) {
      if (i === 1) {
        items.push({
          day: 1,
          title: 'Arrival & Setup',
          tags: ['Pickup', 'Hotel Check-in', 'Orientation'],
          description: 'Arrival at the starting point, transfer to your premium accommodation, briefing session, and rest.'
        });
      } else if (i === numDays) {
        items.push({
          day: i,
          title: 'Return Journey',
          tags: ['Drive Back', 'Souvenir Shopping', 'Drop-off'],
          description: 'Enjoy a scenic breakfast, pack bags, visit local landmarks on the way back, and get dropped off at your destination.'
        });
      } else {
        items.push({
          day: i,
          title: `Sightseeing & Adventure - Day ${i}`,
          tags: ['Guided Trek', 'Photo Spots', 'Local Cuisine'],
          description: `Full day of guided sightseeing, visiting major spots, clicking photos, and enjoying delicious local meals.`
        });
      }
    }
    return items;
  }
};

export default function Tours({ currentCity, openBookingModal, selectedTour, setSelectedTour, navigateTo }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState({ 0: true });
  const [costTab, setCostTab] = useState('included');

  const toggleDay = (idx) => {
    setExpandedDays(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    setSelectedTour(null);
    const fetchTours = async () => {
      setLoading(true);
      try {
        let query = supabase.from('tours').select('*, vendors(*)');
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (data) {
          const mapped = data.map((item, idx) => ({
            ...item,
            rating: item.vendors?.star_rating || item.rating || Number((4.5 + ((idx * 4) % 5) / 10).toFixed(1)),
            reviewsCount: item.reviews_count || (80 + ((idx * 41) % 150))
          }));
          setTours(mapped);
        }
      } catch (err) {
        console.error('Error fetching tours:', err);
        // Fallback demo tours if DB not ready
        setTours([
          {
            id: 'demo-tour-1',
            name: 'Rishikesh to Kedarnath Pilgrimage',
            description: 'A sacred 4 Days / 3 Nights guided yatra to the ancient Kedarnath Temple starting from Rishikesh. Includes luxury transfers, stay, and VIP darshan slips.',
            price: 9500,
            duration: '4 Days / 3 Nights',
            images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600'],
            cancellation_policy: '100% refund up to 72h prior.',
            rating: 4.8,
            reviewsCount: 198,
            quick_info_tags: ['Stay Included', 'Private AC Cab', 'Meals Included', 'Local Driver'],
            reporting_address: 'Reporting Address: TripGod Office, Near Ram Jhula Parking, Rishikesh',
            inclusions: [
              'Accommodation in deluxe hotels/camps on twin sharing basis',
              'All transfers and sightseeing by private air-conditioned cab',
              'Daily breakfast and dinner (MAP plan) at all locations',
              'Services of a professional local driver/guide for the entire tour',
              'All toll taxes, parking fees, state taxes, and driver allowances'
            ],
            exclusions: [
              'Any meals/beverages other than those mentioned in inclusions',
              'Tips to driver, guide, hotel staff, or helpers',
              'Any entrance tickets to monuments, temples, or parks',
              'Personal expenses like laundry, phone calls, shopping, medical bills',
              'Any cost arising due to natural disasters, landslides, or road blocks'
            ],
            day_wise_itinerary: [
              {
                day: 1,
                title: 'Rishikesh to Guptkashi',
                tags: ['Pickup', 'Luxury Camp', 'Bonfire'],
                description: 'Drive from Rishikesh to Guptkashi along the Ganges and Mandakini rivers. Arrive, check into luxury camps, and enjoy a warm bonfire in the evening.'
              },
              {
                day: 2,
                title: 'Guptkashi to Kedarnath',
                tags: ['Kedarnath Trek', 'Temple Stay', 'Evening Aarti'],
                description: 'Early morning drive to Sonprayag/Gaurikund, then start the 16km trek to Kedarnath. Check into guest house near the temple and attend the divine evening Aarti.'
              },
              {
                day: 3,
                title: 'Kedarnath to Guptkashi',
                tags: ['Morning Darshan', 'Trek Down', 'Hotel Stay'],
                description: 'Wake up early for the morning Abhishek and Darshan of Lord Kedarnath. Trek down to Gaurikund and drive back to Guptkashi for hotel check-in and rest.'
              },
              {
                day: 4,
                title: 'Guptkashi to Rishikesh',
                tags: ['Return Drive', 'Devprayag', 'Drop-off'],
                description: 'Drive back to Rishikesh, visiting Devprayag confluence on the way. Tour ends with drop-off at Rishikesh railway station or your preferred hotel.'
              }
            ]
          },
          {
            id: 'demo-tour-2',
            name: 'Chopta Tungnath Valley Trek',
            description: 'Explore the mini Switzerland of Uttarakhand. Trek to the highest Shiva temple in the world (Tungnath) and see majestic Chandrashila peaks.',
            price: 5500,
            duration: '3 Days / 2 Nights',
            images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600'],
            cancellation_policy: '100% refund up to 48h prior.',
            rating: 4.7,
            reviewsCount: 110,
            quick_info_tags: ['Alpine Stay', 'Private AC Cab', 'Meals Included', 'Local Guide'],
            reporting_address: 'Reporting Address: TripGod Activity Desk, Tapovan Bypass Road, Rishikesh',
            inclusions: [
              'Accommodation in premium alpine tents in Chopta',
              'All transfers and sightseeing by private air-conditioned cab',
              'All meals (Breakfast, Lunch, Dinner) during camping',
              'Professional certified trekking guide/leader',
              'All forest entry permits, camping charges, and driver allowance'
            ],
            exclusions: [
              'Any personal gear (trekking poles, warm jackets, boots)',
              'Tips to guide, driver, or camp staff',
              'Mineral water, alcoholic drinks, or laundry expenses',
              'Emergency medical evacuation or rescue charges'
            ],
            day_wise_itinerary: [
              {
                day: 1,
                title: 'Rishikesh to Chopta',
                tags: ['Scenic Drive', 'Alpine Camp', 'Stargazing'],
                description: 'Drive from Rishikesh to Chopta, the mini Switzerland of Uttarakhand. Stay in alpine tents under the starry skies.'
              },
              {
                day: 2,
                title: 'Chopta to Tungnath & Chandrashila',
                tags: ['Summit Trek', 'Himalayan View', 'Bonfire Night'],
                description: 'Trek 4km to Tungnath Temple and a further 1.5km to Chandrashila Peak for stunning 360-degree views of the Garhwal Himalayas. Return to camp for a cozy bonfire.'
              },
              {
                day: 3,
                title: 'Chopta to Rishikesh',
                tags: ['Drive Back', 'Devprayag', 'Farewell'],
                description: 'Drive back to Rishikesh via Devprayag confluence. Tour concludes with drop-off at your location.'
              }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [currentCity]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-black space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#FF5F00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <span className="text-[10px] uppercase font-black tracking-widest text-[#FF5F00]">Loading Tours...</span>
      </div>
    );
  }

  const getGroupedTours = () => {
    const grouped = {};
    tours.forEach(t => {
      const key = t.name;
      if (!grouped[key]) {
        grouped[key] = {
          id: t.id,
          name: t.name,
          description: t.description,
          duration: t.duration,
          img: t.images && t.images.length > 0 ? t.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600',
          minPrice: Number(t.price),
          rating: t.rating || 4.7,
          reviewsCount: t.reviewsCount || 120,
          inclusions: t.inclusions || [],
          exclusions: t.exclusions || [],
          quick_info_tags: t.quick_info_tags || null,
          day_wise_itinerary: t.day_wise_itinerary || t.itinerary || null,
          reporting_address: t.reporting_address || '',
          operators: []
        };
      }
      if (Number(t.price) < grouped[key].minPrice) {
        grouped[key].minPrice = Number(t.price);
      }
      grouped[key].operators.push(t);
    });
    return Object.values(grouped);
  };

  const groupedList = getGroupedTours();

  if (selectedTour) {
    const infoTags = selectedTour.quick_info_tags || ['Stay Included', 'Private AC Cab', 'Meals Included', 'Local Driver'];
    const rawItinerary = selectedTour.day_wise_itinerary || selectedTour.itinerary || [];
    const itineraryData = rawItinerary.length > 0 ? rawItinerary : getMockItinerary(selectedTour.name, selectedTour.duration);
    
    const inclusions = selectedTour.inclusions || [];
    const exclusions = selectedTour.exclusions || [];

    const displayInclusions = inclusions.length > 0 ? inclusions : [
      'Accommodation in deluxe hotels/camps on twin sharing basis',
      'All transfers and sightseeing by private air-conditioned cab',
      'Daily breakfast and dinner (MAP plan) at all locations',
      'Services of a professional local driver/guide for the entire tour',
      'All toll taxes, parking fees, state taxes, and driver allowances'
    ];
    const displayExclusions = exclusions.length > 0 ? exclusions : [
      'Any meals/beverages other than those mentioned in inclusions',
      'Tips to driver, guide, hotel staff, or helpers',
      'Any entrance tickets to monuments, temples, or parks',
      'Personal expenses like laundry, phone calls, shopping, medical bills',
      'Any cost arising due to natural disasters, landslides, or road blocks'
    ];

    const tourId = selectedTour.id || (selectedTour.operators?.[0]?.id) || 'demo-tour-1';

    const defaultWhyBookItems = [
      { icon: 'Ticket', title: 'Instant Confirmation', desc: 'Get your booking voucher instantly in your inbox' },
      { icon: 'Shield', title: 'Safe & Insured Fleets', desc: 'All cabs and campsites are thoroughly safety checked' },
      { icon: 'Headset', title: '24/7 Local Support', desc: 'Direct helpline to our regional support desk during yatra' }
    ];

    const whyBookItems = (selectedTour.why_book_with_us?.items && selectedTour.why_book_with_us.items.length > 0)
      ? selectedTour.why_book_with_us.items
      : defaultWhyBookItems;

    return (
      <div className="w-full min-h-screen bg-gray-50 pb-24 font-sans text-left">
        {/* Back button header */}
        <div className="bg-white border-b border-gray-150 py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center">
            <button
              onClick={() => setSelectedTour(null)}
              className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider hover:text-[#FF5722] cursor-pointer border-none bg-transparent"
            >
              <ChevronLeft size={16} /> Back to Packages
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Card 1: Tour Info Card */}
          <div className="bg-white shadow-md rounded-2xl p-4 border border-gray-100/50">
            <div className="w-full h-56 sm:h-80 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 mb-4">
              <img src={selectedTour.img} alt={selectedTour.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-[#FF5722] font-black uppercase tracking-wider block">
                  {selectedTour.duration}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase leading-tight font-display">
                  {selectedTour.name}
                </h2>
                
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <div className="flex items-center gap-1 text-xs text-black font-black">
                    <Star size={12} className="text-[#FF5722]" fill="#FF5722" />
                    <span>{selectedTour.rating}</span>
                    <span className="text-gray-500 font-bold">({selectedTour.reviewsCount} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">{selectedTour.description}</p>
              
              {/* Quick Info Ribbon */}
              <div className="border-t border-gray-100 pt-3 mt-2">
                <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs text-slate-700 font-bold">
                  {infoTags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      {getTagIcon(tag, "w-4 h-4 text-slate-500 shrink-0")}
                      <span>{stripEmojis(tag)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Why Book With Us Widget */}
          <div className="bg-white shadow-md rounded-2xl p-5 border border-gray-100/50">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-4 font-display">
              Why Book With Us
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {whyBookItems.map((item, idx) => (
                <div key={idx} className="flex flex-col items-start gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2 bg-[#FF5722]/10 rounded-lg">
                    {getLucideIcon(item.icon)}
                  </div>
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  <span className="text-[10px] text-slate-500 leading-normal">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Accordion Itinerary */}
          <div className="bg-white shadow-md rounded-2xl p-4 border border-gray-100/50">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-3 font-display">
              Itinerary Streamline
            </h3>
            <div className="space-y-2">
              {itineraryData.map((day, idx) => {
                const isOpen = !!expandedDays[idx];
                const dayTags = day.tags || [];
                return (
                  <div key={idx} className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => toggleDay(idx)}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-none cursor-pointer"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-[#FF5722] uppercase tracking-wider shrink-0">
                            Day {day.day || idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {day.title || 'Sightseeing'}
                          </span>
                        </div>
                        {/* Mobile highlights/capsule tags */}
                        {dayTags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {dayTags.map((tag, tIdx) => (
                              <span key={tIdx} className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-650 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                                {getTagIcon(tag, "w-3 h-3 text-slate-500 shrink-0")}
                                <span>{stripEmojis(tag)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-slate-400 shrink-0">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="p-3.5 bg-white border-t border-slate-100 text-xs text-slate-600 font-medium leading-relaxed font-sans">
                            {day.description}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Dynamic Cost Tabs (What's Included / Excluded) */}
          <div className="bg-white shadow-md rounded-2xl p-4 border border-gray-100/50">
            <div className="flex border-b border-gray-100 mb-4">
              <button
                type="button"
                onClick={() => setCostTab('included')}
                className={`flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                  costTab === 'included'
                    ? 'border-[#FF5722] text-[#FF5722]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                What's Included
              </button>
              <button
                type="button"
                onClick={() => setCostTab('excluded')}
                className={`flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                  costTab === 'excluded'
                    ? 'border-[#FF5722] text-[#FF5722]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                What's Excluded
              </button>
            </div>

            {costTab === 'included' ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium list-none p-0 m-0 text-left">
                {displayInclusions.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <span className="bg-green-50 text-green-600 rounded-full p-1 w-5 h-5 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium list-none p-0 m-0 text-left">
                {displayExclusions.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <span className="bg-red-50 text-red-605 rounded-full p-1 w-5 h-5 flex items-center justify-center shrink-0">
                      <X size={12} strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Important Tour Guidelines Widget */}
          {selectedTour.tour_guidelines && selectedTour.tour_guidelines.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 shadow-sm text-left">
              <h3 className="text-xs sm:text-sm font-black text-amber-900 uppercase tracking-wider mb-3 font-display flex items-center gap-2">
                <Info size={16} className="text-amber-600" />
                Important Tour Guidelines
              </h3>
              <ul className="space-y-2 list-none p-0 m-0">
                {selectedTour.tour_guidelines.map((guideline, gIdx) => (
                  <li key={gIdx} className="flex gap-2.5 items-start text-xs text-amber-800 font-medium">
                    <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                    <span>{guideline}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Card 4: TripGod Promise checklist */}
          <div className="bg-white shadow-md rounded-2xl p-4 border border-gray-100/50">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-3 font-display">
              TripGod Promise: ₹1 Extra Nahi Dena
            </h3>
            <div className="flex gap-2.5 items-start bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-xs text-slate-750 font-bold text-left">
              <span className="bg-emerald-100 text-[#10B981] rounded-full p-1 shrink-0">
                <Check size={12} strokeWidth={3} />
              </span>
              <div>
                <p className="text-emerald-800 font-black">All Tolls, Taxes, and Driver Allowances Included</p>
                <p className="text-[10px] text-emerald-650 font-medium mt-0.5 leading-relaxed">
                  No hidden charges, parking fees, or driver stay charges. The price you book at is final.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-150 p-4 z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigateTo(`tours/${tourId}/partners`)}
              className="w-full py-4 bg-[#FF5722] hover:bg-[#E54A18] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md text-center border-none font-display"
            >
              SELECT YOUR LOCAL TOUR PARTNER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] bg-white flex flex-col py-16 font-sans">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        
        {/* Banner */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 text-xs font-black uppercase tracking-widest rounded-full">
            EXPLORE THE HIGHLANDS
          </span>
          <h1 className="text-3xl md:text-5xl font-black font-display text-black uppercase tracking-tight">
            TOUR PACKAGES
          </h1>
          <div className="w-20 h-1 bg-[#FF5F00] mx-auto mt-4" />
          <p className="text-gray-500 max-w-lg mx-auto text-xs sm:text-sm font-medium pt-2 leading-relaxed">
            Book complete guided tours, pilgrimages, and trekking yatras across Uttarakhand starting from {currentCity?.name || 'Rishikesh'}.
          </p>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groupedList.map((tour, idx) => {
            const hasMultiple = tour.operators.length > 1;
            const hasDiscount = tour.operators.some(op => op.original_price && Number(op.original_price) > Number(op.price));
            const originalPriceToShow = hasDiscount ? Math.max(...tour.operators.map(op => Number(op.original_price || 0))) : null;

            return (
              <motion.div
                key={tour.name || idx}
                whileHover={{ y: -5 }}
                className="border border-black/5 bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group cursor-pointer"
                onClick={() => setSelectedTour(tour)}
              >
                <div className="flex flex-col flex-grow">
                  {/* Image */}
                  <div className="h-48 overflow-hidden relative bg-gray-100">
                    <img 
                      src={tour.img} 
                      alt={tour.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {tour.operators.some(op => op.is_limited_offer) && (
                      <span className="absolute top-3 left-3 bg-[#FF5722] text-white text-[8px] font-black py-1 px-2.5 rounded-full shadow-[0_4px_10px_rgba(255,95,0,0.25)] tracking-wider z-10">
                        LIMITED TIME OFFER
                      </span>
                    )}
                  </div>

                  {/* Info content */}
                  <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-[#FF5722]" />
                          <span>{tour.duration}</span>
                        </div>
                        <span className="text-[9px] bg-[#FF5722]/10 border border-[#FF5722]/20 text-[#FF5722] font-black px-2 py-0.5 rounded">
                          {tour.operators.length} Operator{tour.operators.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-lg font-display text-slate-900 tracking-tight group-hover:text-[#FF5722] transition-colors leading-tight line-clamp-2">
                        {tour.name}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-xs text-black font-bold">
                        <Star size={12} className="text-[#FF5722]" fill="#FF5722" />
                        <span>{tour.rating}</span>
                        <span className="text-gray-500 font-semibold">({tour.reviewsCount} reviews)</span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                        {tour.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price and CTA Row */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-50 mt-auto pt-4 gap-3">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Starting from</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-slate-900">₹{tour.minPrice.toLocaleString('en-IN')}</span>
                      {originalPriceToShow && (
                        <span className="text-xs text-slate-400 line-through font-medium ml-1">
                          ₹{originalPriceToShow.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTour(tour);
                    }}
                    className="px-4 py-3 bg-[#FF5722] hover:bg-[#E54A18] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border-none cursor-pointer text-center font-display whitespace-nowrap shadow-sm hover:shadow-md"
                  >
                    {hasMultiple ? 'Compare Operators' : 'View Operators'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
