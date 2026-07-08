import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Clock, Users, ShieldAlert, CheckCircle, CreditCard } from 'lucide-react';
import { supabase } from '../supabase';

export default function CartModal({ isOpen, onClose, cart, onRemoveItem, onClearCart }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [paymentOption, setPaymentOption] = useState('advance');
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  const getSimpleBookingId = (id) => {
    if (!id) return 'TG-000000';
    if (id.includes('-') || id.length >= 32) {
      const cleanHex = id.replace(/-/g, '').substring(0, 8);
      const num = parseInt(cleanHex, 16);
      if (!isNaN(num)) {
        return `TG-${String(num).slice(-6)}`;
      }
    }
    const cleanStr = id.replace(/[^a-zA-Z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < cleanStr.length; i++) {
      hash = (hash << 5) - hash + cleanStr.charCodeAt(i);
      hash = hash & hash;
    }
    return `TG-${String(Math.abs(hash)).slice(-6)}`;
  };

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

  const amountToPayNow = paymentOption === 'full' ? totalCost : totalAdvance;
  const remainingPayment = totalCost - amountToPayNow;

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
      key: "rzp_live_TAd3hYpU1J84mE",
      amount: amountToPayNow * 100, // paise
      currency: "INR",
      name: "TripGod Rishikesh",
      description: `Cart Checkout (${cart.length} Activities) - ${paymentOption === 'full' ? '100% Full Payment' : 'Advances'}`,
      image: "/tripgod-logo.png",
      handler: function (response) {
        const paymentId = response.razorpay_payment_id;

        let message = `*BOOKING CART SUCCESSFUL & PAID - TRIPGOD*\n`;
        message += `*Payment Confirmation ID:* ${paymentId}\n`;
        message += `*Status:* ${paymentOption === 'full' ? 'Paid 100% Full Payment Online' : 'Paid Advance Booking'}\n`;
        message += `----------------------------------\n`;
        message += `*Customer Name:* ${name}\n`;
        message += `*Customer Email:* ${email}\n`;
        message += `*Customer Phone:* ${phone}\n`;
        message += `----------------------------------\n`;
        
        cart.forEach((item, index) => {
          const itemPct = item.commission_percentage || 10.0;
          message += `*${index + 1}. ${item.name}*\n`;
          if (item.stretch) message += `   Route: ${item.stretch}\n`;
          message += `   Date: ${item.date.split('-').reverse().join('/')}\n`;
          message += `   Slot: ${item.slot}\n`;
          message += `   Guests: ${item.guests} Person(s)\n`;
          if (item.hasVideoOption) message += `   Add-ons: DSLR Video Included\n`;
          message += `   Subtotal: ₹${item.totalPrice.toLocaleString('en-IN')}\n`;
          if (paymentOption === 'advance') {
            if (item.payment_mode === 'fixed_advance') {
              message += `   Advance Paid (Fixed): ₹${item.advancePayment.toLocaleString('en-IN')}\n`;
              message += `   Remaining Balance (At Venue): ₹${item.remainingPayment.toLocaleString('en-IN')}\n`;
            } else if (item.payment_mode === 'full_payment') {
              message += `   Paid Online (100%): ₹${item.totalPrice.toLocaleString('en-IN')}\n`;
              message += `   Remaining Balance: ₹0 (Paid in Full)\n`;
            } else {
              message += `   Advance Paid (${itemPct}%): ₹${item.advancePayment.toLocaleString('en-IN')}\n`;
              message += `   Remaining Balance (${100 - itemPct}%): ₹${item.remainingPayment.toLocaleString('en-IN')}\n`;
            }
          } else {
            message += `   Paid Online (100%): ₹${item.totalPrice.toLocaleString('en-IN')}\n`;
          }
          message += `----------------------------------\n`;
        });

        message += `*CART TOTALS:*\n`;
        message += `- Grand Total Price: ₹${totalCost.toLocaleString('en-IN')}\n`;
        if (paymentOption === 'full') {
          message += `- *Paid Online (100%):* ₹${totalCost.toLocaleString('en-IN')}\n`;
          message += `- Remaining Balance: ₹0 (Paid in Full)\n`;
        } else {
          message += `- *Total Paid Advance:* ₹${totalAdvance.toLocaleString('en-IN')}\n`;
          message += `- Pay at Rishikesh: ₹${totalRemaining.toLocaleString('en-IN')}\n`;
        }
        message += `----------------------------------\n`;
        message += `My payment ID is verified. Please confirm my slots.`;

        // Save booking locally
        try {
          const storedBookings = localStorage.getItem(`tripgod_bookings_${email}`) 
            ? JSON.parse(localStorage.getItem(`tripgod_bookings_${email}`)) 
            : [];
          const newBooking = {
            id: paymentId,
            date: new Date().toLocaleDateString('en-IN'),
            activities: cart.map(item => ({
              name: item.name,
              stretch: item.stretch || '',
              date: item.date.split('-').reverse().join('/'),
              slot: item.slot,
              guests: item.guests,
              subtotal: item.totalPrice
            })),
            totalPrice: totalCost,
            advancePaid: amountToPayNow,
            remainingPaid: remainingPayment
          };
          storedBookings.push(newBooking);
          localStorage.setItem(`tripgod_bookings_${email}`, JSON.stringify(storedBookings));
        } catch (err) {
          console.error('Failed to save booking locally:', err);
        }

        // Save bookings to Supabase SQL Database
        try {
          const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
          const generateUUID = () => {
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
              return crypto.randomUUID();
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          };

          const insertedBookingIds = [];
          const bookingPromises = cart.map(async (item) => {
            const itemPct = item.commission_percentage || 10.0;
            const commissionEarned = item.payment_mode === 'fixed_advance'
              ? Math.min(item.fixed_advance_amount || 0, item.totalPrice)
              : Math.round(item.totalPrice * (itemPct / 100));

            const dbBookingId = generateUUID();
            insertedBookingIds.push(dbBookingId);

            const bookingInsertData = {
              id: dbBookingId,
              city_id: item.city_id && isValidUUID(item.city_id) ? item.city_id : null,
              vendor_id: item.vendor_id && isValidUUID(item.vendor_id) ? item.vendor_id : null,
              customer_name: name,
              customer_phone: phone,
              customer_email: email,
              service_type: item.category === 'hotels' ? 'Hotel' : item.category === 'rafting' ? 'Rafting' : item.category === 'bikerent' ? 'Bike Rental' : item.category === 'tour' ? 'Tour' : item.category === 'camping' ? 'Camping' : 'Rafting',
              service_id: item.id && isValidUUID(item.id) ? item.id : '00000000-0000-0000-0000-000000000000',
              travel_date: item.date,
              status: 'pending',
              payment_type: paymentOption === 'full' ? 'full_online' : 'advance_custom',
              amount_paid: paymentOption === 'full' ? item.totalPrice : item.advancePayment,
              remaining_amount: paymentOption === 'full' ? 0 : item.remainingPayment,
              commission_earned: commissionEarned
            };
            const { error } = await supabase.from('bookings').insert([bookingInsertData]);
            if (error) {
              console.error('Error inserting booking to Supabase from cart:', error);
            }
          });

          Promise.all(bookingPromises).then(() => {
            const dbBookingId = insertedBookingIds[0] || paymentId;

            // Trigger background automated WhatsApp notifications for each cart item
            cart.forEach((item) => {
              const opPhone = item.category === 'hotels'
                ? (item.whatsapp_number || item.vendors?.whatsapp || item.vendors?.phone || '8630027341')
                : (item.vendors?.whatsapp || item.vendors?.phone || '8630027341');

              fetch('/api/send-booking-whatsapp', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  name: name,
                  email: email,
                  phone: phone,
                  activityName: item.name,
                  stretch: item.stretch || '',
                  date: item.category === 'hotels' && item.checkInDate && item.checkOutDate
                    ? `${item.checkInDate.split('-').reverse().join('/')} to ${item.checkOutDate.split('-').reverse().join('/')} (${item.nights} Night${item.nights > 1 ? 's' : ''})`
                    : item.date.split('-').reverse().join('/'),
                  checkInDate: item.checkInDate || null,
                  checkOutDate: item.checkOutDate || null,
                  nights: item.nights || null,
                  slot: item.slot,
                  guests: item.guests,
                  totalPrice: item.totalPrice,
                  advancePaid: paymentOption === 'full' ? item.totalPrice : item.advancePayment,
                  remainingPaid: paymentOption === 'full' ? 0 : item.remainingPayment,
                  paymentId: dbBookingId,
                  category: item.category || 'rafting',
                  paymentOption: paymentOption,
                  upiDiscount: 0,
                  commissionPercentage: item.commission_percentage || 10,
                  operatorPhone: opPhone
                })
              }).catch(err => console.error('Error triggering WhatsApp notification for cart item:', err));
            });

            // Set booking success state
            setBookingSuccessData({
              bookingId: dbBookingId,
              totalPrice: totalCost,
              advancePaid: amountToPayNow,
              remainingPaid: remainingPayment
            });

            // Clear cart
            if (onClearCart) {
              onClearCart();
            }
          });
        } catch (err) {
          console.error('Supabase cart bookings insertion failed:', err);
        }
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm overflow-hidden">
          {/* Glowing refractive backdrop blobs for the cart */}
          <div className="absolute top-1/3 right-80 w-72 h-72 rounded-full bg-[#FF5F00]/10 blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/3 right-96 w-80 h-80 rounded-full bg-[#8000FF]/10 blur-[130px] pointer-events-none" />

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
            className="relative w-full max-w-md h-full bg-white/80 border-l border-white/40 shadow-2xl z-10 flex flex-col backdrop-blur-2xl text-black"
          >
             {bookingSuccessData ? (
               <div className="p-8 text-center flex flex-col items-center justify-center h-full space-y-6">
                 {/* Success Animation Checkmark */}
                 <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-3xs animate-bounce">
                   <svg className="w-8 h-8 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                   </svg>
                 </div>

                 <div className="space-y-1">
                   <h3 className="text-2xl font-black font-display tracking-tight text-neutral-900">
                     Booking Confirmed! 🎉
                   </h3>
                   <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                     All items in your cart are reserved
                   </p>
                 </div>

                 {/* Booking Details Card */}
                 <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-left space-y-3">
                   <div className="flex justify-between items-center text-[10px] border-b border-slate-200/60 pb-2">
                     <span className="text-gray-400 font-bold uppercase tracking-widest">Main Booking ID</span>
                     <span className="font-black text-black text-xs">{getSimpleBookingId(bookingSuccessData.bookingId)}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-gray-500 font-bold">Total Price</span>
                     <span className="font-extrabold text-neutral-800 font-sans text-sm">₹{bookingSuccessData.totalPrice.toLocaleString('en-IN')}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-[#10B981] font-black">Paid Online</span>
                     <span className="font-black text-[#10B981] font-sans text-sm">₹{bookingSuccessData.advancePaid.toLocaleString('en-IN')}</span>
                   </div>
                   {bookingSuccessData.remainingPaid > 0 && (
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-[#FF5F00] font-black">Pay at Venue</span>
                       <span className="font-black text-[#FF5F00] font-sans text-sm">₹{bookingSuccessData.remainingPaid.toLocaleString('en-IN')}</span>
                     </div>
                   )}
                 </div>

                 {/* Next Steps Container */}
                 <div className="w-full p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-left space-y-2">
                   <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">✨ What happens next?</h4>
                   <ul className="text-[10px] text-emerald-850 font-semibold space-y-1.5 list-none pl-0">
                     <li className="flex items-start gap-1.5"><span>📩</span> <span>Booking tickets have been sent to your email and WhatsApp number.</span></li>
                     <li className="flex items-start gap-1.5"><span>📞</span> <span>The local guides/hotels will contact you shortly to coordinate slot details.</span></li>
                   </ul>
                 </div>

                 <button
                   onClick={() => {
                     setBookingSuccessData(null);
                     onClose();
                   }}
                   className="w-full py-4 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer font-display"
                 >
                   Close & Continue
                 </button>
               </div>
             ) : (
               <>
                 {/* Header */}
                 <div className="flex items-center justify-between p-6 bg-transparent border-b border-black/5 text-black">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight text-black">Your Booking Cart</span>
                <span className="bg-[#FF5F00] text-white font-black text-xs rounded-full px-2.5 py-0.5 min-w-[22px] text-center shadow-[0_0_10px_rgba(255,95,0,0.4)]">
                  {cart.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-black/50 hover:text-black hover:bg-black/5 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin text-black">
              {error && (
                <div className="p-3 text-sm bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg font-semibold">
                  {error}
                </div>
              )}
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center text-gray-400 border border-black/5">
                    <Trash2 size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-black">Your cart is empty</h3>
                    <p className="text-sm text-gray-500 max-w-[250px] mt-1 mx-auto">
                      Choose an adventure or rental vehicle and add it to your booking cart to proceed.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Contact Details Form (AT THE TOP) */}
                  <div className="p-4 border border-black/10 rounded-2xl space-y-3.5 bg-white/45 backdrop-blur-md">
                    <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5 font-display">
                      <Users size={14} className="text-[#FF5F00]" /> Contact Details (For Tickets)
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
                        className="w-full px-3.5 py-2.5 border border-black/10 rounded-xl text-black focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm bg-white/70 placeholder-black/30 transition-all duration-200"
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
                          className="w-full px-3.5 py-2.5 border border-black/10 rounded-xl text-black focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm bg-white/70 placeholder-black/30 transition-all duration-200"
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
                          className="w-full px-3.5 py-2.5 border border-black/10 rounded-xl text-black focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm bg-white/70 placeholder-black/30 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cart Items</span>
                    <span className="h-px bg-black/10 flex-1 ml-3" />
                  </div>

                  {cart.map((item) => (
                    <motion.div
                      key={item.cartId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 border border-black/10 bg-white/45 rounded-2xl space-y-3 relative group hover:border-[#FF5F00]/30 transition-all duration-200"
                    >
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-black/5 transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div>
                        <span className="text-[9px] bg-black text-[#FF5F00] font-black px-2 py-0.5 rounded tracking-wider uppercase border border-[#FF5F00]/20">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-base mt-1 text-black font-display pr-6">{item.name}</h4>
                        {item.stretch && (
                          <p className="text-xs text-gray-600 font-medium">{item.stretch}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-gray-600 bg-black/5 p-2 rounded-xl border border-black/5">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#FF5F00]" />
                          <span>
                            {item.category === 'hotels' && item.checkInDate && item.checkOutDate
                              ? `${item.checkInDate.split('-').reverse().join('/')} to ${item.checkOutDate.split('-').reverse().join('/')} (${item.nights} Night${item.nights > 1 ? 's' : ''})`
                              : item.date.split('-').reverse().join('/')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-[#FF5F00]" />
                          <span>{item.slot}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-[#FF5F00]" />
                          <span>{item.guests} Guest(s)</span>
                        </div>
                      </div>

                      {item.hasVideoOption && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">
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

                      <div className="flex justify-between items-center text-xs text-gray-700 bg-blue-600/10 p-2 rounded-lg border border-blue-500/20">
                        <span>
                          {item.payment_mode === 'fixed_advance'
                            ? `₹${item.fixed_advance_amount} flat advance`
                            : (item.payment_mode === 'full_payment'
                                ? '100% full payment'
                                : `${item.commission_percentage || 10}% booking advance`)}
                        </span>
                        <span className="font-bold text-black">
                          ₹{item.advancePayment.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Sticky summary & checkout */}
            {cart.length > 0 && (
              <div className="p-6 bg-transparent border-t border-black/5 space-y-4">
                {/* Payment Option Selector */}
                <div className="space-y-2 pb-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Choice</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('advance')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 relative cursor-pointer ${
                        paymentOption === 'advance'
                          ? 'border-[#FF5F00] bg-[#FF5F00]/5 text-black'
                          : 'border-black/10 bg-white/40 text-gray-700 hover:border-black/20'
                      }`}
                    >
                      <span className="block text-[10px] font-bold">Pay Advances</span>
                      <span className="block text-xs font-black text-[#FF5F00] mt-1.5">₹{totalAdvance.toLocaleString('en-IN')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('full')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 relative cursor-pointer ${
                        paymentOption === 'full'
                          ? 'border-[#FF5F00] bg-[#FF5F00]/5 text-black'
                          : 'border-black/10 bg-white/40 text-gray-700 hover:border-black/20'
                      }`}
                    >
                      <span className="block text-[10px] font-bold">Pay 100% Full</span>
                      <span className="block text-xs font-black text-[#FF5F00] mt-1.5">₹{totalCost.toLocaleString('en-IN')}</span>
                    </button>
                  </div>
                </div>

                {/* Pricing breakdown - Highlighted in Blue */}
                <div className="p-4 bg-blue-600/10 border border-blue-500/20 text-blue-900 rounded-2xl space-y-2.5 font-sans">
                  <div className="flex justify-between items-center text-xs text-blue-900/70 font-semibold">
                    <span>Total Cost ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                    <span>₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-px bg-blue-500/20 my-1" />
                  
                  <div className="flex justify-between items-center text-sm font-black text-blue-800">
                    <span className="flex items-center gap-1">
                      {paymentOption === 'full' ? 'Pay 100% Online Now' : 'Pay Total Advance Now'}
                    </span>
                    <span>₹{amountToPayNow.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-blue-900/80 font-bold">
                    <span>{paymentOption === 'full' ? 'Remaining Balance' : 'Pay at Venue (Remaining)'}</span>
                    <span>{paymentOption === 'full' ? '₹0 (Paid in Full)' : `₹${remainingPayment.toLocaleString('en-IN')}`}</span>
                  </div>
                </div>

                <div className="flex gap-2 p-3 bg-yellow-500/10 text-yellow-800 rounded-xl text-xs font-semibold leading-relaxed border border-yellow-500/20">
                  <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    {paymentOption === 'full' 
                      ? 'Secure full checkout online. Free cancellation up to 24h prior to slot.' 
                      : 'Pay only advances online. Remaining balance is payable at respective venues.'}
                  </span>
                </div>

                <button
                  onClick={handleRazorpayCheckout}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_20px_rgba(255,95,0,0.4)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
                >
                  <CreditCard size={18} />
                  <span>{paymentOption === 'full' ? 'Pay Full & Book All' : 'Pay Advances & Book All'}</span>
                </button>
              </div>
            )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
