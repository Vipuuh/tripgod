import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Calendar, ShieldCheck, Waves } from 'lucide-react';
import { supabase } from '../supabase';

export default function Tours({ currentCity, openBookingModal }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setTours(data);
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
            cancellation_policy: '100% refund up to 72h prior.'
          },
          {
            id: 'demo-tour-2',
            name: 'Chopta Tungnath Valley Trek',
            description: 'Explore the mini Switzerland of Uttarakhand. Trek to the highest Shiva temple in the world (Tungnath) and see majestic Chandrashila peaks.',
            price: 5500,
            duration: '3 Days / 2 Nights',
            images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600'],
            cancellation_policy: '100% refund up to 48h prior.'
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
          {tours.map(tour => {
            const thumbnail = tour.images && tour.images.length > 0 ? tour.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600';
            
            return (
              <motion.div
                key={tour.id}
                whileHover={{ y: -5 }}
                className="border border-black/5 bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group"
              >
                <div>
                  {/* Image */}
                  <div className="h-48 overflow-hidden relative bg-gray-100">
                    <img 
                      src={thumbnail} 
                      alt={tour.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {tour.is_limited_offer && (
                      <span className="absolute top-3 left-3 bg-[#FF5F00] text-white text-[8px] font-black py-1 px-2.5 rounded-full shadow-[0_4px_10px_rgba(255,95,0,0.25)] tracking-wider z-10">
                        LIMITED TIME OFFER
                      </span>
                    )}
                    <div className="absolute top-4 right-4 bg-black text-white text-xs font-black py-1.5 px-3 rounded-full shadow-md flex items-center gap-1.5 z-10">
                      {tour.original_price && Number(tour.original_price) > Number(tour.price) && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{Number(tour.original_price).toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-[#FF6B00]">₹{Number(tour.price).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Info content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-[#FF5F00]" />
                        <span>{tour.duration}</span>
                      </div>
                      {tour.vendors?.name && (
                        <span className="text-[9px] bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] font-black px-2 py-0.5 rounded truncate max-w-[120px]">
                          {tour.vendors.name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg font-display text-black group-hover:text-[#FF5F00] transition-colors leading-tight truncate">
                      {tour.name}
                    </h3>

                    <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                      {tour.description}
                    </p>
                  </div>
                </div>

                {/* Booking Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => openBookingModal({
                      id: tour.id,
                      name: tour.name,
                      price: tour.price,
                      category: 'tour',
                      city_id: tour.city_id,
                      vendor_id: tour.vendor_id,
                      commission_percentage: tour.commission_percentage,
                      vendors: tour.vendors,
                      slots: ['Morning Departure (08:00 AM)', 'Custom Timing']
                    })}
                    className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] transition-all border-none cursor-pointer text-center font-display"
                  >
                    Book Tour Package
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
