import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Clock, ShieldCheck, CreditCard, MessageSquare } from 'lucide-react';
import { supabase } from '../supabase';

export default function BookingModal({ isOpen, onClose, activity, onAddToCart, initialDate, initialGuests }) {
  if (!activity) return null;

  const [date, setDate] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [slot, setSlot] = useState('');
  const [guests, setGuests] = useState(1);
  const [hasVideoOption, setHasVideoOption] = useState(false);
  const [error, setError] = useState('');
  const [paymentOption, setPaymentOption] = useState('advance');

  // Contact States for direct Razorpay prefilling
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Default slots based on activity category
  let defaultSlots = ['08:00 AM', '10:30 AM', '01:30 PM', '04:00 PM'];
  if (activity) {
    const cat = (activity.category || '').toLowerCase();
    if (cat === 'rafting') {
      defaultSlots = ['06:00 AM', '07:00 AM', '08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'];
    } else if (cat === 'swing') {
      defaultSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];
    } else if (cat === 'paragliding') {
      defaultSlots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '03:00 PM', '04:00 PM', '05:00 PM'];
    } else if (cat === 'zipline') {
      defaultSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
    } else if (cat === 'camping') {
      defaultSlots = ['12:00 PM (Check-in)'];
    }
  }
  const slots = activity.slots || defaultSlots;
  
  const checkIfDateClosed = (targetDateStr) => {
    if (!activity) return { closed: false };
    
    // Explicit toggle
    if (activity.is_closed) {
      return { 
        closed: true, 
        reason: activity.closed_reason || 'Monsoon season / government safety advisory',
        reopenDate: activity.closed_until 
      };
    }

    // Date range check
    if (activity.closed_from && activity.closed_until && targetDateStr) {
      try {
        const checkDate = new Date(targetDateStr);
        const fromDate = new Date(activity.closed_from);
        const untilDate = new Date(activity.closed_until);
        
        checkDate.setHours(0, 0, 0, 0);
        fromDate.setHours(0, 0, 0, 0);
        untilDate.setHours(0, 0, 0, 0);

        if (checkDate >= fromDate && checkDate <= untilDate) {
          return { 
            closed: true, 
            reason: activity.closed_reason || 'Monsoon season / government safety advisory',
            reopenDate: activity.closed_until 
          };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return { closed: false };
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayClosure = checkIfDateClosed(todayStr);
  const selectedDateClosure = checkIfDateClosed(date || checkInDate);
  const isClosed = todayClosure.closed || selectedDateClosure.closed;
  const activeClosure = todayClosure.closed ? todayClosure : selectedDateClosure;

  // Set default values when active changes
  useEffect(() => {
    if (activity) {
      const today = new Date();
      today.setDate(today.getDate() + 1); // default to tomorrow
      setDate(initialDate || today.toISOString().split('T')[0]);
      setSlot(slots[0]);
      setGuests(initialGuests || 1);
      setHasVideoOption(activity.category === 'rafting');
      setError('');
      // Initialize payment option based on mode
      const mode = activity.payment_mode || 'commission_advance';
      setPaymentOption(mode === 'full_payment' ? 'full' : 'advance');

      // Initialize check-in and check-out dates for hotels
      if (activity.category === 'hotels') {
        const tomorrowStr = today.toISOString().split('T')[0];
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const dayAfterStr = dayAfter.toISOString().split('T')[0];
        setCheckInDate(tomorrowStr);
        setCheckOutDate(dayAfterStr);
      }

      // Prefill user details if logged in
      const userEmail = localStorage.getItem('tripgod_user_email') || '';
      const userName = localStorage.getItem('tripgod_user_name') || '';
      const storedProfile = localStorage.getItem(`tripgod_profile_${userEmail}`);
      const userPhone = storedProfile ? JSON.parse(storedProfile).phone : '';
      
      setName(userName);
      setEmail(userEmail);
      setPhone(userPhone);
    }
  }, [activity, initialDate, initialGuests]);

  const getSlotLabel = () => {
    const cat = (activity.category || '').toLowerCase();
    if (cat === 'hotels') return 'Room Type';
    if (cat === 'bikes' || cat === 'bikerent') return 'Select Vehicle';
    if (cat === 'tours') return 'Select Package';
    return 'Select Slot';
  };

  // Determine payment configuration
  const paymentMode = activity.payment_mode || 'commission_advance';
  const commissionPercentage = activity.commission_percentage !== undefined && activity.commission_percentage !== null
    ? Number(activity.commission_percentage)
    : (activity.vendors?.commission_percentage !== undefined && activity.vendors?.commission_percentage !== null
        ? Number(activity.vendors.commission_percentage)
        : 10.0);
  const fixedAdvanceAmount = activity.fixed_advance_amount !== undefined && activity.fixed_advance_amount !== null
    ? Number(activity.fixed_advance_amount)
    : 0;

  // Calculate nights for hotel bookings
  let nights = 1;
  if (activity.category === 'hotels' && checkInDate && checkOutDate) {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end - start);
    nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }

  // Calculate pricing
  const basePrice = activity.price || 0;
  const pricePerPerson = basePrice;
  const totalPrice = pricePerPerson * guests * (activity.category === 'hotels' ? nights : 1);
  
  // Calculate dynamic advance amount
  const calculatedAdvance = paymentMode === 'fixed_advance'
    ? Math.min(fixedAdvanceAmount, totalPrice)
    : (paymentMode === 'full_payment'
        ? totalPrice
        : Math.round(totalPrice * (commissionPercentage / 100)));

  // If payment mode is full_payment, force paymentOption to 'full'
  const effectivePaymentOption = paymentMode === 'full_payment' ? 'full' : paymentOption;

  const amountToPayNow = effectivePaymentOption === 'full' ? totalPrice : calculatedAdvance;
  const remainingPayment = totalPrice - amountToPayNow;

  // Calculate dynamic UPI Discount
  const customUpiDiscount = activity.upi_discount !== undefined && activity.upi_discount !== null
    ? Number(activity.upi_discount)
    : null;

  const getUPIDiscount = (price) => {
    if (customUpiDiscount !== null && customUpiDiscount > 0) return customUpiDiscount;
    const p = Number(price);
    if (p <= 1000) return 50;
    if (p <= 2000) return 120;
    if (p <= 4000) return 150;
    if (p <= 6000) return 210;
    return 250;
  };

  // UPI Discount is ONLY applicable on 100% Full Payment
  const applyUpiDiscount = effectivePaymentOption === 'full';
  const upiDiscountVal = applyUpiDiscount ? getUPIDiscount(totalPrice) : 0;
  const finalAmountToPay = Math.max(0, amountToPayNow - upiDiscountVal);

  const minDate = new Date().toISOString().split('T')[0];
  const isBikeRent = activity.category === 'bikerent';
  const unitLabel = isBikeRent ? 'Vehicle(s)' : 'Person(s)';

  const handleRazorpayPayment = () => {
    if (!date) {
      setError('Please select a date.');
      return;
    }
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
      amount: finalAmountToPay * 100, // paise
      currency: "INR",
      name: "TripGod Rishikesh",
      description: effectivePaymentOption === 'full' 
        ? `${activity.name} - 100% Full Payment` 
        : (paymentMode === 'fixed_advance'
            ? `${activity.name} - ₹${fixedAdvanceAmount} Advance`
            : `${activity.name} - ${commissionPercentage}% Advance`),
      image: "/tripgod-logo.png",
      handler: function (response) {
        const paymentId = response.razorpay_payment_id;

        const advanceLabel = paymentMode === 'fixed_advance'
          ? 'Fixed Advance Booking'
          : `${commissionPercentage}% Advance Booking`;

        const dateRangeStr = activity.category === 'hotels'
          ? `${checkInDate.split('-').reverse().join('/')} to ${checkOutDate.split('-').reverse().join('/')} (${nights} Night${nights > 1 ? 's' : ''})`
          : date.split('-').reverse().join('/');

        const message = `*BOOKING SUCCESSFUL & PAID - TRIPGOD*
----------------------------------
*Payment Confirmation ID:* ${paymentId}
*Status:* ${effectivePaymentOption === 'full' ? 'Paid 100% Full Payment Online' : `Paid ${advanceLabel}`}
----------------------------------
*Customer Name:* ${name}
*Customer Email:* ${email}
*Customer Phone:* ${phone}
----------------------------------
*Activity:* ${activity.name} ${activity.stretch ? `(${activity.stretch})` : ''}
*Date:* ${dateRangeStr}
*${activity.category === 'hotels' ? 'Room Type' : (isBikeRent ? 'Select Vehicle' : 'Slot')}:* ${slot}
*${isBikeRent ? 'No. of Vehicles' : 'Guests'}:* ${guests} ${unitLabel}
${hasVideoOption ? `*Add-ons:* DSLR Video Included\n` : ''}
*Price Summary:*
- Total Price: ₹${totalPrice.toLocaleString('en-IN')}
- *${effectivePaymentOption === 'full' ? 'Paid 100% Online' : (paymentMode === 'fixed_advance' ? 'Paid Fixed Advance' : `Paid ${commissionPercentage}% Advance`)}:* ₹${finalAmountToPay.toLocaleString('en-IN')}${upiDiscountVal > 0 ? ` (UPI Discount of ₹${upiDiscountVal} applied)` : ''}
- ${effectivePaymentOption === 'full' ? 'Remaining Balance: ₹0 (Paid in Full)' : `Pay at Venue: ₹${remainingPayment.toLocaleString('en-IN')}`}
----------------------------------
My payment ID is verified. Please confirm my slots.`;

        // Save booking locally
        try {
          const storedBookings = localStorage.getItem(`tripgod_bookings_${email}`) 
            ? JSON.parse(localStorage.getItem(`tripgod_bookings_${email}`)) 
            : [];
          const newBooking = {
            id: paymentId,
            date: new Date().toLocaleDateString('en-IN'),
            activities: [{
              name: activity.name,
              stretch: activity.stretch || '',
              date: dateRangeStr,
              slot: slot,
              guests: guests,
              subtotal: totalPrice
            }],
            totalPrice: totalPrice,
            advancePaid: finalAmountToPay,
            remainingPaid: remainingPayment
          };
          storedBookings.push(newBooking);
          localStorage.setItem(`tripgod_bookings_${email}`, JSON.stringify(storedBookings));
        } catch (err) {
          console.error('Failed to save booking locally:', err);
        }

        // Save booking to Supabase SQL Database
        try {
          const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
          const bookingInsertData = {
            city_id: activity.city_id && isValidUUID(activity.city_id) ? activity.city_id : null,
            vendor_id: activity.vendor_id && isValidUUID(activity.vendor_id) ? activity.vendor_id : null,
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            service_type: activity.category === 'hotels' ? 'Hotel' : activity.category === 'rafting' ? 'Rafting' : activity.category === 'bikerent' ? 'Bike Rental' : activity.category === 'tour' ? 'Tour' : activity.category === 'camping' ? 'Camping' : 'Rafting',
            service_id: activity.id && isValidUUID(activity.id) ? activity.id : '00000000-0000-0000-0000-000000000000',
            travel_date: activity.category === 'hotels' ? checkInDate : date,
            status: 'pending',
            payment_type: effectivePaymentOption === 'full' ? 'full_online' : 'advance_custom',
            amount_paid: finalAmountToPay,
            remaining_amount: remainingPayment,
            commission_earned: paymentMode === 'fixed_advance'
              ? Math.min(fixedAdvanceAmount, totalPrice)
              : Math.round(totalPrice * (commissionPercentage / 100))
          };
          supabase.from('bookings').insert([bookingInsertData]).then(({ error }) => {
            if (error) console.error('Error inserting booking to Supabase:', error);
          });
        } catch (err) {
          console.error('Supabase booking insertion failed:', err);
        }

        // Trigger background automated WhatsApp notifications
        fetch('/api/send-booking-whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            phone: phone,
            activityName: activity.name,
            stretch: activity.stretch || '',
            date: date.split('-').reverse().join('/'),
            slot: slot,
            guests: guests,
            totalPrice: totalPrice,
            advancePaid: finalAmountToPay,
            remainingPaid: remainingPayment,
            paymentId: paymentId,
            category: activity.category
          })
        }).catch(err => console.error('WhatsApp notification error:', err));

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/918630027341?text=${encoded}`, '_blank');
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

  const handleAddToCartClick = () => {
    if (!date) {
      setError('Please select a date.');
      return;
    }
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
      advancePayment: calculatedAdvance,
      remainingPayment: totalPrice - calculatedAdvance,
      commission_percentage: commissionPercentage,
      payment_mode: paymentMode,
      fixed_advance_amount: fixedAdvanceAmount,
      category: activity.category,
      city_id: activity.city_id,
      vendor_id: activity.vendor_id
    };

    onAddToCart(item);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
          {/* Glowing refractive backdrop blobs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#FF5F00]/10 blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#8000FF]/10 blur-[130px] pointer-events-none" />

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
            className="relative w-full max-w-lg overflow-hidden bg-white/80 border border-white/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-10 flex flex-col max-h-[90vh] backdrop-blur-2xl text-black"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/5 bg-transparent text-black">
              <div>
                <span className="text-[9px] tracking-wider uppercase text-[#FF5F00] font-black px-2 py-0.5 bg-[#FF5F00]/10 border border-[#FF5F00]/20 rounded">
                  {activity.category.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold tracking-tight mt-1 font-display">Book {activity.name}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full text-black/50 hover:text-black hover:bg-black/5 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-black scrollbar-thin">
              {isClosed && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex flex-col gap-1.5 text-left shadow-sm">
                  <span className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5 text-red-700">
                    ⚠️ TEMPORARILY CLOSED
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">
                    {activeClosure.reason}
                  </p>
                  {activeClosure.reopenDate && (
                    <span className="text-[10px] bg-red-100 text-red-700 font-black uppercase px-2.5 py-1 rounded-lg mt-1 w-max">
                      Expected Reopening: {new Date(activeClosure.reopenDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              )}

              {activity.stretch && (
                <div className="p-3 text-xs bg-black/5 border-l-4 border-[#FF5F00] text-gray-800 font-bold rounded-r-lg">
                  Route: {activity.stretch}
                </div>
              )}

              {error && (
                <div className="p-3 text-sm bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg font-semibold">
                  {error}
                </div>
              )}

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

                <div className="grid grid-cols-2 gap-3">
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

              {/* Date selection */}
              {activity.category === 'hotels' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#FF5F00]" /> Check-in Date
                    </label>
                    <input
                      type="date"
                      min={minDate}
                      value={checkInDate}
                      onChange={(e) => {
                        setCheckInDate(e.target.value);
                        setError('');
                        if (checkOutDate <= e.target.value) {
                          const nextDay = new Date(e.target.value);
                          nextDay.setDate(nextDay.getDate() + 1);
                          setCheckOutDate(nextDay.toISOString().split('T')[0]);
                        }
                      }}
                      className="w-full px-4 py-3 border border-black/10 rounded-xl text-black bg-white/70 focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#FF5F00]" /> Check-out Date
                    </label>
                    <input
                      type="date"
                      min={checkInDate ? (() => {
                        const next = new Date(checkInDate);
                        next.setDate(next.getDate() + 1);
                        return next.toISOString().split('T')[0];
                      })() : minDate}
                      value={checkOutDate}
                      onChange={(e) => {
                        setCheckOutDate(e.target.value);
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-black/10 rounded-xl text-black bg-white/70 focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm transition-all duration-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#FF5F00]" /> {isBikeRent ? 'Select Start Date' : 'Select Date'}
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl text-black bg-white/70 focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm transition-all duration-200"
                  />
                </div>
              )}

              {/* Time slot and Guests */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Clock size={14} className="text-[#FF5F00]" /> {getSlotLabel()}
                  </label>
                  <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl text-black bg-white/70 focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm transition-all duration-200"
                  >
                    {slots.map((s, idx) => (
                      <option key={idx} value={s} className="bg-white text-black">{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Users size={14} className="text-[#FF5F00]" /> {isBikeRent ? 'No. of Vehicles' : 'Total Guests'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={guests}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGuests(val === '' ? '' : Math.max(1, parseInt(val) || 1));
                    }}
                    onBlur={() => {
                      if (guests === '' || guests < 1) setGuests(1);
                    }}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl text-black bg-white/70 focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Optional extras depending on category */}
              {activity.category === 'rafting' && (
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

              <div className="grid grid-cols-2 gap-2 py-1">
                <div className="flex items-center gap-2 p-2.5 bg-[#FF5F00]/10 text-[#FF5F00] rounded-xl text-[10px] font-black border border-[#FF5F00]/20">
                  <ShieldCheck size={14} className="flex-shrink-0 text-[#FF5F00]" />
                  <span>FREE CANCELLATION UP TO 24H</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-black/5 text-black rounded-xl text-[10px] font-bold border border-black/10">
                  <CreditCard size={14} className="flex-shrink-0 text-gray-400" />
                  <span>
                    {paymentMode === 'fixed_advance'
                      ? `PAY ONLY ₹${fixedAdvanceAmount} ADVANCE`
                      : (paymentMode === 'full_payment'
                          ? '100% SECURE FULL PAYMENT'
                          : `PAY ONLY ${commissionPercentage}% ADVANCE`)}
                  </span>
                </div>
              </div>

              {/* Payment Option Choices */}
              {paymentMode !== 'full_payment' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-[#FF5F00]" /> Select Payment Option
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('advance')}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden cursor-pointer ${
                        effectivePaymentOption === 'advance'
                          ? 'border-[#FF5F00] bg-[#FF5F00]/5 text-black shadow-md shadow-[#FF5F00]/5'
                          : 'border-black/10 bg-white/40 text-gray-700 hover:border-black/20'
                      }`}
                    >
                      {effectivePaymentOption === 'advance' && (
                        <div className="absolute top-2.5 right-2.5 w-4.5 h-4.5 rounded-full bg-[#FF5F00] flex items-center justify-center text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <span className="block text-xs font-black">Pay Advance</span>
                        <span className="block text-[10px] text-gray-500 mt-0.5 font-medium">
                          {paymentMode === 'fixed_advance'
                            ? `Pay ₹${fixedAdvanceAmount} flat advance`
                            : `Pay ${commissionPercentage}% online`}
                        </span>
                      </div>
                      <span className="block text-sm sm:text-base font-black text-[#FF5F00] mt-3">₹{calculatedAdvance.toLocaleString('en-IN')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentOption('full')}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden cursor-pointer ${
                        effectivePaymentOption === 'full'
                          ? 'border-[#FF5F00] bg-[#FF5F00]/5 text-black shadow-md shadow-[#FF5F00]/5'
                          : 'border-black/10 bg-white/40 text-gray-700 hover:border-black/20'
                      }`}
                    >
                      {effectivePaymentOption === 'full' && (
                        <div className="absolute top-2.5 right-2.5 w-4.5 h-4.5 rounded-full bg-[#FF5F00] flex items-center justify-center text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <span className="block text-xs font-black">Pay 100% Full</span>
                        <span className="block text-[10px] text-gray-500 mt-0.5 font-medium">Pay full amount online now</span>
                      </div>
                      <span className="block text-sm sm:text-base font-black text-[#FF5F00] mt-3">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Pricing breakdown - Highlighted in Green */}
              <div className="p-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-950 rounded-2xl space-y-2.5 font-sans">
                <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                  <span>{isBikeRent ? 'Price per day' : (activity.category === 'hotels' ? 'Price per room per night' : 'Price per person')}</span>
                  <span>₹{pricePerPerson.toLocaleString('en-IN')}</span>
                </div>
                {activity.category === 'hotels' && (
                  <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                    <span>Number of nights</span>
                    <span>{nights} Night{nights > 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                  <span>Total price ({guests} {isBikeRent ? `vehicle${guests > 1 ? 's' : ''}` : `guest${guests > 1 ? 's' : ''}`})</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                  <span>Online payment amount</span>
                  <span>₹{amountToPayNow.toLocaleString('en-IN')}</span>
                </div>
                {effectivePaymentOption === 'full' ? (
                  <div className="flex justify-between items-center text-xs text-[#10B981] font-black">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      UPI Discount Applied
                    </span>
                    <span>- ₹{upiDiscountVal.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-400 font-semibold line-through">
                      <span>UPI Instant Discount</span>
                      <span>₹0</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold text-left italic leading-normal">
                      * UPI Discount is applicable only on 100% Full Payment
                    </p>
                  </div>
                )}
                <div className="h-px bg-emerald-500/20 my-1" />
                
                <div className="flex justify-between items-center text-sm font-black text-emerald-600">
                  <span className="flex items-center gap-1.5">
                    {effectivePaymentOption === 'full'
                      ? 'Net Payable Online'
                      : 'Net Advance Payable Online'}
                  </span>
                  <span>₹{finalAmountToPay.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-900/80 font-bold">
                  <span>{effectivePaymentOption === 'full' ? 'Remaining Balance' : 'Remaining Balance (Pay at venue)'}</span>
                  <span>{effectivePaymentOption === 'full' ? '₹0 (Paid in Full)' : `₹${remainingPayment.toLocaleString('en-IN')}`}</span>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-5 bg-transparent border-t border-black/5 flex">
              {isClosed ? (
                <button
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gray-300 text-gray-500 flex items-center justify-center gap-2 border-none cursor-not-allowed font-display"
                >
                  <span>Temporarily Closed</span>
                </button>
              ) : (
                <button
                  onClick={handleRazorpayPayment}
                  className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white hover:shadow-[0_4px_20px_rgba(255,95,0,0.4)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] border-none cursor-pointer font-display"
                >
                  <CreditCard size={16} />
                  <span>
                    {effectivePaymentOption === 'full'
                      ? 'Pay Full & Book'
                      : (paymentMode === 'fixed_advance'
                          ? 'Pay Advance & Book'
                          : `Pay ${commissionPercentage}% & Book`)}
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
