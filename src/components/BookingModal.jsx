import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Clock, ShieldCheck, CreditCard, MessageSquare, Mail, Phone } from 'lucide-react';
import { supabase } from '../supabase';

const formatDisplayPhone = (phone) => {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.substring(0, 5)} ${clean.substring(5)}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.substring(2, 7)} ${clean.substring(7)}`;
  }
  return `+${clean}`;
};

export default function BookingModal({ isOpen, onClose, activity, onAddToCart, initialDate, initialGuests }) {
  // All hooks must be declared before any conditional returns (React Rules of Hooks)
  const [date, setDate] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [slot, setSlot] = useState('');
  const [guests, setGuests] = useState(1);
  const [hasVideoOption, setHasVideoOption] = useState(false);
  const [error, setError] = useState('');
  const [paymentOption, setPaymentOption] = useState('advance');
  const [liabilityAgreed, setLiabilityAgreed] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);
  const [itemSlotsMap, setItemSlotsMap] = useState({});

  const getItemSlots = (item) => {
    if (!item) return ['Flexible (10:00 AM - 06:00 PM)'];
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || item.title || '').toLowerCase();

    if (cat === 'hotels' || cat === 'camping' || name.includes('camp') || name.includes('hotel') || name.includes('stay')) {
      return ['Standard Check-in (12:00 PM)', '01:00 PM', '02:00 PM', 'Flexible Afternoon Check-in'];
    }
    if (cat === 'bikes' || cat === 'bikerent' || name.includes('bike') || name.includes('scooty')) {
      return ['06:00 AM (Early Pickup)', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];
    }
    if (cat === 'rafting' || cat === 'kayaking' || name.includes('raft')) {
      return ['07:00 AM (Early Batch)', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM (Last Batch)'];
    }
    if (cat === 'bungee' || cat === 'swing' || cat === 'zipline' || name.includes('bungee')) {
      return ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
    }
    return ['Flexible (10:00 AM - 06:00 PM)', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];
  };

  // Contact States for direct Razorpay prefilling
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [checkoutLogId, setCheckoutLogId] = useState(null);

  // Guard: must come AFTER all hooks
  // Note: We do NOT return null here - we let the AnimatePresence handle isOpen && activity check
  // to avoid breaking Framer Motion exit animations and ErrorBoundary detection.

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

  // Default slots based on activity category and name
  let defaultSlots = ['Flexible (10:00 AM - 06:00 PM)', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];
  if (activity) {
    const cat = (activity.category || '').toLowerCase();
    const actName = (activity.name || '').toLowerCase();

    if (cat === 'bungee' || cat === 'swing' || cat === 'zipline' || actName.includes('bungee') || actName.includes('swing') || actName.includes('zip')) {
      defaultSlots = [
        'Flexible (10:00 AM - 06:00 PM)',
        '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
        '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
      ];
    } else if (cat === 'rafting' || cat === 'kayaking' || actName.includes('raft') || actName.includes('kayak')) {
      defaultSlots = [
        '07:00 AM (Early Batch)',
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM (Last Batch)'
      ];
    } else if (cat === 'paragliding' || actName.includes('paragliding') || actName.includes('glid')) {
      defaultSlots = [
        '07:00 AM (Sunrise Flight)',
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
        '03:00 PM', '04:00 PM', '05:00 PM (Sunset Flight)'
      ];
    } else if (cat === 'camping' || actName.includes('camp')) {
      defaultSlots = ['12:00 PM (Standard Check-in)', '01:00 PM', '02:00 PM', 'Flexible Afternoon Check-in'];
    } else if (cat === 'bikes' || cat === 'bikerent' || actName.includes('bike') || actName.includes('scooty') || actName.includes('rent')) {
      defaultSlots = [
        'Anytime Pickup (08:00 AM - 08:00 PM)',
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'
      ];
    }
  }
  const slots = (activity && activity.slots) || defaultSlots;
  
  const checkIfDateClosed = (targetDateStr) => {
    if (!activity) return { closed: false };
    
    // Explicit toggle
    if (activity.is_closed || activity.is_available === false) {
      return { 
        closed: true, 
        reason: activity.closed_reason || 'Shop currently offline / Not taking bookings',
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
      // Initialize combo item slots map
      if (activity.items && activity.items.length > 0) {
        const initialMap = {};
        activity.items.forEach((item, idx) => {
          const key = item.id || item.name || idx;
          const opts = getItemSlots(item);
          initialMap[key] = item.slot || opts[0];
        });
        setItemSlotsMap(initialMap);
      }
      setRentalDays(1);
      setSlot(slots[0]);
      const freeVideo = activity.free_video_type !== undefined ? activity.free_video_type : (activity.category === 'rafting' ? 'dslr' : 'none');
      setHasVideoOption(freeVideo !== 'none');
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

        // For hotels: set guests = total guests passed from hotel page
        const totalFromHotel = (activity.num_adults ?? 2) + (activity.num_kids ?? 0);
        setGuests(totalFromHotel);
      } else {
        // For other categories: use initialGuests or default 1
        setGuests(initialGuests || 1);
      }

      // Prefill user details if logged in
      const userEmail = localStorage.getItem('tripgod_user_email') || '';
      const userName = localStorage.getItem('tripgod_user_name') || '';
      const storedProfile = localStorage.getItem(`tripgod_profile_${userEmail}`);
      const userPhone = storedProfile ? JSON.parse(storedProfile).phone : '';
      
      setName(userName);
      setEmail(userEmail);
      setPhone(userPhone);
      setLiabilityAgreed(false);
    }
  }, [activity, initialDate, initialGuests]);

  const getSlotLabel = () => {
    const cat = ((activity && activity.category) || '').toLowerCase();
    if (cat === 'hotels') return 'Room Type';
    if (cat === 'bikes' || cat === 'bikerent') return 'Pickup Time';
    if (cat === 'tours') return 'Select Package';
    return 'Select Slot';
  };

  const isBikeRent = activity && (activity.category === 'bikerent' || activity.category === 'bikes');

  // Determine payment configuration
  // Support dynamic per-item commission types ('flat' vs 'percentage')
  const commType = (activity && (activity.commission_type || activity.vendors?.commission_type)) || (activity && activity.fixed_advance_amount > 0 ? 'flat' : 'percentage');
  const commVal = activity && (activity.commission_value !== undefined && activity.commission_value !== null)
    ? Number(activity.commission_value)
    : (activity && activity.fixed_advance_amount > 0
        ? Number(activity.fixed_advance_amount)
        : (activity && activity.commission_percentage !== undefined && activity.commission_percentage !== null
            ? Number(activity.commission_percentage)
            : 0));

  const fixedAdvanceAmount = activity && activity.selectedOccupancy && activity.selectedOccupancy.fixed_advance_amount !== undefined && activity.selectedOccupancy.fixed_advance_amount !== null && activity.selectedOccupancy.fixed_advance_amount !== ''
    ? Number(activity.selectedOccupancy.fixed_advance_amount)
    : (activity && activity.fixed_advance_amount !== undefined && activity.fixed_advance_amount !== null
        ? Number(activity.fixed_advance_amount)
        : (commType === 'flat' ? commVal : 0));

  const commissionPercentage = commType === 'percentage' ? commVal : 0;
  const paymentMode = (activity && activity.payment_mode) || 'commission_advance';

  // Calculate nights for hotel bookings
  let nights = 1;
  if (activity && activity.category === 'hotels' && checkInDate && checkOutDate) {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end - start);
    nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }

  // Calculate pricing
  const isCombo = activity && (activity.category === 'combo' || activity.type === 'custom_combo' || activity.totalPrice !== undefined);
  const basePrice = (activity && (activity.price || activity.final_price)) || 0;
  const pricePerPerson = basePrice;
  const rawTotalPrice = isCombo
    ? Number(activity.totalPrice || (basePrice * guests))
    : (isBikeRent
        ? pricePerPerson * guests * rentalDays
        : (activity && (activity.category === 'hotels' || (activity.category === 'camping' && activity.room_price) || activity.selectedOccupancy)
            ? basePrice
            : pricePerPerson * guests));
  
  const isHotel = activity && activity.category === 'hotels';

  // Calculate 12% tax dynamically for hotel bookings
  const taxes = isHotel ? Math.round(rawTotalPrice * 0.12) : 0;
  const totalPrice = rawTotalPrice + taxes;

  // Calculate dynamic advance amount based on Fixed Advance Amount (₹) or percentage
  let calculatedAdvance = 0;
  if (isCombo && activity.advance_amount) {
    calculatedAdvance = Number(activity.advance_amount);
  } else if (paymentMode === 'full_payment') {
    calculatedAdvance = totalPrice;
  } else if (fixedAdvanceAmount > 0) {
    const units = (activity && activity.selectedOccupancy) ? 1 : (isBikeRent ? (guests * rentalDays) : (isHotel ? 1 : guests));
    calculatedAdvance = Math.min(totalPrice, fixedAdvanceAmount * units + taxes);
  } else if (commType === 'flat') {
    const flatPerUnit = commVal;
    const units = (activity && activity.selectedOccupancy) ? 1 : (isBikeRent ? (guests * rentalDays) : (isHotel ? 1 : guests));
    calculatedAdvance = Math.min(totalPrice, flatPerUnit * units + taxes);
  } else {
    // Percentage % (Default 10% advance)
    const commRate = commVal || 10;
    calculatedAdvance = Math.max(1, Math.round(totalPrice * (commRate / 100)));
  }

  // If payment mode is full_payment, force paymentOption to 'full'
  const effectivePaymentOption = paymentMode === 'full_payment' ? 'full' : paymentOption;

  const amountToPayNow = effectivePaymentOption === 'full' ? totalPrice : calculatedAdvance;
  const remainingPayment = effectivePaymentOption === 'full' ? 0 : Math.max(0, totalPrice - amountToPayNow);

  // Calculate dynamic UPI Discount
  const customUpiDiscount = activity && activity.upi_discount !== undefined && activity.upi_discount !== null && activity.upi_discount !== ''
    ? Number(activity.upi_discount)
    : null;

  const getUPIDiscount = (price) => {
    if (customUpiDiscount !== null && !isNaN(customUpiDiscount)) return Math.max(0, customUpiDiscount);
    // If backend upi_discount is left blank/null, DO NOT apply any automatic fallback discount!
    return 0;
  };

  // UPI Discount is ONLY applicable on 100% Full Payment
  const applyUpiDiscount = effectivePaymentOption === 'full';
  const upiDiscountVal = applyUpiDiscount ? getUPIDiscount(totalPrice) : 0;
  const finalAmountToPay = Math.max(0, amountToPayNow - upiDiscountVal);

  const minDate = new Date().toISOString().split('T')[0];
  const unitLabel = isBikeRent ? 'Vehicle(s)' : 'Person(s)';

  const handleRazorpayPayment = async () => {
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

    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const logId = checkoutLogId || generateUUID();
    if (!checkoutLogId) {
      setCheckoutLogId(logId);
    }
    const dbBookingId = generateUUID();

    const logCheckoutAttempt = async () => {
      try {
        const itemDetails = {
          name: activity.name,
          category: activity.category,
          price: finalAmountToPay,
          date: activity.category === 'hotels' ? `${checkInDate} to ${checkOutDate}` : date,
          guests: guests || 1,
          slot: slot || ''
        };
        await supabase.from('abandoned_carts').upsert([{
          id: logId,
          customer_name: name,
          customer_email: email || '',
          customer_phone: phone,
          cart_items: [itemDetails],
          status: 'abandoned',
          updated_at: new Date().toISOString()
        }]);
      } catch (err) {
        console.error("Database upsert cart log error:", err);
      }
    };
    logCheckoutAttempt();

    const amountInPaise = finalAmountToPay * 100;
    const notesData = {
      booking_id: dbBookingId,
      cart_id: logId,
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      activity_name: activity.name
    };

    // Try fetching Razorpay Order ID for guaranteed auto-capture
    let orderId = null;
    try {
      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          notes: notesData
        })
      });
      const orderData = await orderRes.json();
      if (orderData && orderData.order_id) {
        orderId = orderData.order_id;
      }
    } catch (e) {
      console.warn("Could not pre-create Razorpay Order ID, falling back to direct checkout options", e);
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TAd3hYpU1J84mE",
      amount: amountInPaise, // paise
      currency: "INR",
      payment_capture: 1,
      name: "TripGod",
      description: effectivePaymentOption === 'full' 
        ? `${activity.name} - 100% Full Payment` 
        : (paymentMode === 'fixed_advance'
            ? `${activity.name} - ₹${calculatedAdvance.toLocaleString('en-IN')} Advance`
            : `${activity.name} - ${commissionPercentage}% Advance`),
      image: "/tripgod-logo-padded.jpg",
      notes: notesData,
      handler: function (response) {
        const paymentId = response.razorpay_payment_id;

        // Auto-capture fallback call to serverless function
        fetch('/api/capture-razorpay-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_id: paymentId,
            amount: amountInPaise,
            currency: 'INR'
          })
        }).catch(err => console.error("Auto-capture API error:", err));

        // Mark log completed in database
        supabase.from('abandoned_carts').update({ status: 'completed' }).eq('id', logId).then(({ error }) => {
          if (error) console.error("Database update cart status error:", error);
        });

        const advanceLabel = paymentMode === 'fixed_advance'
          ? 'Fixed Advance Booking'
          : `${commissionPercentage}% Advance Booking`;

        const dateRangeStr = activity.category === 'hotels'
          ? `${checkInDate.split('-').reverse().join('/')} to ${checkOutDate.split('-').reverse().join('/')} (${nights} Night${nights > 1 ? 's' : ''})`
          : date.split('-').reverse().join('/');

        const simpleBookingCode = getSimpleBookingId(dbBookingId);

        let comboVendorsSection = '';
        if (isCombo && activity.items && activity.items.length > 0) {
          comboVendorsSection += `\n*SERVICES & VENDOR VENUE PAYMENTS:*\n`;
          activity.items.forEach((item, idx) => {
            const vRate = (item.vendorRate !== undefined ? Number(item.vendorRate) : Math.max(0, Number(item.price || 0) - Number(item.fixedAdvance || 0))) * guests;
            const mapsUrl = item.mapLink || `https://maps.google.com/?q=${encodeURIComponent((item.fullAddress || item.vendorName || item.name) + ' Rishikesh')}`;
            comboVendorsSection += `${idx + 1}. *${item.vendorName || item.name}* (${item.name})\n`;
            comboVendorsSection += `   • Address: ${item.fullAddress || 'Rishikesh, Uttarakhand'}\n`;
            comboVendorsSection += `   • 📍 Maps Link: ${mapsUrl}\n`;
            comboVendorsSection += `   • 💵 Pay Vendor at Venue: ₹${vRate.toLocaleString('en-IN')}\n\n`;
          });
        }

        const message = `*BOOKING SUCCESSFUL & PAID - TRIPGOD*
----------------------------------
*Booking ID:* ${simpleBookingCode}
*Payment Confirmation ID:* ${paymentId}
*Status:* ${effectivePaymentOption === 'full' ? 'Paid 100% Full Payment Online' : `Paid ${advanceLabel}`}
----------------------------------
*Customer Name:* ${name}
*Customer Email:* ${email}
*Customer Phone:* ${phone}
----------------------------------
*Activity:* ${activity.name} ${activity.stretch ? `(${activity.stretch})` : ''}
*Date:* ${dateRangeStr}
${isBikeRent ? `*Pickup Time:* ${slot}\n*Rental Duration:* ${rentalDays} Day(s)\n*No. of Vehicles:* ${guests} Vehicle(s)` : `*${activity.category === 'hotels' ? 'Room Type' : 'Slot'}:* ${slot}\n*Guests:* ${guests} ${unitLabel}`}
${hasVideoOption ? `*Add-ons:* ${((activity.free_video_type || (activity.category === 'rafting' ? 'dslr' : 'none')) === 'gopro') ? 'GoPro Video Included' : 'DSLR Video Included'}\n` : ''}${comboVendorsSection}
*Price Summary:*
- Total Price: ₹${totalPrice.toLocaleString('en-IN')}
- *${effectivePaymentOption === 'full' ? 'Paid 100% Online' : (paymentMode === 'fixed_advance' ? 'Paid Fixed Advance' : `Paid ${commissionPercentage}% Advance`)}:* ₹${finalAmountToPay.toLocaleString('en-IN')}${upiDiscountVal > 0 ? ` (UPI Discount of ₹${upiDiscountVal} applied)` : ''}
- ${effectivePaymentOption === 'full' ? 'Remaining Balance: ₹0 (Paid in Full)' : `Pay at Venue: ₹${remainingPayment.toLocaleString('en-IN')}`}
----------------------------------
My payment ID is verified. Please confirm my slots.`;

        // Save booking locally
        try {
          const enrichedComboItems = (activity.items || []).map((item, idx) => {
            const key = item.id || item.name || idx;
            return {
              ...item,
              slot: itemSlotsMap[key] || item.slot || 'Flexible',
              selectedSlot: itemSlotsMap[key] || item.slot || 'Flexible'
            };
          });

          const singleItemObj = {
            id: activity.id || '1',
            category: activity.category || 'hotels',
            name: activity.name,
            slot: activity.category === 'hotels' ? `Check-in: ${checkInDate} to ${checkOutDate}` : (slot || 'Flexible Timing'),
            fullAddress: activity.fullAddress || activity.address || activity.location || 'Rishikesh, Uttarakhand',
            mapLink: activity.mapLink || `https://maps.google.com/?q=${encodeURIComponent(activity.name + ' Rishikesh')}`,
            operatorPhone: opPhone,
            phone_number: activity.phone_number || activity.phone,
            whatsapp_number: activity.whatsapp_number || activity.whatsapp,
            vendors: activity.vendors
          };

          const newBooking = {
            id: simpleBookingCode,
            bookingId: simpleBookingCode,
            dbBookingId: dbBookingId,
            customerName: name,
            customerPhone: phone,
            customerEmail: email,
            date: dateRangeStr,
            activityName: activity.name,
            activities: [{
              name: activity.name,
              stretch: activity.stretch || '',
              date: dateRangeStr,
              slot: slot,
              guests: guests,
              subtotal: totalPrice
            }],
            items: enrichedComboItems.length > 0 ? enrichedComboItems : [singleItemObj],
            totalPrice: totalPrice,
            advancePaid: finalAmountToPay,
            remainingPaid: remainingPayment
          };

          storedBookings.push(newBooking);
          localStorage.setItem(`tripgod_bookings_${email}`, JSON.stringify(storedBookings));
          if (phone) {
            localStorage.setItem(`tripgod_bookings_${phone}`, JSON.stringify(storedBookings));
          }
          localStorage.setItem(`tripgod_booking_${simpleBookingCode}`, JSON.stringify(newBooking));
          localStorage.setItem(`tripgod_booking_${dbBookingId}`, JSON.stringify(newBooking));
        } catch (err) {
          console.error('Failed to save booking locally:', err);
        }

        // Save booking to Supabase SQL Database
        try {
          const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
          const bookingInsertData = {
            id: dbBookingId,
            city_id: activity.city_id && isValidUUID(activity.city_id) ? activity.city_id : null,
            vendor_id: activity.vendor_id && isValidUUID(activity.vendor_id) ? activity.vendor_id : null,
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            service_type: activity.category === 'hotels' ? 'Hotel' : activity.category === 'bikerent' ? 'Bike Rental' : (activity.category === 'tours' || activity.category === 'tour') ? 'Tour' : ['rafting', 'camping', 'bungee', 'paragliding', 'swing', 'zipline', 'kayaking'].includes(activity.category) ? activity.category.charAt(0).toUpperCase() + activity.category.slice(1) : 'Rafting',
            service_id: activity.id && isValidUUID(activity.id) ? activity.id : '00000000-0000-0000-0000-000000000000',
            travel_date: activity.category === 'hotels' ? checkInDate : date,
            status: 'confirmed',
            payment_type: effectivePaymentOption === 'full' ? 'full_online' : 'advance_custom',
            amount_paid: finalAmountToPay,
            remaining_amount: remainingPayment,
            commission_earned: paymentMode === 'fixed_advance'
              ? Math.min(calculatedAdvance, totalPrice)
              : Math.round(totalPrice * (commissionPercentage / 100))
          };
          supabase.from('bookings').insert([bookingInsertData]).then(({ error }) => {
            if (error) {
              console.error('Error inserting booking to Supabase:', error);
            }
            const opPhone = activity.whatsapp_number || activity.whatsapp || activity.vendors?.whatsapp || activity.vendors?.phone || activity.phone_number || activity.operatorPhone || '9410572857';

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
                type: activity.type || activity.category,
                stretch: activity.stretch || '',
                date: dateRangeStr,
                checkInDate: activity.category === 'hotels' ? checkInDate : null,
                checkOutDate: activity.category === 'hotels' ? checkOutDate : null,
                nights: activity.category === 'hotels' ? nights : null,
                slot: slot,
                guests: guests,
                totalPrice: totalPrice,
                advancePaid: finalAmountToPay,
                remainingPaid: remainingPayment,
                paymentId: dbBookingId,
                category: activity.category,
                hotel_id: activity.category === 'hotels' ? activity.id : null,
                service_id: activity.id || null,
                vendor_id: activity.vendor_id || activity.vendors?.id || null,
                maps_link: activity.maps_link || activity.google_maps_link || activity.mapLink || activity.map_link || activity.vendors?.google_maps_link || activity.vendors?.maps_link || null,
                google_maps_link: activity.maps_link || activity.google_maps_link || activity.mapLink || activity.map_link || activity.vendors?.google_maps_link || activity.vendors?.maps_link || null,
                paymentOption: effectivePaymentOption,
                upiDiscount: upiDiscountVal,
                commissionPercentage: commissionPercentage,
                operatorPhone: opPhone,
                items: (activity.items || []).map((item, idx) => {
                  const key = item.id || item.name || idx;
                  return {
                    ...item,
                    slot: itemSlotsMap[key] || item.slot || 'Flexible',
                    selectedSlot: itemSlotsMap[key] || item.slot || 'Flexible'
                  };
                })
              })
            }).catch(err => console.error('WhatsApp notification error:', err));

            setBookingSuccessData({
              bookingId: dbBookingId,
              totalPrice: totalPrice,
              advancePaid: finalAmountToPay,
              remainingPaid: remainingPayment,
              operatorPhone: opPhone
            });
          });
        } catch (err) {
          console.error('Supabase booking insertion failed:', err);
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

    if (orderId) {
      options.order_id = orderId;
    }

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
      date: activity.category === 'hotels' ? `${checkInDate} to ${checkOutDate}` : date,
      checkInDate: activity.category === 'hotels' ? checkInDate : null,
      checkOutDate: activity.category === 'hotels' ? checkOutDate : null,
      nights: activity.category === 'hotels' ? nights : null,
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
      {isOpen && activity && (
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
            {bookingSuccessData ? (
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-center flex flex-col items-center max-h-[85vh] scrollbar-thin">
                {/* Success Animation Checkmark */}
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-3xs animate-bounce shrink-0 mt-1">
                  <svg className="w-7 h-7 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-neutral-900">
                    Booking Confirmed!
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Your stay has been reserved successfully
                  </p>
                </div>

                {/* Booking Details Card */}
                {activity.category === 'hotels' ? (
                  <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-200/60 pb-2">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">Booking ID</span>
                      <span className="font-black text-black text-xs">{getSimpleBookingId(bookingSuccessData.bookingId)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Stay / Hotel</span>
                      <span className="font-extrabold text-neutral-800 truncate max-w-[200px]" title={activity.name}>{activity.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Address</span>
                      <span className="font-extrabold text-neutral-800 text-right max-w-[200px] truncate" title={activity.address}>{activity.address}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Dates</span>
                      <span className="font-extrabold text-neutral-800">{checkInDate.split('-').reverse().join('/')} to {checkOutDate.split('-').reverse().join('/')} ({nights} Night{nights > 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Timings</span>
                      <span className="font-extrabold text-neutral-800">Check-in: {activity.check_in || '12:00 PM'} | Check-out: {activity.check_out || '11:00 AM'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Hotel Contact</span>
                      <span className="font-extrabold text-[#FF5F00] font-sans">{formatDisplayPhone(bookingSuccessData.operatorPhone)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Total Price</span>
                      <span className="font-extrabold text-neutral-800 font-sans">₹{bookingSuccessData.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#10B981] font-black">Paid Online</span>
                      <span className="font-black text-[#10B981] font-sans">₹{bookingSuccessData.advancePaid.toLocaleString('en-IN')}</span>
                    </div>
                    {bookingSuccessData.remainingPaid > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#FF5F00] font-black">Pay at Hotel</span>
                        <span className="font-black text-[#FF5F00] font-sans">₹{bookingSuccessData.remainingPaid.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-200/60 pb-2">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">Booking ID</span>
                      <span className="font-black text-black text-xs">{getSimpleBookingId(bookingSuccessData.bookingId)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Activity / Tour</span>
                      <span className="font-extrabold text-neutral-800 truncate max-w-[200px]" title={activity.name}>{activity.name}</span>
                    </div>
                    {activity.stretch && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold">Stretch/Route</span>
                        <span className="font-extrabold text-neutral-800 truncate max-w-[200px]" title={activity.stretch}>{activity.stretch}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Date & Slot</span>
                      <span className="font-extrabold text-neutral-800">{date.split('-').reverse().join('/')} ({slot})</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Guests</span>
                      <span className="font-extrabold text-neutral-800">{guests} {unitLabel}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Local Contact</span>
                      <span className="font-extrabold text-[#FF5F00] font-sans">{formatDisplayPhone(bookingSuccessData.operatorPhone)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold">Total Price</span>
                      <span className="font-extrabold text-neutral-800 font-sans">₹{bookingSuccessData.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#10B981] font-black">Paid Online</span>
                      <span className="font-black text-[#10B981] font-sans">₹{bookingSuccessData.advancePaid.toLocaleString('en-IN')}</span>
                    </div>
                    {bookingSuccessData.remainingPaid > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#FF5F00] font-black">Pay at Venue</span>
                        <span className="font-black text-[#FF5F00] font-sans">₹{bookingSuccessData.remainingPaid.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Steps Container */}
                <div className="w-full p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-left space-y-2">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">What happens next?</h4>
                  <ul className="text-[10px] sm:text-[11px] text-emerald-850 font-semibold space-y-2 list-none pl-0">
                    <li className="flex items-start gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> 
                      <span>Confirmation tickets containing full booking details have been sent to your registered Email and WhatsApp.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> 
                      <span>You can directly contact the Host/Hotel desk at <strong>{formatDisplayPhone(bookingSuccessData.operatorPhone)}</strong> to coordinate check-in or booking slots.</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setBookingSuccessData(null);
                    onClose();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] transition-all border-none cursor-pointer font-display"
                >
                  Close & Continue
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/5 bg-transparent text-black">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] tracking-wider uppercase text-[#FF5F00] font-black px-2 py-0.5 bg-[#FF5F00]/10 border border-[#FF5F00]/20 rounded">
                    {(activity.category || 'Booking').toUpperCase()}
                  </span>
                  {activity.selectedOccupancyName && (
                    <span className="text-[9px] font-black tracking-wider uppercase text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      Occupancy: {activity.selectedOccupancyName}
                    </span>
                  )}
                </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Date & Slot selection */}
              {isBikeRent ? (
                <div className="space-y-4">
                  {/* Select Start Date */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#FF5F00]" /> Select Start Date
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

                  {/* Duration (Days) & Vehicles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Clock size={14} className="text-[#FF5F00]" /> Rental Duration (Days)
                      </label>
                      <select
                        value={rentalDays}
                        onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-3 border border-black/10 rounded-xl text-black bg-white/70 focus:outline-none focus:border-[#FF5F00] focus:ring-2 focus:ring-[#FF5F00]/10 font-semibold text-sm transition-all duration-200 font-bold"
                      >
                        <option value={1}>1 Day (24 Hours)</option>
                        <option value={2}>2 Days</option>
                        <option value={3}>3 Days</option>
                        <option value={4}>4 Days</option>
                        <option value={5}>5 Days</option>
                        <option value={6}>6 Days</option>
                        <option value={7}>7 Days (1 Week)</option>
                        <option value={10}>10 Days</option>
                        <option value={14}>14 Days (2 Weeks)</option>
                        <option value={30}>30 Days (1 Month)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Users size={14} className="text-[#FF5F00]" /> No. of Vehicles
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

                  {/* Pickup Time */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#FF5F00]" /> Pickup Time
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
                </div>
              ) : activity.category === 'hotels' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Users size={14} className="text-[#FF5F00]" /> Guests &amp; Rooms
                    </label>
                    <div className="w-full px-4 py-3 border border-black/10 rounded-xl bg-gray-50 text-sm font-semibold text-black">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1.5 text-gray-700">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF5F00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
                              </svg>
                              <span className="font-black text-black">{activity.num_rooms ?? 1}</span>
                              <span className="text-gray-500 text-xs">
                                {activity.category === 'camping' ? `tent${(activity.num_rooms ?? 1) > 1 ? 's' : ''}` : `room${(activity.num_rooms ?? 1) > 1 ? 's' : ''}`}
                              </span>
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="flex items-center gap-1.5 text-gray-700">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
                              </svg>
                              <span className="font-black text-black">{activity.num_adults ?? 2}</span>
                              <span className="text-gray-500 text-xs">adult{(activity.num_adults ?? 2) > 1 ? 's' : ''}</span>
                            </span>
                            {(activity.num_kids ?? 0) > 0 && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="flex items-center gap-1.5 text-gray-700">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="9" r="3"/><path d="M12 12v3"/><path d="M9.5 17.5 12 15l2.5 2.5"/>
                                  </svg>
                                  <span className="font-black text-black">{activity.num_kids}</span>
                                  <span className="text-gray-500 text-xs">child{activity.num_kids !== 1 ? 'ren' : ''}</span>
                                </span>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium mt-0.5">Set in hotel details · Go back to change</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#FF5F00]" /> Select Date
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <Users size={14} className="text-[#FF5F00]" /> Total Guests
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

                  {activity.items && activity.items.length > 0 && (
                    <div className="mt-4 p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-[#FF5F00] flex items-center gap-1.5">
                          <Clock size={14} /> Itemized Timing Slots ({activity.items.length} Services)
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">Set timing per item</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        {activity.items.map((item, idx) => {
                          const itemKey = item.id || item.name || idx;
                          const availableItemSlots = getItemSlots(item);
                          const currentSelected = itemSlotsMap[itemKey] || availableItemSlots[0];
                          
                          return (
                            <div key={itemKey} className="p-3 bg-white rounded-xl border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#FF5F00]/10 text-[#FF5F00] font-black text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="text-xs font-black text-gray-900 leading-tight">{item.name || item.title}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.category || 'Service'}</p>
                                </div>
                              </div>
                              
                              <select
                                value={currentSelected}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItemSlotsMap(prev => ({ ...prev, [itemKey]: val }));
                                }}
                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-[#FF5F00] cursor-pointer"
                              >
                                {availableItemSlots.map((sOpt, sIdx) => (
                                  <option key={sIdx} value={sOpt}>{sOpt}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Optional extras depending on category & free video selection */}
              {((activity.free_video_type !== undefined ? activity.free_video_type !== 'none' : activity.category === 'rafting')) && (
                <div className="flex items-start gap-3 p-3.5 border border-green-500/20 bg-green-50/50 rounded-xl text-left">
                  <div className="mt-0.5 text-green-600 bg-green-100 p-1 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-green-900">
                      {((activity.free_video_type || (activity.category === 'rafting' ? 'dslr' : 'none')) === 'gopro') ? 'Free GoPro Video & Photos Included' : 'Free DSLR Video & Photos Included'}
                    </span>
                    <span className="block text-xs text-green-700/80">
                      {((activity.free_video_type || (activity.category === 'rafting' ? 'dslr' : 'none')) === 'gopro') 
                        ? 'Get high-quality action footage of your experience shot with GoPro, delivered directly via WhatsApp.'
                        : 'Get high-quality cinematic photos and footage of your experience, delivered directly via WhatsApp.'}
                    </span>
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
                    {isCombo && activity?.advance_amount
                      ? `PAY ONLY ₹${calculatedAdvance.toLocaleString('en-IN')} ADVANCE`
                      : (paymentMode === 'fixed_advance'
                          ? `PAY ONLY ₹${calculatedAdvance.toLocaleString('en-IN')} ADVANCE`
                          : (paymentMode === 'full_payment'
                              ? '100% SECURE FULL PAYMENT'
                              : `PAY ONLY ${commissionPercentage}% ADVANCE`))}
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
                        <span className="block text-[10px] text-[#FF5F00] font-black tracking-wide mt-0.5">
                          {isCombo && activity?.advance_amount
                            ? `Pay ₹${calculatedAdvance.toLocaleString('en-IN')} advance online`
                            : (isHotel
                                ? `₹${fixedAdvanceAmount} Advance + ₹${taxes} GST`
                                : (activity?.selectedOccupancyName
                                    ? `Pay token advance online`
                                    : (paymentMode === 'fixed_advance' || fixedAdvanceAmount > 0
                                        ? `Pay token advance online`
                                        : (commissionPercentage > 0 ? `Pay ${commissionPercentage}% online` : 'Pay token advance online'))))}
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
                {activity.category === 'hotels' ? (
                  <>
                    <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                      <span>Rate per night ({activity.num_rooms ?? 1} room{(activity.num_rooms ?? 1) > 1 ? 's' : ''})</span>
                      <span>₹{(activity.room_price || activity.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {(activity.meal_cost_per_night || 0) > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                        <span>Meal add-ons ({(activity.num_adults ?? 2) + (activity.num_kids ?? 0)} guests)</span>
                        <span>₹{Number(activity.meal_cost_per_night).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                      <span>Nights</span>
                      <span>{nights} Night{nights > 1 ? 's' : ''}</span>
                    </div>
                  </>
                ) : isBikeRent ? (
                  <>
                    <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                      <span>Price per day</span>
                      <span>₹{pricePerPerson.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                      <span>Rental duration</span>
                      <span>{rentalDays} Day{rentalDays > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                      <span>Base price ({guests} vehicle{guests > 1 ? 's' : ''} × {rentalDays} day{rentalDays > 1 ? 's' : ''})</span>
                      <span>₹{rawTotalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : isCombo ? (
                  <>
                    {activity.items && activity.items.map((item, idx) => {
                      const vRate = (item.vendorRate !== undefined ? Number(item.vendorRate) : Math.max(0, Number(item.price || 0) - Number(item.fixedAdvance || 0))) * guests;
                      return (
                        <div key={idx} className="space-y-0.5 border-b border-emerald-500/10 pb-1.5 last:border-b-0">
                          <div className="flex justify-between items-center text-xs text-emerald-900/90 font-bold">
                            <span className="truncate max-w-[220px]" title={`${item.category}: ${item.name}`}>
                              {item.category === 'Hotel' ? '🏨' : item.category === 'Scooty' ? '🛵' : item.category === 'Rafting' ? '🚣' : '🏕️'} {item.vendorName || item.name} ({item.name})
                            </span>
                            <span>₹{(Number(item.price || 0) * guests).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-emerald-850 font-medium">
                            <span className="text-gray-500">📍 Pay Vendor at Venue:</span>
                            <span className="font-bold text-slate-800">₹{vRate.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })}
                    {activity.discountPercent > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-700 font-bold pt-1">
                        <span className="flex items-center gap-1">
                          <span>🔥</span> Combo Discount ({activity.discountPercent}% OFF)
                        </span>
                        <span>- ₹{Number(activity.totalSaved || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {(activity.totalHotelGst || 0) > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                        <span>📄 Hotel GST &amp; Service Taxes (12%)</span>
                        <span>+ ₹{Number(activity.totalHotelGst).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                      <span>Price per person</span>
                      <span>₹{pricePerPerson.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                      <span>Base price ({guests} guest{guests > 1 ? 's' : ''})</span>
                      <span>₹{rawTotalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
                {activity.category === 'hotels' && (
                  <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                    <span>GST & Service Taxes (12%)</span>
                    <span>₹{taxes.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-emerald-950 font-black">
                  <span>Total price (incl. taxes)</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-900/70 font-semibold">
                  <span>Online payment amount</span>
                  <span>₹{amountToPayNow.toLocaleString('en-IN')}</span>
                </div>
                {effectivePaymentOption === 'full' ? (
                  upiDiscountVal > 0 && (
                    <div className="flex justify-between items-center text-xs text-[#10B981] font-black">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                        UPI Discount Applied
                      </span>
                      <span>- ₹{upiDiscountVal.toLocaleString('en-IN')}</span>
                    </div>
                  )
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
            <div className="p-5 bg-transparent flex">
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
                      : (isCombo && activity?.advance_amount
                          ? `Pay ₹${finalAmountToPay.toLocaleString('en-IN')} Advance & Book`
                          : 'Pay Advance & Book')}
                  </span>
                </button>
              )}
            </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
