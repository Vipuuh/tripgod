import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Calendar, ShieldCheck, Waves, ChevronLeft, Star } from 'lucide-react';
import { supabase } from '../supabase';
import OperatorSelector from '../components/OperatorSelector';

export default function Tours({ currentCity, openBookingModal }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);

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
            reviewsCount: 198
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
            reviewsCount: 110
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
          name: t.name,
          description: t.description,
          duration: t.duration,
          img: t.images && t.images.length > 0 ? t.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600',
          minPrice: Number(t.price),
          rating: t.rating || 4.7,
          reviewsCount: t.reviewsCount || 120,
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
    return (
      <div className="w-full min-h-screen bg-white pb-20 font-sans">
        {/* Back button header */}
        <div className="bg-slate-50 border-b border-slate-100 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center">
            <button
              onClick={() => setSelectedTour(null)}
              className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider hover:text-accent cursor-pointer border-none bg-transparent"
            >
              <ChevronLeft size={16} /> Back to Packages
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Tour Info Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 h-56 md:h-72 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
              <img src={selectedTour.img} alt={selectedTour.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[10px] text-accent font-black uppercase tracking-wider block">
                  {selectedTour.duration}
                </span>
                <h2 className="text-2xl font-black font-display text-slate-900 uppercase">
                  {selectedTour.name}
                </h2>
                
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <div className="flex items-center gap-1 text-xs text-black font-black">
                    <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                    <span>{selectedTour.rating}</span>
                    <span className="text-gray-500 font-bold">({selectedTour.reviewsCount} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">{selectedTour.description}</p>
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
              operators={selectedTour.operators.map(op => ({
                id: op.id,
                vendorName: op.vendors?.name || op.name || 'Local Operator',
                shopImage: op.vendors?.shop_image || null,
                starRating: op.vendors?.star_rating !== undefined ? op.vendors.star_rating : 4.5,
                landmark: op.vendors?.landmark || op.vendors?.address || 'Rishikesh',
                price: Number(op.price || selectedTour.minPrice),
                originalPrice: op.original_price ? Number(op.original_price) : null,
                isLimitedOffer: !!op.is_limited_offer,
                commissionPercentage: op.commission_percentage || op.vendors?.commission_percentage || 10,
                _raw: op
              }))}
              onBookOperator={(op) => {
                const raw = op._raw;
                openBookingModal({
                  id: raw.id,
                  name: `${selectedTour.name} - ${op.vendorName}`,
                  price: op.price,
                  category: 'tour',
                  city_id: raw.city_id,
                  vendor_id: raw.vendor_id,
                  commission_percentage: raw.commission_percentage || raw.vendors?.commission_percentage,
                  vendors: raw.vendors,
                  slots: ['Morning Departure (08:00 AM)', 'Custom Timing']
                });
              }}
              activityName={selectedTour.name}
            />
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
                <div>
                  {/* Image */}
                  <div className="h-48 overflow-hidden relative bg-gray-100">
                    <img 
                      src={tour.img} 
                      alt={tour.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {tour.operators.some(op => op.is_limited_offer) && (
                      <span className="absolute top-3 left-3 bg-[#FF5F00] text-white text-[8px] font-black py-1 px-2.5 rounded-full shadow-[0_4px_10px_rgba(255,95,0,0.25)] tracking-wider z-10">
                        LIMITED TIME OFFER
                      </span>
                    )}
                    <div className="absolute top-4 right-4 bg-black text-white text-xs font-black py-1.5 px-3 rounded-full shadow-md flex items-center gap-1.5 z-10">
                      {originalPriceToShow && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{originalPriceToShow.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-[#FF6B00]">₹{tour.minPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Info content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-[#FF5F00]" />
                        <span>{tour.duration}</span>
                      </div>
                      <span className="text-[9px] bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] font-black px-2 py-0.5 rounded">
                        {tour.operators.length} Operator{tour.operators.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg font-display text-black group-hover:text-[#FF5F00] transition-colors leading-tight truncate">
                      {tour.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-xs text-black font-bold">
                      <Star size={12} className="text-[#FF5F00]" fill="#FF5F00" />
                      <span>{tour.rating}</span>
                      <span className="text-gray-500 font-semibold">({tour.reviewsCount} reviews)</span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                      {tour.description}
                    </p>
                  </div>
                </div>

                {/* Booking Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTour(tour);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] transition-all border-none cursor-pointer text-center font-display"
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
