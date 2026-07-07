import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, ShieldCheck, MessageSquare, Phone, 
  Compass, Info, ArrowRightLeft, Clock, Sparkles, AlertCircle
} from 'lucide-react';

const locations = [
  'Rishikesh (City/Local)',
  'Janki Jhula',
  'Ram Jhula',
  'Laxman Jhula',
  'Yog Nagri Rishikesh Station',
  'Rishikesh Station',
  'Haridwar Railway Station',
  'Dehradun Airport (Jolly Grant)'
];

const fleet = [
  {
    id: 'mahindra-auto',
    name: 'Mahindra Auto (Blue)',
    type: 'Local Auto Rickshaw',
    capacity: '4 Passengers',
    luggage: 'Light Luggage Only',
    img: '/mahindra-blue.png',
    desc: 'The iconic blue Mahindra auto rickshaw. Agile, eco-friendly, and perfect for navigating the narrow, busy lanes of Ram Jhula and Laxman Jhula. Great for quick ashram transfers.',
    status: 'Available Now'
  },
  {
    id: 'vikram-auto',
    name: 'Vikram Auto (Blue)',
    type: 'Shared/Private Vikram',
    capacity: '6 Passengers',
    luggage: 'Medium Luggage',
    img: '/vikram-blue.jpg',
    desc: 'Spacious blue Vikram auto. Heavy-duty build with a larger passenger cabin. Excellent choice for small families or groups traveling with luggage to the stations.',
    status: 'Available Now'
  },
  {
    id: 'premium-car',
    name: 'AC Sedan / SUV / Hatchback',
    type: 'Private Comfort Cab',
    capacity: '4-7 Passengers',
    luggage: 'Heavy Luggage Support',
    img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600',
    desc: 'Fully air-conditioned private cars for luxury highway transfers. Direct comfortable transit from Haridwar Junction and Jolly Grant Airport to Rishikesh.',
    status: 'Coming Soon'
  }
];

const highlights = [
  { title: 'Zero Advance Payment', desc: 'No advance booking fees or online transactions required. Discuss and finalize on call, then pay directly.' },
  { title: 'Offline Verification', desc: 'Book with complete transparency. Driver details and route finalization are completed directly over the phone.' },
  { title: '100% Reliable Drivers', desc: 'Courteous local drivers with years of experience navigating both local town streets and highways.' },
  { title: 'On-Time Pickup', desc: 'Punctuality is our guarantee. Autos and drivers will be ready at your pickup point before your scheduled time.' }
];

