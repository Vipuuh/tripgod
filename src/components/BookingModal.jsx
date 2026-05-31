import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Clock, ShieldCheck, CreditCard, MessageSquare } from 'lucide-react';

export default function BookingModal({ isOpen, onClose, activity, onAddToCart }) {
  if (!activity) return null;

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [guests, setGuests] = useState(1);
  const [hasVideoOption, setHasVideoOption] = useState(false);
  const [error, setError] = useState('');

  // Default slots based on activity
  const slots = activity.slots || ['08:00 AM', '10:30 AM', '01:30 PM', '04:00 PM'];
  
  // Set default values when active changes
  useEffect(() => {
    if (activity) {
      const today = new Date();
      today.setDate(today.getDate() + 1); // default to tomorrow
      setDate(today.toISOString().split('T')[0]);
      setSlot(slots[0]);
      setGuests(1);
      setHasVideoOption(activity.category === 'rafting' || (activity.category === 'bungee' && activity.videoIncluded));
      setError('');
    }
  }, [activity]);

  // Calculate pricing
  const basePrice = activity.price || 0;
  const hasPaidVideoOption = activity.category === 'bungee' && !activity.videoIncluded;
  const videoPrice = hasPaidVideoOption ? 400 : 0;
  const pricePerPerson = basePrice + (hasPaidVideoOption && hasVideoOption ? videoPrice : 0);
  const totalPrice = pricePerPerson * guests;
  const advancePayment = Math.round(totalPrice * 0.1);
  const remainingPayment = totalPrice - advancePayment;

  const minDate = new Date().toISOString().split('T')[0];
  const isBikeRent = activity.category === 'bikerent';
  const unitLabel = isBikeRent ? 'Vehicle(s)' : 'Person(s)';

  const handleWhatsAppDirectBook = () => {
    if (!date) {
      setError('Please select a date.');
      return;
    }
    
    const message = `*NEW BOOKING REQUEST - TRIPGOD*
----------------------------------
*Activity:* ${activity.name} ${activity.stretch ? `(${activity.stretch})` : ''}
*Date:* ${date}
*Slot:* ${slot}
*${isBikeRent ? 'No. of Vehicles' : 'Guests'}:* ${guests} ${unitLabel}
${hasVideoOption ? `*Add-ons:* DSLR Video Included\n` : ''}
*Price Breakdown:*
- Total Price: ₹${totalPrice.toLocaleString('en-IN')}
- *10% Advance Pay:* ₹${advancePayment.toLocaleString('en-IN')}
- Pay at Rishikesh (90%): ₹${remainingPayment.toLocaleString('en-IN')}
----------------------------------
Please confirm the booking slot and send payment link for the 10% advance.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919837371137?text=${encoded}`, '_blank');
    onClose();
  };

  const handleAddToCartClick = () => {
    if (!date) {
      setError('Please select a date.');
      return;
    }

    const item = {
      cartId: `${activity.id}-${Date.now()}`,
      id: activity.id,
      name: activity.name,
      stretch: activity.stretch,
      price: pricePerPerson,
      date,
      slot,
      guests,
      hasVideoOption,
      totalPrice,
      advancePayment,
      remainingPayment,
      category: activity.category
    };

    onAddToCart(item);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Backdrop click */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-pointer"
            onClick={onClose}
          />

          {/* Modal box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg overflow-hidden bg-white border border-black/10 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/5 bg-black text-white">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-[#FF5F00] font-bold px-2 py-0.5 bg-[#FF5F00]/10 border border-[#FF5F00]/20 rounded">
                  {activity.category.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold tracking-tight mt-1 font-display">Book {activity.name}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {activity.stretch && (
                <div className="p-3 text-xs bg-gray-50 border-l-4 border-black text-black font-medium">
                  Route: {activity.stretch}
                </div>
              )}

              {error && (
                <div className="p-3 text-sm bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                  {error}
                </div>
              )}

              {/* Date selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Calendar size={14} className="text-black" /> {isBikeRent ? 'Select Start Date' : 'Select Date'}
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm"
                />
              </div>

              {/* Time slot and Guests */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Clock size={14} className="text-black" /> {isBikeRent ? 'Rental Duration' : 'Select Slot'}
                  </label>
                  <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm"
                  >
                    {slots.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Users size={14} className="text-black" /> {isBikeRent ? 'No. of Vehicles' : 'Total Guests'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Optional extras depending on category */}
              {(activity.category === 'rafting' || (activity.category === 'bungee' && activity.videoIncluded)) && (
                <div className="flex items-start gap-3 p-3.5 border border-green-500/20 bg-green-50/50 rounded-xl">
                  <div className="mt-0.5 text-green-600 bg-green-100 p-1 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-green-900">Free DSLR Video & Photos Included</span>
                    <span className="block text-xs text-green-700/80">Get high-quality cinematic footage and photos of your experience delivered directly via WhatsApp.</span>
                  </div>
                </div>
              )}

              {activity.category === 'bungee' && !activity.videoIncluded && (
                <label className="flex items-start gap-3 p-3 border border-black/10 rounded-lg cursor-pointer hover:bg-accent/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={hasVideoOption}
                    onChange={(e) => setHasVideoOption(e.target.checked)}
                    className="mt-1 accent-black w-4 h-4"
                  />
                  <div>
                    <span className="block text-sm font-bold">Add DSLR Video & Photos (+₹400/person)</span>
                    <span className="block text-xs text-gray-500">Get cinematic footage of your bungee jump delivered directly via WhatsApp link.</span>
                  </div>
                </label>
              )}

              <div className="grid grid-cols-2 gap-2 py-1">
                <div className="flex items-center gap-2 p-2.5 bg-[#FFF0E5] text-black rounded-lg text-[11px] font-semibold border border-[#FF6B00]">
                  <ShieldCheck size={14} className="flex-shrink-0" />
                  <span>FREE CANCELLATION UP TO 24H</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 text-black rounded-lg text-[11px] font-semibold border border-gray-200">
                  <CreditCard size={14} className="flex-shrink-0" />
                  <span>PAY ONLY 10% ADVANCE</span>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-4 bg-black text-white rounded-xl space-y-2.5 font-sans">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{isBikeRent ? 'Price per day' : 'Price per person'}</span>
                  <span>₹{pricePerPerson.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Total price ({guests} {isBikeRent ? `vehicle${guests > 1 ? 's' : ''}` : `guest${guests > 1 ? 's' : ''}`})</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                
                <div className="flex justify-between items-center text-sm font-bold text-accent">
                  <span className="flex items-center gap-1.5">
                    Pay 10% Advance Now
                  </span>
                  <span>₹{advancePayment.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Remaining Payment (Pay at Rishikesh)</span>
                  <span>₹{remainingPayment.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-5 bg-gray-50 border-t border-black/5 flex gap-3">
              <button
                onClick={handleAddToCartClick}
                className="flex-1 py-3 px-4 rounded-xl border border-black/20 font-bold text-sm bg-white hover:bg-black hover:text-[#FF5F00] hover:border-black transition-all duration-300 hover:scale-[1.02]"
              >
                Add to Cart
              </button>
              <button
                onClick={handleWhatsAppDirectBook}
                className="flex-1 py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] border-none cursor-pointer font-display"
              >
                <MessageSquare size={16} />
                <span>Book via WhatsApp</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
