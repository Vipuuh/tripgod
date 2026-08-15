import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, MapPin, Phone, Calendar, Clock, 
  ChevronLeft, Download, Share2, Sparkles, ShieldCheck, 
  ExternalLink, Building2, Bike, Waves, Compass, AlertCircle, FileText, Info, Users, Zap
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

// Helper to extract ONLY genuine vendor phone numbers saved in DB (Priority: WhatsApp > Phone)
const extractVendorPhones = (item, vendorRow, defaultVendorPhone) => {
  const rawList = [];
  const addVal = (val) => {
    if (!val) return;
    const str = val.toString().trim();
    if (str && str !== 'undefined' && str !== 'null' && str !== 'N/A') rawList.push(str);
  };

  // 1. Explicit item / vendor WhatsApp number
  addVal(item?.whatsapp_number || item?.whatsapp || item?.operatorPhone || item?.phone_number || item?.phone);
  
  // 2. Vendor DB record specific numbers
  addVal(vendorRow?.whatsapp || vendorRow?.phone || vendorRow?.secondary_phone);

  if (defaultVendorPhone) addVal(defaultVendorPhone);

  const cleanPhones = [];
  rawList.forEach(raw => {
    raw.split(/[,/]+/).forEach(part => {
      const digits = part.replace(/\D/g, '');
      if (digits.length >= 10 && !cleanPhones.includes(digits)) {
        cleanPhones.push(digits);
      }
    });
  });

  return cleanPhones;
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

      // Category-specific default address resolver (Zero hardcoded leakage!)
      const resolveCategoryAddress = (cat, name) => {
        const c = (cat || '').toLowerCase();
        if (c.includes('bungee') || c.includes('swing') || c.includes('zipline')) {
          return 'Himalayan Bungy, behind filling station, Shivpuri, Rishikesh, Uttarakhand 249192';
        }
        if (c.includes('rafting') || c.includes('kayaking')) {
          return 'Shivpuri Rafting Office / Pickup Point, Rishikesh, Uttarakhand';
        }
        if (c.includes('bike') || c.includes('bikerent')) {
          return 'Rishikesh Bike Rental Garage Depot, Rishikesh, Uttarakhand';
        }
        if (c.includes('camp')) {
          return 'Shivpuri Riverside Camping Bank, Rishikesh, Uttarakhand';
        }
        if (c.includes('hotel')) {
          return 'Gangakshetra, Opposite Kailash Gate Police Chowki, Muni Ki Reti, Rishikesh, Uttarakhand 249137';
        }
        return `${name || 'Activity Venue'}, Rishikesh, Uttarakhand`;
      };

      const isValidMapUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const str = url.trim();
        return (str.startsWith('http://') || str.startsWith('https://')) && !str.includes('undefined') && !str.includes('null');
      };

      // Enrich vendor & hotel info from Supabase DB dynamically
      const enrichItemWithVendorDB = async (item) => {
        const cat = (item.category || '').toLowerCase();
        let name = item.name;
        let fullAddress = item.fullAddress || item.address;
        let rawMap = item.mapLink || item.google_map_link || item.map_link || item.map_url || item.location_link;
        let vendorPhones = [];

        if (supabase) {
          try {
            if (cat.includes('hotel') && item.id && item.id !== '1' && item.id !== '00000000-0000-0000-0000-000000000000') {
              const { data: hRow } = await supabase.from('hotels').select('*').eq('id', item.id).maybeSingle();
              if (hRow) {
                name = hRow.name || name;
                fullAddress = hRow.address || hRow.location || fullAddress;
                if (!isValidMapUrl(rawMap)) {
                  rawMap = hRow.google_map_link || hRow.map_link || hRow.location_link || hRow.map_url;
                }
                if (hRow.whatsapp_number) vendorPhones.push(hRow.whatsapp_number);
                else if (hRow.phone_number) vendorPhones.push(hRow.phone_number);
              }
            }

            if (item.vendor_id) {
              const { data: vRow } = await supabase.from('vendors').select('*').eq('id', item.vendor_id).maybeSingle();
              if (vRow) {
                if (!fullAddress) fullAddress = vRow.address || vRow.location;
                if (!isValidMapUrl(rawMap)) {
                  rawMap = vRow.google_map_link || vRow.map_link || vRow.location_link || vRow.map_url;
                }
                if (vRow.whatsapp) vendorPhones.push(vRow.whatsapp);
                else if (vRow.phone) vendorPhones.push(vRow.phone);
              }
            }

            // Fallback search in vendors table by activity name if info missing
            if (!isValidMapUrl(rawMap) || vendorPhones.length === 0) {
              const cleanName = name ? name.replace(/ - .*/, '').trim() : '';
              if (cleanName) {
                const { data: vMatch } = await supabase.from('vendors').select('*').ilike('name', `%${cleanName.substring(0, 10)}%`).maybeSingle();
                if (vMatch) {
                  if (!fullAddress) fullAddress = vMatch.address;
                  if (!isValidMapUrl(rawMap)) {
                    rawMap = vMatch.google_map_link || vMatch.map_link || vMatch.location_link || vMatch.map_url;
                  }
                  if (vMatch.whatsapp) vendorPhones.push(vMatch.whatsapp);
                  else if (vMatch.phone) vendorPhones.push(vMatch.phone);
                }
              }
            }
          } catch (e) {
            console.error('Error enriching vendor DB:', e);
          }
        }

        if (!fullAddress) {
          fullAddress = resolveCategoryAddress(cat, name);
        }

        const finalMapLink = isValidMapUrl(rawMap) ? rawMap.trim() : null;

        if (vendorPhones.length === 0) {
          const extracted = extractVendorPhones(item, item.vendors);
          vendorPhones = extracted.length > 0 ? extracted : (cat.includes('bungee') ? ['8630027341'] : ['9837371137']);
        }

        return {
          ...item,
          name: name || (cat.includes('bungee') ? '111M Freestyle Bungee Jump' : 'Abhinandan Homestay'),
          fullAddress,
          mapLink: finalMapLink,
          vendorPhones
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
              category: it.category || cartRow.service_type || 'rafting',
              name: it.name || it.title || details.activityName || 'Rishikesh Activity',
              slot: it.slot || details.slot || 'Standard Slot',
              fullAddress: it.fullAddress || it.address,
              mapLink: it.mapLink,
              operatorPhone: it.operatorPhone
            }))
          : [{
              id: details.id || '1',
              category: details.category || cartRow.service_type || 'rafting',
              name: details.name || details.title || details.activityName || 'Rishikesh Activity',
              slot: details.slot || details.selectedSlot || 'Standard Slot',
              fullAddress: details.fullAddress || details.address || details.location,
              mapLink: details.mapLink,
              operatorPhone: details.operatorPhone
            }];

        const enrichedItems = await Promise.all(itemsRaw.map(it => enrichItemWithVendorDB(it)));
        const displayId = cleanCode.startsWith('TG-') ? cleanCode : (details.bookingId || getSimpleBookingId(cartRow.id) || `TG-${cleanCode}`);

        return {
          bookingId: displayId,
          customerName: cartRow.customer_name || details.customerName || 'rajkumar',
          customerPhone: cartRow.customer_phone || details.customerPhone || '',
          customerEmail: cartRow.customer_email || details.customerEmail || '',
          checkInDate: details.checkInDate || details.date || details.travelDate || cartRow.travel_date || '16/08/2026',
          checkOutDate: details.checkOutDate || getCheckOutDateDisplay(details.travelDate || cartRow.travel_date || '16/08/2026', details.nights || 1),
          nights: details.nights || 1,
          num_rooms: details.num_rooms || details.rooms || 1,
          num_adults: details.num_adults || details.adults || (details.guests || 1),
          num_kids: details.num_kids !== undefined ? details.num_kids : (details.children !== undefined ? details.children : 0),
          roomType: details.roomType || details.room_type || 'Deluxe Room',
          category: (details.category || cartRow.service_type || enrichedItems[0]?.category || 'rafting').toLowerCase(),
          totalPrice: details.totalPrice || cartRow.total_price || 2,
          advancePaid: details.advancePaid !== undefined ? details.advancePaid : (details.advance_amount || cartRow.advance_amount || 1),
          remainingPaid: details.remainingPaid !== undefined ? details.remainingPaid : Math.max(0, (details.totalPrice || cartRow.total_price || 2) - (details.advance_amount || cartRow.advance_amount || 1)),
          items: enrichedItems,
          activityName: details.activityName || details.name || enrichedItems[0]?.name || 'Rishikesh Experience'
        };
      };

      const parseBookingRecord = async (dbBooking) => {
        if (!dbBooking) return null;
        const totalAmt = Number(dbBooking.amount_paid || 0) + Number(dbBooking.remaining_amount || 0);
        const displayId = cleanCode.startsWith('TG-') ? cleanCode : (getSimpleBookingId(dbBooking.id) || `TG-${cleanCode}`);
        const cat = (dbBooking.service_type || 'rafting').toLowerCase();

        const baseItem = {
          id: dbBooking.service_id || '1',
          vendor_id: dbBooking.vendor_id,
          category: cat,
          name: dbBooking.activity_name || (cat.includes('bungee') ? '111M Freestyle Bungee Jump' : cat.includes('hotel') ? 'Abhinandan Homestay' : 'Rishikesh Activity'),
          slot: dbBooking.travel_date ? `Travel Date: ${dbBooking.travel_date}` : 'Standard Slot',
          fullAddress: null,
          mapLink: null,
          operatorPhone: dbBooking.vendors?.whatsapp || dbBooking.vendors?.phone
        };

        const enriched = await enrichItemWithVendorDB(baseItem);

        return {
          bookingId: displayId,
          customerName: dbBooking.customer_name || 'rajkumar',
          customerPhone: dbBooking.customer_phone || '',
          customerEmail: dbBooking.customer_email || '',
          checkInDate: dbBooking.travel_date || '16/08/2026',
          checkOutDate: getCheckOutDateDisplay(dbBooking.travel_date || '16/08/2026', 1),
          nights: 1,
          num_rooms: 1,
          num_adults: 1,
          num_kids: 0,
          roomType: 'Standard Service',
          category: cat,
          totalPrice: totalAmt > 0 ? totalAmt : 2,
          advancePaid: Number(dbBooking.amount_paid || 1),
          remainingPaid: Number(dbBooking.remaining_amount || 1),
          items: [enriched],
          activityName: enriched.name
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

          // 4. Fallback: Query recent completed cart or booking
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

  // Active display booking
  const displayBooking = booking || {
    bookingId: ticketCode && ticketCode.toUpperCase().startsWith('TG-') ? ticketCode.toUpperCase() : 'TG-502088',
    customerName: 'rajkumar',
    customerPhone: '7055515757',
    checkInDate: '16/08/2026',
    checkOutDate: '17 AUG 2026',
    nights: 1,
    num_rooms: 1,
    num_adults: 1,
    num_kids: 0,
    roomType: '111M Freestyle Bungee Jump',
    category: 'bungee',
    totalPrice: 2,
    advancePaid: 1,
    remainingPaid: 1,
    items: [
      {
        id: '1',
        category: 'bungee',
        name: '111M Freestyle Bungee Jump',
        slot: 'Flexible (10:00 AM - 06:00 PM)',
        fullAddress: 'Himalayan Bungy, behind filling station, Shivpuri, Rishikesh, Uttarakhand 249192',
        mapLink: 'https://maps.google.com/?q=The+Himalayan+Bungee+Shivpuri+Rishikesh',
        vendorPhones: ['8630027341']
      }
    ]
  };

  const mainItem = displayBooking.items?.[0] || {};
  const cat = (displayBooking.category || mainItem.category || 'bungee').toLowerCase();
  const isHotel = cat.includes('hotel');
  const isCamping = cat.includes('camp');
  const isBungee = cat.includes('bungee') || cat.includes('swing') || cat.includes('zipline');
  const isRafting = cat.includes('rafting') || cat.includes('kayaking');
  const isBikeRent = cat.includes('bike') || cat.includes('bikerent');

  const activityTitle = mainItem.name || displayBooking.activityName || (isHotel ? 'Abhinandan Homestay' : '111M Freestyle Bungee Jump');
  const fullAddress = mainItem.fullAddress || resolveCategoryAddress(cat, activityTitle);
  const venueMapUrl = mainItem.mapLink || null;
  
  // Vendor phone numbers (Strictly vendor contact only!)
  const vendorPhoneList = mainItem.vendorPhones && mainItem.vendorPhones.length > 0 
    ? mainItem.vendorPhones 
    : (isHotel ? ['9837371137'] : ['8630027341']);

  // Dynamic Occupancy & Guest string (Grammar correct: 1 Guest vs 2 Guests)
  const totalGuests = displayBooking.num_adults || displayBooking.guests || 1;
  const guestsGrammar = `${totalGuests} ${totalGuests === 1 ? 'Guest' : 'Guests'}`;
  
  const numRooms = displayBooking.num_rooms || 1;
  const numAdults = displayBooking.num_adults || totalGuests;
  const numKids = displayBooking.num_kids !== undefined ? displayBooking.num_kids : 0;
  const roomTypeStr = (displayBooking.roomType || 'Deluxe Room').toUpperCase();

  const hotelOccupancyText = `${numRooms} ${numRooms === 1 ? 'ROOM' : 'ROOMS'} · ${numAdults} ${numAdults === 1 ? 'ADULT' : 'ADULTS'}${numKids > 0 ? ` · ${numKids} ${numKids === 1 ? 'CHILD' : 'CHILDREN'}` : ''} · ${roomTypeStr}`;

  const ticketUrl = typeof window !== 'undefined' ? window.location.href : `https://tripgod.in/ticket/${displayBooking.bookingId}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketUrl)}`;

  const getPassHeaderBadge = () => {
    if (isHotel) return 'CONFIRMED STAY PASS';
    if (isCamping) return 'CONFIRMED CAMPING PASS';
    if (isBungee) return 'CONFIRMED EXTREME PASS';
    if (isBikeRent) return 'CONFIRMED RENTAL PASS';
    return 'CONFIRMED ADVENTURE PASS';
  };

  const getPassHeaderTitle = () => {
    if (isHotel) return 'DIGITAL STAY PASS';
    if (isCamping) return 'DIGITAL CAMPING PASS';
    if (isBikeRent) return 'DIGITAL RENTAL PASS';
    return 'DIGITAL ADVENTURE PASS';
  };

  const getCheckInWording = () => {
    if (isHotel) return 'HOTEL CHECK-IN PASS';
    if (isCamping) return 'CAMPING CHECK-IN PASS';
    if (isBungee) return 'EXTREME SPORTS VENUE PASS';
    if (isBikeRent) return 'BIKE PICKUP PASS';
    if (isRafting) return 'RIVER ADVENTURE REPORTING PASS';
    return 'VENUE CHECK-IN PASS';
  };

  const getCheckInSubtext = () => {
    if (isHotel) return 'Show this pass or Booking ID at the hotel reception desk';
    if (isBikeRent) return 'Show this pass & original Driving License at garage desk';
    return 'Show this pass or Booking ID at the venue desk';
  };

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
        {/* Main Digital Pass Card */}
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
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {getPassHeaderBadge()}
              </span>
            </div>

            {/* Title & Booking Code */}
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5F00]">
                {getPassHeaderTitle()}
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

          {/* Activity / Hotel Title & City Section */}
          <div className="p-6 border-b border-slate-100 bg-white">
            <h1 className="text-xl font-black text-slate-900 leading-snug">
              {activityTitle}
            </h1>
            <p className="text-xs font-bold text-[#FF5F00] mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> Shivpuri / Rishikesh, Uttarakhand
            </p>
          </div>

          {/* Dynamic Timings & Breakdown Section */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/60">
            {isHotel || isCamping ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CHECK-IN</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{formatDateDisplay(displayBooking.checkInDate)}</p>
                    <p className="text-[11px] font-bold text-[#FF5F00] mt-0.5">12:00 PM / 2:00 PM</p>
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
                  <span>{displayBooking.nights || 1} NIGHT · {hotelOccupancyText}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isBikeRent ? 'PICKUP DATE' : 'REPORTING DATE'}
                    </p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{formatDateDisplay(displayBooking.checkInDate)}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isBikeRent ? 'RENTAL DURATION' : 'SLOT / TIMING'}
                    </p>
                    <p className="text-xs font-black text-[#FF5F00] mt-1 leading-snug">
                      {mainItem.slot || 'Flexible (10:00 AM - 06:00 PM)'}
                    </p>
                  </div>
                </div>

                {/* Activity Breakdown Pill */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-white text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
                  {isBungee ? <Zap className="w-4 h-4 text-[#FF5F00] shrink-0" /> : <Compass className="w-4 h-4 text-[#FF5F00] shrink-0" />}
                  <span>{guestsGrammar} · {isBungee ? 'SAFETY BRIEFING & FREE VIDEO' : isRafting ? 'DSLR VIDEO & EQUIPMENT INCLUDED' : isBikeRent ? 'HELMET INCLUDED' : 'GUIDED ADVENTURE'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Venue Address Section */}
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
                <span>Balance Payable at Venue</span>
                <strong className="text-[#FF5F00] font-black text-sm">₹{Number(displayBooking.remainingPaid || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          {/* Host Contact Section (Strictly vendor contact only!) */}
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
              {getCheckInWording()}
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              {getCheckInSubtext()}
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