export default function Pickup() {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('mahindra-auto');

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 35 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  const handleWhatsAppEnquiry = () => {
    if (!pickup || !drop) {
      alert('Please select both Pickup and Drop points.');
      return;
    }
    const vehicleName = fleet.find(f => f.id === selectedVehicle)?.name || selectedVehicle;
    const text = encodeURIComponent(
      `Hi TripGod! I want to enquire about a pickup and drop ride:\n\n` +
      `📍 Pickup: ${pickup}\n` +
      `🏁 Drop: ${drop}\n` +
      `🛺 Vehicle: ${vehicleName}\n\n` +
      `Please let me know the price and availability.`
    );
    window.open(`https://wa.me/918630027341?text=${text}`, '_blank');
  };

  return (
    <div className="w-full min-h-screen bg-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[45vh] bg-black flex items-center justify-center text-center">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-65"
          style={{ backgroundImage: `url('/pickup-hero.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative z-10 space-y-3 px-6">
          <span className="text-xs font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mx-auto">
            <Sparkles size={12} fill="currentColor" /> Premium Local Transfers
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
            Pickup & Drop Service
          </h1>
          <p className="text-gray-300 max-w-lg mx-auto text-sm sm:text-base font-medium">
            Local Rishikesh transfers made easy. Mahindra & Vikram Autos available for hassle-free offline bookings.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        
        {/* Interactive Ride Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block: Selector Form */}
          <div className="lg:col-span-7 bg-white border border-black/10 p-6 sm:p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#FF5F00] uppercase tracking-wider">Book Offline</span>
              <h3 className="text-xl sm:text-2xl font-black text-black uppercase font-display">ROUTE ASSISTANT</h3>
              <p className="text-xs text-gray-500 font-medium">Configure your pickup, drop, and vehicle. Finalize details and price directly on WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                  <MapPin size={12} className="text-[#FF5F00]" /> Pickup Point
                </label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-gray-50 border border-black/10 rounded-xl p-3 text-xs font-bold text-black outline-none focus:border-[#FF5F00] transition-colors"
                >
                  <option value="">-- Choose Pickup --</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc} disabled={loc === drop}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Drop Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                  <MapPin size={12} className="text-[#FF5F00]" /> Drop-Off Point
                </label>
                <select
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="w-full bg-gray-50 border border-black/10 rounded-xl p-3 text-xs font-bold text-black outline-none focus:border-[#FF5F00] transition-colors"
                >
                  <option value="">-- Choose Drop --</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc} disabled={loc === pickup}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehicle Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                <Compass size={12} className="text-[#FF5F00]" /> Select Vehicle
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fleet.filter(f => f.status === 'Available Now').map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id)}
                    className={`border-2 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${selectedVehicle === v.id ? 'border-[#FF5F00] bg-[#FF5F00]/5' : 'border-black/5 hover:border-black/15 bg-white'}`}
                  >
                    <div>
                      <h4 className="text-sm font-black text-black">{v.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{v.type}</p>
                    </div>
                    <div className="flex gap-2 mt-3 text-[9px] font-black uppercase text-[#FF5F00]">
                      <span>👥 {v.capacity}</span>
                      <span>•</span>
                      <span>💼 {v.luggage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Information Disclaimer */}
            <div className="p-4 bg-gray-50 rounded-xl border border-black/5 flex gap-3">
              <AlertCircle className="text-[#FF5F00] flex-shrink-0" size={20} />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-black uppercase">Offline Negotiation & Pricing</h4>
                <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                  Prices are finalized on call depending on season, timing, and exact coordinates. <strong>No online payments or advances are accepted.</strong> Speak with us first and pay the driver directly!
                </p>
              </div>
            </div>

            {/* Send Enquiry Button */}
            <button
              onClick={handleWhatsAppEnquiry}
              className="w-full py-4 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_25px_rgba(255,95,0,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer font-display flex items-center justify-center gap-2"
            >
              <MessageSquare size={16} /> Enquire Price on WhatsApp
            </button>
          </div>

          {/* Right Block: Explanatory Card / Features */}
          <div className="lg:col-span-5 space-y-6 lg:pl-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-gray-400 tracking-widest">Local Fleet</span>
              <h2 className="text-2xl font-black font-display text-black uppercase">Local Transport Special</h2>
              <div className="w-12 h-1 bg-[#FF5F00]" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              We specialize in local Rishikesh pickups and drops. Whether you need an auto from the railway stations, a quick transfer to Janki Jhula, Ram Jhula, or Laxman Jhula, or transit to Dehradun Airport or Haridwar, we have you covered.
            </p>
            <div className="p-6 border border-[#FF5F00]/10 bg-[#FF5F00]/5 rounded-3xl space-y-4">
              <h4 className="text-xs font-black uppercase text-black tracking-wider flex items-center gap-1.5">
                <Info size={14} className="text-[#FF5F00]" /> Direct Contact Booking
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                Want to book directly over a phone call? Skip the selector tool and talk directly to our booking manager to discuss pricing and schedule.
              </p>
              <a
                href="tel:+918630027341"
                className="inline-flex items-center gap-2 py-3 px-6 bg-black text-white text-xs font-black uppercase rounded-xl hover:scale-102 transition-transform"
              >
                <Phone size={14} /> Call Manager Now
              </a>
            </div>
          </div>
        </div>

        {/* Our Fleet Presentation */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500 tracking-widest font-sans">Our Fleet</span>
            <h2 className="text-xl md:text-3xl font-bold font-display text-black uppercase">AVAILABLE VEHICLES</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {fleet.map((vehicle) => (
              <motion.div 
                key={vehicle.id}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className={`border rounded-2xl overflow-hidden hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all flex flex-col justify-between h-full group shadow-[0_8px_32px_rgba(0,0,0,0.04)] ${vehicle.status === 'Coming Soon' ? 'border-dashed border-black/15 opacity-80' : 'border-white/60 bg-white/60 backdrop-blur-md'}`}
              >
                {/* Image */}
                <div className="h-36 sm:h-40 bg-gray-100 overflow-hidden relative border-b border-black/5">
                  <img src={vehicle.img} alt={vehicle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {vehicle.status === 'Coming Soon' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-black text-[#FF6B00] border border-[#FF5F00] text-[10px] font-black uppercase py-1.5 px-4 rounded-full tracking-widest">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base font-display text-black leading-tight">{vehicle.name}</h3>
                      {vehicle.status === 'Available Now' && (
                        <span className="text-[9px] bg-green-100 text-green-800 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wide">{vehicle.type}</p>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                      {vehicle.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div>
                        <span className="block text-gray-400 text-[9px] uppercase font-bold">Capacity</span>
                        <span className="text-xs font-bold text-black">{vehicle.capacity}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 text-[9px] uppercase font-bold">Luggage</span>
                        <span className="text-xs font-bold text-black">{vehicle.luggage}</span>
                      </div>
                    </div>
                    {vehicle.status === 'Available Now' && (
                      <span className="text-xs font-black uppercase text-black flex items-center gap-1 group-hover:underline decoration-accent decoration-2">
                        Offline Booking Only
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Why Choose Us */}
        <div className="space-y-8 pt-8 border-t border-black/5">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500 tracking-widest font-sans">Safe & Trustworthy</span>
            <h2 className="text-lg md:text-2xl font-bold font-display text-black uppercase">SAFETY & BOOKING ASSURANCE</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="flex overflow-x-auto pb-4 gap-6 -mx-6 px-6 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible sm:pb-0 sm:mx-0 sm:px-0 scrollbar-none"
          >
            {highlights.map((hl, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeInUp}
                className="snap-center flex-shrink-0 w-[240px] sm:w-auto p-5 border border-black/10 rounded-2xl bg-white text-center space-y-2 hover:border-[#FF5F00]/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.01)] duration-300"
              >
                <div className="w-9 h-9 rounded-full bg-[#FF5F00]/10 border border-[#FF5F00]/20 flex items-center justify-center text-[#FF5F00] mx-auto">
                  <ShieldCheck size={16} className="stroke-[2.5]" />
                </div>
                <h4 className="font-bold text-xs font-display text-black uppercase tracking-tight">{hl.title}</h4>
                <p className="text-[10px] text-gray-500 font-medium leading-normal">{hl.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* How It Works */}
        <div className="space-y-8 pt-8 border-t border-black/5">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500 tracking-widest font-sans">No Online Payments</span>
            <h2 className="text-lg md:text-2xl font-bold font-display text-black uppercase">HOW OFFLINE BOOKING WORKS</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="flex overflow-x-auto pb-4 gap-6 -mx-6 px-6 snap-x snap-mandatory sm:grid sm:grid-cols-3 gap-8 text-center font-sans sm:overflow-x-visible sm:pb-0 sm:mx-0 sm:px-0 scrollbar-none"
          >
            <motion.div variants={fadeInUp} className="snap-center flex-shrink-0 w-[240px] sm:w-auto space-y-3 p-5 border border-black/10 rounded-2xl sm:border-none bg-white sm:bg-transparent shadow-[0_4px_20px_rgba(0,0,0,0.01)] sm:shadow-none">
              <span className="w-12 h-12 bg-black text-[#FF5F00] text-xl font-black rounded-full flex items-center justify-center mx-auto border-2 border-[#FF5F00]/30">
                1
              </span>
              <h4 className="font-bold text-base text-black">Select & Enquire</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Select your pickup, drop points, and vehicle. Click to send an enquiry straight to WhatsApp.</p>
            </motion.div>
 
            <motion.div variants={fadeInUp} className="snap-center flex-shrink-0 w-[240px] sm:w-auto space-y-3 p-5 border border-black/10 rounded-2xl sm:border-none bg-white sm:bg-transparent shadow-[0_4px_20px_rgba(0,0,0,0.01)] sm:shadow-none">
              <span className="w-12 h-12 bg-black text-[#FF5F00] text-xl font-black rounded-full flex items-center justify-center mx-auto border-2 border-[#FF5F00]/30">
                2
              </span>
              <h4 className="font-bold text-base text-black">Finalize Price Offline</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Talk directly to our manager. Align on dates, timings, and finalize the price with zero booking fees.</p>
            </motion.div>
 
            <motion.div variants={fadeInUp} className="snap-center flex-shrink-0 w-[240px] sm:w-auto space-y-3 p-5 border border-black/10 rounded-2xl sm:border-none bg-white sm:bg-transparent shadow-[0_4px_20px_rgba(0,0,0,0.01)] sm:shadow-none">
              <span className="w-12 h-12 bg-black text-[#FF5F00] text-xl font-black rounded-full flex items-center justify-center mx-auto border-2 border-[#FF5F00]/30">
                3
              </span>
              <h4 className="font-bold text-base text-black">Pay Cash to Driver</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Your auto driver arrives at the pickup point on time. Pay the full finalized amount to the driver after drop.</p>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
