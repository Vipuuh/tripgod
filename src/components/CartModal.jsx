import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Clock, Users, ShieldAlert, CheckCircle, CreditCard } from 'lucide-react';

export default function CartModal({ isOpen, onClose, cart, onRemoveItem }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const userEmail = localStorage.getItem('tripgod_user_email') || '';
      const userName = localStorage.getItem('tripgod_user_name') || '';
      const storedProfile = localStorage.getItem(`tripgod_profile_${userEmail}`);
      const userPhone = storedProfile ? JSON.parse(storedProfile).phone : '';
      
      setName(userName);
      setEmail(userEmail);
      setPhone(userPhone);
      setError('');
    }
  }, [isOpen]);

  const totalCost = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalAdvance = cart.reduce((acc, item) => acc + item.advancePayment, 0);
  const totalRemaining = totalCost - totalAdvance;

  const handleRazorpayCheckout = () => {
    if (cart.length === 0) return;

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!window.Razorpay) {
      setError('Razorpay SDK failed to load. Please check your internet connection or reload the page.');
      return;
    }

    const options = {
      key: "rzp_live_SwElxrZFXDUFIx",
      amount: totalAdvance * 100, // paise
      currency: "INR",
      name: "TripGod Rishikesh",
      description: `Cart Checkout (${cart.length} Activities) - 10% Advance`,
      image: "/tripgod-logo.png",
      handler: function (response) {
        const paymentId = response.razorpay_payment_id;

        let message = `*BOOKING CART SUCCESSFUL & PAID - TRIPGOD*\n`;
        message += `*Payment Confirmation ID:* ${paymentId}\n`;
        message += `*Status:* Paid 10% Advance Booking\n`;
        message += `----------------------------------\n`;
        message += `*Customer Name:* ${name}\n`;
        message += `*Customer Email:* ${email}\n`;
        message += `*Customer Phone:* ${phone}\n`;
        message += `----------------------------------\n`;
        
        cart.forEach((item, index) => {
          message += `*${index + 1}. ${item.name}*\n`;
          if (item.stretch) message += `   Route: ${item.stretch}\n`;
          message += `   Date: ${item.date.split('-').reverse().join('/')}\n`;
          message += `   Slot: ${item.slot}\n`;
          message += `   Guests: ${item.guests} Person(s)\n`;
          if (item.hasVideoOption) message += `   Add-ons: DSLR Video Included\n`;
          message += `   Subtotal: ₹${item.totalPrice.toLocaleString('en-IN')}\n`;
          message += `----------------------------------\n`;
        });

        message += `*CART TOTALS:*\n`;
        message += `- Grand Total Price: ₹${totalCost.toLocaleString('en-IN')}\n`;
        message += `- *Total 10% Paid Advance:* ₹${totalAdvance.toLocaleString('en-IN')}\n`;
        message += `- Pay at Rishikesh (90%): ₹${totalRemaining.toLocaleString('en-IN')}\n`;
        message += `----------------------------------\n`;
        message += `My payment ID is verified. Please confirm my slots.`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/919837371137?text=${encoded}`, '_blank');
        onClose();
      },
      prefill: {
        name: name,
        email: email,
        contact: phone
      },
      theme: {
        color: "#FF5F00"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-pointer"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md h-full bg-white shadow-2xl z-10 flex flex-col border-l border-black/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-black text-white">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight">Your Booking Cart</span>
                <span className="bg-[#FF5F00] text-white font-bold text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {cart.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 text-sm bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r font-semibold">
                  {error}
                </div>
              )}
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <Trash2 size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Your cart is empty</h3>
                    <p className="text-sm text-gray-500 max-w-[250px] mt-1 mx-auto">
                      Choose an adventure or rental vehicle and add it to your booking cart to proceed.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <motion.div
                      key={item.cartId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 border-2 border-black rounded-xl space-y-3 relative group"
                    >
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div>
                        <span className="text-[10px] bg-black text-accent font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-base mt-1 text-black font-display pr-6">{item.name}</h4>
                        {item.stretch && (
                          <p className="text-xs text-gray-500 font-medium">{item.stretch}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-black" />
                          <span>{item.date.split('-').reverse().join('/')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-black" />
                          <span>{item.slot}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-black" />
                          <span>{item.guests} Guest(s)</span>
                        </div>
                      </div>

                      {item.hasVideoOption && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle size={12} />
                          <span>DSLR Video & Photos Included</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-black/10">
                        <span className="text-xs text-gray-500">Price breakdown</span>
                        <span className="font-bold text-sm text-black">
                          ₹{item.totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-700 bg-[#FFF0E5] p-1.5 rounded border border-[#FF6B00]/50">
                        <span>10% booking advance</span>
                        <span className="font-bold text-black">
                          ₹{item.advancePayment.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Contact Details Form */}
                  <div className="p-4 border-2 border-black rounded-xl space-y-3.5 bg-gray-50/50 mt-6">
                    <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5 font-display">
                      <Users size={14} /> Contact Details (For Tickets)
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          localStorage.setItem('tripgod_user_name', e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mobile Number</label>
                        <input
                          type="tel"
                          placeholder="10-digit number"
                          value={phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhone(val);
                            const emailKey = email || 'guest';
                            const existing = localStorage.getItem(`tripgod_profile_${emailKey}`);
                            const parsed = existing ? JSON.parse(existing) : {};
                            parsed.phone = val;
                            localStorage.setItem(`tripgod_profile_${emailKey}`, JSON.stringify(parsed));
                          }}
                          className="w-full px-3.5 py-2.5 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                        <input
                          type="email"
                          placeholder="name@email.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            localStorage.setItem('tripgod_user_email', e.target.value);
                            const existing = localStorage.getItem(`tripgod_profile_${e.target.value}`);
                            const parsed = existing ? JSON.parse(existing) : {};
                            parsed.phone = phone;
                            localStorage.setItem(`tripgod_profile_${e.target.value}`, JSON.stringify(parsed));
                          }}
                          className="w-full px-3.5 py-2.5 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-medium text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sticky summary & checkout */}
            {cart.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-black/10 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-base text-black">
                    <span className="flex items-center gap-1">
                      Pay 10% Advance Now
                    </span>
                    <span className="text-lg">₹{totalAdvance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Pay at Rishikesh (90%)</span>
                    <span>₹{totalRemaining.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs font-semibold leading-relaxed border border-yellow-200">
                  <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Pay 10% advance via UPI to verify slot. Balance at activity point. Full refund if canceled 24h prior.
                  </span>
                </div>

                <button
                  onClick={handleRazorpayCheckout}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
                >
                  <CreditCard size={18} />
                  <span>Pay 10% & Book All</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
