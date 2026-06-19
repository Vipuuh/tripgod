import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, MessageSquare, Sparkles, MapPin, 
  Bed, Trees, ShieldAlert, Check, X, ShieldCheck
} from 'lucide-react';
import { supabase } from '../supabase';

export default function Hotels({ currentCity, openBookingModal }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback demo stays
  const demoStays = [
    {
      id: 'demo-hotel-1',
      name: 'Valley View Cottage',
      address: 'Near Ram Jhula, Rishikesh',
      price: 2200,
      images: ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=600'],
      description: 'A cozy property nestled in the hills of Rishikesh near Ram Jhula. Enjoy panoramic mountain views, modern amenities, free WiFi, and warm hospitality.',
      amenities: { wifi: true, ac: true, mountain_view: true, geyser: true },
      rules: { unmarried_couples: true, pets: false, smoking: false },
      landmarks: ['Ram Jhula - 1.2 KM', 'Parmarth Niketan - 2 KM']
    },
    {
      id: 'demo-hotel-2',
      name: 'Ganga View Resort',
      address: 'Near Laxman Jhula, Rishikesh',
      price: 4500,
      images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600'],
      description: 'Experience luxury on the banks of the holy Ganges. Features directly river-facing balconies, in-house yoga sessions, rooftop organic restaurant, and swimming pool.',
      amenities: { wifi: true, ac: true, river_view: true, restaurant: true, room_service: true },
      rules: { unmarried_couples: true, pets: true, smoking: false },
      landmarks: ['Laxman Jhula - 500 Meters', 'Little Buddha Cafe - 400 Meters']
    }
  ];

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        let query = supabase.from('hotels').select('*');
        if (currentCity && currentCity.id !== 'default') {
          query = query.eq('city_id', currentCity.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (data && data.length > 0) {
          setHotels(data);
        } else {
          setHotels(demoStays);
        }
      } catch (err) {
        console.error('Error fetching hotels from Supabase:', err);
        setHotels(demoStays);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [currentCity]);

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(`*ENQUIRY ABOUT STAYS - TRIPGOD*\nHello! I am planning a trip to Rishikesh and want to book accommodations. Please let me know what options are available.`);
    window.open(`https://wa.me/919837371137?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-black space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#FF5F00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <span className="text-[10px] uppercase font-black tracking-widest text-[#FF5F00]">Loading Accommodations...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] bg-white flex flex-col py-16 font-sans">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        
        {/* Title Section */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 text-xs font-black uppercase tracking-widest rounded-full">
            <Sparkles size={12} className="stroke-[2.5]" /> Premium Stays
          </span>
          <h1 className="text-3xl md:text-5xl font-black font-display text-black uppercase tracking-tight">
            RESORTS & HOTEL STAYS
          </h1>
          <div className="w-20 h-1 bg-[#FF5F00] mx-auto mt-4" />
          <p className="text-gray-500 max-w-lg mx-auto text-xs sm:text-sm font-medium pt-2 leading-relaxed">
            Choose from the finest boutique cottages, ashrams, and luxury riverside resorts in {currentCity?.name || 'Rishikesh'}.
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotels.map(hotel => {
            const thumbnail = hotel.images && hotel.images.length > 0 ? hotel.images[0] : 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=600';
            
            return (
              <motion.div
                key={hotel.id}
                whileHover={{ y: -5 }}
                className="border border-black/5 bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group"
              >
                <div>
                  {/* Image */}
                  <div className="h-48 bg-gray-100 overflow-hidden relative">
                    <img 
                      src={thumbnail} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 right-4 bg-black text-[#FF6B00] text-xs font-black py-1 px-3 rounded-md shadow-md border border-white/5">
                      ₹{hotel.price}/night
                    </div>
                  </div>

                  {/* Info details */}
                  <div className="p-5 space-y-3.5">
                    <h3 className="font-bold text-lg font-display text-black leading-snug group-hover:text-[#FF5F00] transition-colors truncate">
                      {hotel.name}
                    </h3>
                    
                    <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                      <MapPin size={12} className="text-[#FF5F00]" /> {hotel.address}
                    </p>

                    <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                      {hotel.description}
                    </p>

                    {/* Amenities list */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(hotel.amenities || {}).filter(([_, val]) => !!val).map(([key]) => (
                        <span key={key} className="text-[9px] bg-slate-50 border border-black/5 text-gray-600 font-bold px-2 py-0.5 rounded capitalize">
                          {key.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Book Action */}
                <div className="px-5 pb-5 pt-2">
                  <button
                    onClick={() => openBookingModal({
                      id: hotel.id,
                      name: hotel.name,
                      price: hotel.price,
                      category: 'hotels',
                      city_id: hotel.city_id,
                      vendor_id: hotel.vendor_id,
                      slots: ['Standard Stay (Check-in 12:00 PM)', 'Early Check-in (Subject to Availability)']
                    })}
                    className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer text-center font-display"
                  >
                    Book Hotel Room
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Offline Notice Banner */}
        <div className="max-w-xl mx-auto p-5 border border-black/10 rounded-3xl space-y-4 bg-gray-50 text-center shadow-sm">
          <div className="flex items-center gap-2 text-yellow-800 text-xs font-semibold leading-relaxed justify-center">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>Need custom packages or direct group bookings? Our local team is available 24/7.</span>
          </div>

          <button
            onClick={handleContactWhatsApp}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer font-display"
          >
            <MessageSquare size={16} />
            <span>Enquire Stays on WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
}
