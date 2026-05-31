import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, MessageSquare, Sparkles, MapPin, 
  Bed, Trees, ShieldAlert
} from 'lucide-react';

const demoStays = [
  {
    name: 'Valley View Cottage',
    location: 'Near Ram Jhula, Rishikesh',
    price: 2200,
    img: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=600',
    highlights: ['Attached Balcony', 'Mountain view', 'Free Wi-Fi']
  },
  {
    name: 'Ganga View Resort',
    location: 'Near Laxman Jhula, Rishikesh',
    price: 4500,
    img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600',
    highlights: ['Direct River view', 'Swimming Pool', 'In-house Yoga']
  }
];

export default function Hotels() {
  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(`*ENQUIRY ABOUT STAYS - TRIPGOD*\nHello! I am planning a trip to Rishikesh and want to book accommodations. Please let me know what options are available.`);
    window.open(`https://wa.me/919837371137?text=${text}`, '_blank');
  };

  return (
    <div className="w-full min-h-[80vh] bg-white flex flex-col justify-center py-20 font-sans">
      <div className="max-w-4xl mx-auto px-6 space-y-12 text-center">
        
        {/* Coming Soon Indicator */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 text-xs font-black uppercase tracking-widest rounded-full">
            <Sparkles size={12} className="stroke-[2.5]" /> Launching Soon
          </span>
          <h1 className="text-2xl md:text-4xl font-bold font-display text-black uppercase tracking-tight">
            STAYS IN RISHIKESH
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto text-xs sm:text-sm font-medium">
            We are partnering with the finest ashrams, boutique cottages, and luxury riverside resorts to bring you the best stays in Rishikesh.
          </p>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {demoStays.map((stay, idx) => (
            <div 
              key={idx}
              className="border border-white/60 bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden text-left opacity-90 hover:opacity-100 transition-all duration-300 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
            >
              <div>
                {/* Image */}
                <div className="h-36 sm:h-40 bg-gray-100 border-b border-black/5 relative">
                  <img src={stay.img} alt={stay.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-black text-[#FF6B00] text-xs font-bold px-2 py-0.5 rounded">
                    ₹{stay.price}/night
                  </div>
                </div>
 
                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <h3 className="font-bold text-sm sm:text-base font-display text-black leading-tight pr-4">{stay.name}</h3>
                  <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                    <MapPin size={12} /> {stay.location}
                  </p>
 
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {stay.highlights.map((hl, i) => (
                      <span key={i} className="text-[8px] bg-gray-50 border border-black/5 text-gray-600 font-bold px-2 py-0.5 rounded">
                        {hl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2">
                <span className="text-[10px] text-gray-400 font-black uppercase block tracking-wider">Demo Listing Only</span>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="max-w-sm mx-auto p-4 border border-black/10 rounded-2xl space-y-3 bg-gray-50">
          <div className="flex items-center gap-2 text-yellow-800 text-[11px] font-semibold leading-relaxed justify-center text-center">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>Currently Stays are booked offline. Contact our team to book!</span>
          </div>

          <button
            onClick={handleContactWhatsApp}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
          >
            <MessageSquare size={16} />
            <span>Book via WhatsApp Support</span>
          </button>
        </div>

      </div>
    </div>
  );
}
