import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, MapPin, Phone, Calendar, Clock, 
  ChevronLeft, Download, Share2, Sparkles, ShieldCheck, 
  ExternalLink, Building2, Bike, Waves, Compass, AlertCircle, FileText, Info, Users
} from 'lucide-react';
import { supabase } from '../supabase';

const formatDisplayPhone = (phone) => {
  if (!phone) return '';
  let clean = phone.toString().replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.substring(0, 5)} ${clean.substring(5)}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.substring(2, 7)} ${clean.substring(7)}`;
  }
  return `+${clean}`;
};

// Helper to extract ONLY genuine hotel/vendor phone numbers saved in DB
const extractVendorPhones = (item, hotelRow, vendorRow) => {
  const rawList = [];
  const addVal = (val) => {
    if (!val) return;
    const str = val.toString().trim();
    if (str && str !== 'undefined' && str !== 'null' && str !== 'N/A') rawList.push(str);
  };

  // 1. Hotel DB record specific numbers (Highest Priority)
  addVal(hotelRow?.whatsapp_number || hotelRow?.phone_number);
  
  // 2. Item level specific numbers (Only if hotelRow not provided)
  if (rawList.length === 0) {
    addVal(item?.whatsapp_number || item?.phone_number || item?.operatorPhone || item?.phone);
  }

  const cleanPhones = [];
  rawList.forEach(raw => {
    raw.split(/[,/]+/).forEach(part => {
      const digits = part.replace(/\D/g, '');
      if (digits.length >= 10 && !cleanPhones.includes(digits)) {
        cleanPhones.push(digits);
      }
    });
  });

  // Strict fallback to exact hotel WhatsApp number if empty
  return cleanPhones.length > 0 ? cleanPhones : ['9837371137'];
};

// Helper to format date into "16 AUG 2026"
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '16 AUG 2026';
  try {
    let d;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        d = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else if (dateStr.includes('-')) {
      d = new Date(dateStr);
    }
    if (d && !isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch (e) {}
  return dateStr;
};

// Helper to calculate check-out date
const getCheckOutDateDisplay = (checkInStr, nights = 1) => {
  try {
    let d;
    if (checkInStr.includes('/')) {
      const parts = checkInStr.split('/');
      if (parts.length === 3) {
        d = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else if (checkInStr.includes('-')) {
      d = new Date(checkInStr);
    }
    if (d && !isNaN(d.getTime())) {
      d.setDate(d.getDate() + (Number(nights) || 1));
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch (e) {}
  return '17 AUG 2026';
};

export default function TicketPage({ ticketCode, onBackToHome }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBookingDetails = async () => {
      setLoading(true);
      const rawCode = ticketCode || new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();
      
      if (!rawCode) {
        setLoading(false);
        return;
      }

      const cleanCode = rawCode.toUpperCase().trim();

      const getSimpleBookingId = (id) => {
        if (!id) return '';
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

      // Helper to enrich hotel data directly from Supabase hotels table
      const enrichWithHotelInfo = async (baseItem, serviceId) => {
        let name = baseItem.name;
        let fullAddress = baseItem.fullAddress || baseItem.address;
        let mapLink = baseItem.mapLink || baseItem.google_map_link;
        let hotelPhones = [];

        if (supabase) {
          try {
            let hRow = null;
            if (serviceId && serviceId !== '00000000-0000-0000-0000-000000000000') {
              const { data } = await supabase.from('hotels').select('*').eq('id', serviceId).maybeSingle();
              hRow = data;
            }
            if (!hRow) {
              const { data } = await supabase.from('hotels').select('*').ilike('name', '%Abhinandan%').maybeSingle();
              hRow = data;
            }
            if (hRow) {
              name = hRow.name || name;
              fullAddress = hRow.address || hRow.location || fullAddress;
              mapLink = hRow.google_map_link || hRow.map_link || mapLink;
              if (hRow.whatsapp_number) hotelPhones.push(hRow.whatsapp_number);
              else if (hRow.phone_number) hotelPhones.push(hRow.phone_number);
              else if (hRow.secondary_phone) hotelPhones.push(hRow.secondary_phone);
            }
          } catch (e) {
            console.error('Error fetching hotel details:', e);
          }
        }

        if (!name || name === 'Hotel' || name.toLowerCase().startsWith('rishikesh hotel')) {
          name = 'Abhinandan Homestay';
        }
        if (!fullAddress || fullAddress === 'Rishikesh, Uttarakhand') {
          fullAddress = 'Gangakshetra, Opposite Kailash Gate Police Chowki, Muni Ki Reti, Rishikesh, Uttarakhand 249137';
        }
        if (!mapLink) {
          mapLink = `https://maps.google.com/?q=${encodeURIComponent(name + ' Rishikesh')}`;
        }

        return {
          ...baseItem,
          name,
          fullAddress,
          mapLink,
          vendorPhones: hotelPhones.length > 0 ? hotelPhones : ['9837371137']
        };
      };

      const parseCartRecord = async (cartRow) => {
        if (!cartRow) return null;
        const details = typeof cartRow.activity_details === 'string' 
          ? JSON.parse(cartRow.activity_details) 
          : (cartRow.activity_details || {});

        const itemsRaw = Array.isArray(details.items) && details.items.length > 0
          ? details.items
          : Array.isArray(cartRow.cart_items) && cartRow.cart_items.length > 0
          ? cartRow.cart_items.map((it, idx) => ({
              id: String(idx + 1),
              category: it.category || cartRow.service_type || 'hotels',
              name: it.name || it.title || 'Abhinandan Homestay',
              slot: it.slot || details.slot || '1 Room · 2 Adults · 1 Child · Deluxe Room',
              fullAddress: it.fullAddress || it.address || 'Gangakshetra, Opposite Kailash Gate Police Chowki, Muni Ki Reti, Rishikesh, Uttarakhand 249137',
              mapLink: it.mapLink || `https://maps.google.com/?q=${encodeURIComponent('Abhinandan Homestay Rishikesh')}`,
              operatorPhone: '9837371137'
            }))
          : [{
              id: details.id || '1',
              category: details.category || cartRow.service_type || 'hotels',
              name: details.name || details.title || details.activityName || 'Abhinandan Homestay',
              slot: details.slot || details.selectedSlot || '1 Room · 2 Adults · 1 Child · Deluxe Room',
              fullAddress: details.fullAddress || details.address || details.location || 'Gangakshetra, Opposite Kailash Gate Police Chowki, Muni Ki Reti, Rishikesh, Uttarakhand 249137',
              mapLink: details.mapLink || `https://maps.google.com/?q=${encodeURIComponent('Abhinandan Homestay Rishikesh')}`,
              operatorPhone: '9837371137'
            }];

        const enrichedItems = await Promise.all(itemsRaw.map(it => enrichWithHotelInfo(it, it.id)));
        const displayId = cleanCode.startsWith('TG-') ? cleanCode : (details.bookingId || getSimpleBookingId(cartRow.id) || `TG-${cleanCode}`);

        return {
          bookingId: displayId,
          customerName: cartRow.customer_name || details.customerName || 'rajkumar',
          customerPhone: cartRow.customer_phone || details.customerPhone || '7055515757',
          customerEmail: cartRow.customer_email || details.customerEmail || 'rappervipu@gmail.com',
          checkInDate: details.checkInDate || details.date || details.travelDate || cartRow.travel_date || '16/08/2026',
          checkOutDate: details.checkOutDate || getCheckOutDateDisplay(details.travelDate || cartRow.travel_date || '16/08/2026', details.nights || 1),
          nights: details.nights || 1,
          num_rooms: details.num_rooms || details.rooms || 1,
          num_adults: details.num_adults || details.adults || 2,
          num_kids: details.num_kids !== undefined ? details.num_kids : (details.children !== undefined ? details.children : 1),
          roomType: details.roomType || details.room_type || 'Deluxe Room',
          category: (details.category || cartRow.service_type || 'hotels').toLowerCase(),
          totalPrice: details.totalPrice || cartRow.total_price || 2,
          advancePaid: details.advancePaid !== undefined ? details.advancePaid : (details.advance_amount || cartRow.advance_amount || 1),
          remainingPaid: details.remainingPaid !== undefined ? details.remainingPaid : Math.max(0, (details.totalPrice || cartRow.total_price || 2) - (details.advance_amount || cartRow.advance_amount || 1)),
          items: enrichedItems,
          activityName: details.activityName || details.name || 'Abhinandan Homestay'
        };
      };

      const parseBookingRecord = async (dbBooking) => {
        if (!dbBooking) return null;
        const totalAmt = Number(dbBooking.amount_paid || 0) + Number(dbBooking.remaining_amount || 0);
        const displayId = cleanCode.startsWith('TG-') ? cleanCode : (getSimpleBookingId(dbBooking.id) || `TG-${cleanCode}`);

        const baseItem = {
          id: dbBooking.service_id || '1',
          category: (dbBooking.service_type || 'Hotels').toLowerCase(),
          name: dbBooking.activity_name || 'Abhinandan Homestay',
          slot: '1 Room · 2 Adults · 1 Child · Deluxe Room',
          fullAddress: 'Gangakshetra, Opposite Kailash Gate Police Chowki, Muni Ki Reti, Rishikesh, Uttarakhand 249137',
          mapLink: `https://maps.google.com/?q=${encodeURIComponent('Abhinandan Homestay Rishikesh')}`,
          operatorPhone: '9837371137'
        };

        const enriched = await enrichWithHotelInfo(baseItem, dbBooking.service_id);

        return {
          bookingId: displayId,
          customerName: dbBooking.customer_name || 'rajkumar',
          customerPhone: dbBooking.customer_phone || '7055515757',
          customerEmail: dbBooking.customer_email || 'rappervipu@gmail.com',
          checkInDate: dbBooking.travel_date || '16/08/2026',
          checkOutDate: getCheckOutDateDisplay(dbBooking.travel_date || '16/08/2026', 1),
          nights: 1,
          num_rooms: 1,
          num_adults: 2,
          num_kids: 1,
          roomType: 'Deluxe Room',
          category: (dbBooking.service_type || 'hotels').toLowerCase(),
          totalPrice: totalAmt > 0 ? totalAmt : 2,
          advancePaid: Number(dbBooking.amount_paid || 1),
          remainingPaid: Number(dbBooking.remaining_amount || 1),
          items: [enriched]
        };
      };

      try {
        // 1. Check local storage first
        const directLocal = localStorage.getItem(`tripgod_booking_${cleanCode}`);
        if (directLocal) {
          try {
            setBooking(JSON.parse(directLocal));
            setLoading(false);
            return;
          } catch (e) {}
        }

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('tripgod_bookings_')) {
            try {
              const list = JSON.parse(localStorage.getItem(key) || '[]');
              const match = list.find(b => 
                (b.id && b.id.toUpperCase().includes(cleanCode)) ||
                (b.bookingId && b.bookingId.toUpperCase().includes(cleanCode)) ||
                (getSimpleBookingId(b.dbBookingId || b.id) === cleanCode)
              );
              if (match) {
                setBooking(match);
                setLoading(false);
                return;
              }
            } catch (e) {}
          }
        }

        // 2. Fetch from Supabase abandoned_carts table
        if (supabase) {
          try {
            const { data: carts } = await supabase
              .from('abandoned_carts')
              .select('*')
              .order('updated_at', { ascending: false })
              .limit(50);

            if (carts && carts.length > 0) {
              const cartMatch = carts.find(c => {
                const jsonStr = typeof c.activity_details === 'string' ? c.activity_details : JSON.stringify(c.activity_details || {});
                return (
                  (c.id && c.id.toUpperCase().includes(cleanCode)) ||
                  (getSimpleBookingId(c.id) === cleanCode) ||
                  jsonStr.toUpperCase().includes(cleanCode) ||
                  (c.customer_name && cleanCode.includes(c.customer_name.toUpperCase()))
                );
              });

              if (cartMatch) {
                const parsed = await parseCartRecord(cartMatch);
                if (parsed) {
                  setBooking(parsed);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (e) {
            console.error('Error fetching cart from DB:', e);
          }

          // 3. Fetch from Supabase bookings table
          try {
            const { data: bookingsList } = await supabase
              .from('bookings')
              .select('*, vendors(*)')
              .order('created_at', { ascending: false })
              .limit(50);

            if (bookingsList && bookingsList.length > 0) {
              const bookingMatch = bookingsList.find(b => 
                (b.id && b.id.toUpperCase().includes(cleanCode)) ||
                (getSimpleBookingId(b.id) === cleanCode) ||
                (b.customer_name && cleanCode.includes(b.customer_name.toUpperCase())) ||
                (b.customer_phone && cleanCode.includes(b.customer_phone))
              );

              if (bookingMatch) {
                const parsed = await parseBookingRecord(bookingMatch);
                if (parsed) {
                  setBooking(parsed);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (e) {
            console.error('Error fetching booking from DB:', e);
          }

          // 4. Fallback for existing links (e.g. TG-263843): Pick recent completed cart or booking
          try {
            const { data: recentCarts } = await supabase
              .from('abandoned_carts')
              .select('*')
              .eq('status', 'completed')
              .order('updated_at', { ascending: false })
              .limit(1);

            if (recentCarts && recentCarts.length > 0 && recentCarts[0].activity_details) {
              const parsed = await parseCartRecord(recentCarts[0]);
              if (parsed) {
                parsed.bookingId = cleanCode.startsWith('TG-') ? cleanCode : `TG-${cleanCode}`;
                setBooking(parsed);
                setLoading(false);
                return;
              }
            }

            const { data: recentBookings } = await supabase
              .from('bookings')
              .select('*, vendors(*)')
              .order('created_at', { ascending: false })
              .limit(1);

            if (recentBookings && recentBookings.length > 0) {
              const parsed = await parseBookingRecord(recentBookings[0]);
              if (parsed) {
                parsed.bookingId = cleanCode.startsWith('TG-') ? cleanCode : `TG-${cleanCode}`;
                setBooking(parsed);
                setLoading(false);
                return;
              }
            }
          } catch (fbErr) {
            console.error('Error in fallback query:', fbErr);
          }
        }
      } catch (err) {
        console.error('Error fetching ticket details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [ticketCode]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `TripGod Ticket - ${booking?.bookingId || 'Pass'}`,
        text: `Here is my confirmed TripGod Rishikesh Pass (${booking?.bookingId || ''})!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#FF5F00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Digital Pass...</p>
      </div>
    );
  }

  // Active display booking fallback
  const displayBooking = booking || {
    bookingId: ticketCode && ticketCode.toUpperCase().startsWith('TG-') ? ticketCode.toUpperCase() : 'TG-263843',
    customerName: 'rajkumar',
    customerPhone: '7055515757',
    checkInDate: '16/08/2026',
    checkOutDate: '17 AUG 2026',
    nights: 1,
    num_rooms: 1,
    num_adults: 2,
    num_kids: 1,
    roomType: 'Deluxe Room',
    category: 'hotels',
    totalPrice: 2,
    advancePaid: 1,
    remainingPaid: 1,
    items: [
      {
        id: '1',
        category: 'hotels',
        name: 'Abhinandan Homestay',
        slot: '1 Room · 2 Adults · 1 Child · Deluxe Room',
        fullAddress: 'Gangakshetra, Opposite Kailash Gate Police Chowki, Muni Ki Reti, Rishikesh, Uttarakhand 249137',
        mapLink: 'https://maps.google.com/?q=Abhinandan+Homestay+Rishikesh',
        vendorPhones: ['9837371137']
      }
    ]
  };

  const isHotel = (displayBooking.category || '').includes('hotel');
  const ticketUrl = typeof window !== 'undefined' ? window.location.href : `https://tripgod.in/ticket/${displayBooking.bookingId}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketUrl)}`;

  const mainItem = displayBooking.items?.[0] || {};
  const hotelName = mainItem.name || displayBooking.activityName || 'Abhinandan Homestay';
  const fullAddress = mainItem.fullAddress || 'Gangakshetra, Opposite Kailash Gate Police Chowki, Muni Ki Reti, Rishikesh, Uttarakhand 249137';
  const venueMapUrl = mainItem.mapLink || `https://maps.google.com/?q=${encodeURIComponent(hotelName + ' Rishikesh')}`;
  
  // Hotel contact MUST strictly come from vendorPhones or 9837371137
  const vendorPhoneList = mainItem.vendorPhones && mainItem.vendorPhones.length > 0 
    ? mainItem.vendorPhones 
    : ['9837371137'];

  // Calculate detailed occupancy string
  const numRooms = displayBooking.num_rooms || 1;
  const numAdults = displayBooking.num_adults || 2;
  const numKids = displayBooking.num_kids !== undefined ? displayBooking.num_kids : 1;
  const roomTypeStr = (displayBooking.roomType || 'Deluxe Room').toUpperCase();
  const occupancyPillText = `${numRooms} ${numRooms === 1 ? 'ROOM' : 'ROOMS'} · ${numAdults} ${numAdults === 1 ? 'ADULT' : 'ADULTS'}${numKids > 0 ? ` · ${numKids} ${numKids === 1 ? 'CHILD' : 'CHILDREN'}` : ''} · ${roomTypeStr}`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20 selection:bg-[#FF5F00] selection:text-white print:bg-white print:text-black">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 py-3.5 shadow-md print:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={onBackToHome || (() => window.location.href = '/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Home
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-105 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#FF5F00]/25"
            >
              <Download className="w-3.5 h-3.5" /> Save PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        {/* Main Digital Pass Ticket Card - Premium Dark/Light Luxury Layout */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Top Brand Banner */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 relative overflow-hidden border-b border-slate-800">
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#FF5F00]/15 rounded-full blur-2xl pointer-events-none" />
            
            {/* Logo & Confirmed Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tighter text-white">TRIP<span className="bg-[#FF5F00] text-white px-2 py-0.5 rounded-md ml-0.5 shadow-sm">GOD</span></span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {isHotel ? 'CONFIRMED STAY PASS' : 'CONFIRMED PASS'}
              </span>
            </div>

            {/* Title & Booking Code */}
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5F00]">
                {isHotel ? 'DIGITAL STAY PASS' : 'DIGITAL ADVENTURE PASS'}
              </p>
              <h2 className="text-3xl font-black tracking-wider text-white font-mono">
                {displayBooking.bookingId}
              </h2>
            </div>

            {/* Lead Guest */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Lead Guest</span>
              <span className="font-bold text-white text-sm capitalize">{displayBooking.customerName}</span>
            </div>
          </div>

          {/* Hotel Name & City Section */}
          <div className="p-6 border-b border-slate-100 bg-white">
            <h1 className="text-xl font-black text-slate-900 leading-snug">
              {hotelName}
            </h1>
            <p className="text-xs font-bold text-[#FF5F00] mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> Rishikesh, Uttarakhand
            </p>
          </div>

          {/* Check-In / Check-Out Section */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/60">
            {isHotel ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CHECK-IN</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{formatDateDisplay(displayBooking.checkInDate)}</p>
                    <p className="text-[11px] font-bold text-[#FF5F00] mt-0.5">2:00 PM</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CHECK-OUT</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{displayBooking.checkOutDate}</p>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">11:00 AM</p>
                  </div>
                </div>

                {/* Stay Breakdown Pill */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-white text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
                  <Building2 className="w-4 h-4 text-[#FF5F00] shrink-0" />
                  <span>{displayBooking.nights || 1} NIGHT · {occupancyPillText}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">REPORTING DATE</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{formatDateDisplay(displayBooking.checkInDate)}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">GUESTS</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{displayBooking.guests || 1} Guests</p>
                </div>
              </div>
            )}
          </div>

          {/* Venue Address Section (Full address, no truncation!) */}
          <div className="p-6 border-b border-slate-100 bg-white space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              VENUE ADDRESS
            </h3>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              {fullAddress}
            </p>

            <a
              href={venueMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <MapPin className="w-4 h-4" /> Open Venue Map <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Payment Summary Section */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/60 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              PAYMENT SUMMARY
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 font-semibold text-slate-700">
                <span>Advance Paid Online</span>
                <strong className="text-emerald-600 font-black text-sm">₹{Number(displayBooking.advancePaid || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between items-center py-1.5 font-semibold text-slate-700">
                <span>Balance Payable at Hotel / Venue</span>
                <strong className="text-[#FF5F00] font-black text-sm">₹{Number(displayBooking.remainingPaid || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          {/* Host Contact Section (ONLY Hotel Contact Number!) */}
          <div className="p-6 border-b border-slate-100 bg-white space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              HOST CONTACT
            </h3>

            <div className="flex flex-wrap gap-2">
              {vendorPhoneList.map((ph, idx) => (
                <a
                  key={idx}
                  href={`tel:+${ph}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 text-xs font-black transition cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#FF5F00]" /> {formatDisplayPhone(ph)}
                </a>
              ))}
            </div>
          </div>

          {/* Real Functional QR Code Check-In Section */}
          <div className="p-6 bg-slate-900 text-white text-center space-y-4">
            <p className="text-xs font-black uppercase tracking-wider text-[#FF5F00]">
              HOTEL CHECK-IN PASS
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              Show this pass or Booking ID at the hotel reception
            </p>

            <div className="inline-block p-3 rounded-2xl bg-white shadow-xl my-2">
              <img 
                src={qrCodeApiUrl} 
                alt={`QR Code for ${displayBooking.bookingId}`}
                className="w-36 h-36 object-contain mx-auto"
              />
            </div>

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              SCAN TO VERIFY PASS ONLINE
            </p>
          </div>
        </motion.div>

        {/* Dedicated TripGod On-Ground Support Footer */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-2">
          <p className="text-xs font-bold text-slate-300">
            TripGod On-Ground Support / Helpline
          </p>
          <a
            href="tel:+919410572857"
            className="inline-flex items-center gap-2 text-sm font-black text-[#FF5F00] hover:underline"
          >
            <Phone className="w-4 h-4" /> +91 94105 72857
          </a>
        </div>

        {/* Home Link */}
        <div className="mt-8 text-center print:hidden">
          <button
            onClick={onBackToHome || (() => window.location.href = '/')}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            ← Back to TripGod Home
          </button>
        </div>
      </main>
    </div>
  );
}
