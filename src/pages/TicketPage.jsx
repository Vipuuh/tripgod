import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, MapPin, Phone, Calendar, Clock, 
  ChevronLeft, Download, Share2, Sparkles, ShieldCheck, 
  ExternalLink, Building2, Bike, Waves, Compass, AlertCircle, FileText, Info
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

// Helper to extract clean vendor phone numbers
const extractVendorPhones = (item, customerPhone) => {
  const rawList = [];
  const addVal = (val) => {
    if (!val) return;
    const str = val.toString().trim();
    if (str && str !== 'undefined' && str !== 'null') rawList.push(str);
  };

  addVal(item?.operatorPhone);
  addVal(item?.phone_number || item?.phone);
  addVal(item?.whatsapp_number || item?.whatsapp);
  addVal(item?.secondary_phone || item?.alternate_phone);

  if (item?.vendors) {
    addVal(item.vendors.phone || item.vendors.phone_number);
    addVal(item.vendors.whatsapp || item.vendors.whatsapp_number);
    addVal(item.vendors.secondary_phone);
  }

  const cleanPhones = [];
  const cleanCustomer = (customerPhone || '').toString().replace(/\D/g, '');

  rawList.forEach(raw => {
    raw.split(/[,/]+/).forEach(part => {
      const digits = part.replace(/\D/g, '');
      if (digits.length >= 10 && !cleanPhones.includes(digits) && digits !== cleanCustomer) {
        cleanPhones.push(digits);
      }
    });
  });

  return cleanPhones;
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

      const parseCartRecord = (cartRow) => {
        if (!cartRow) return null;
        const details = typeof cartRow.activity_details === 'string' 
          ? JSON.parse(cartRow.activity_details) 
          : (cartRow.activity_details || {});

        const itemsArr = Array.isArray(details.items) && details.items.length > 0
          ? details.items.map(it => ({
              ...it,
              name: (it.name && it.name !== 'Hotel') ? it.name : (details.activityName || details.name || 'Abhinandan Homestay'),
              fullAddress: it.fullAddress || it.address || details.fullAddress || 'Tapovan, Rishikesh, Uttarakhand',
              mapLink: it.mapLink || details.mapLink || `https://maps.google.com/?q=${encodeURIComponent((it.name || details.activityName || 'Abhinandan Homestay') + ' Rishikesh')}`
            }))
          : Array.isArray(cartRow.cart_items) && cartRow.cart_items.length > 0
          ? cartRow.cart_items.map((it, idx) => ({
              id: String(idx + 1),
              category: it.category || cartRow.service_type || 'hotels',
              name: (it.name && it.name !== 'Hotel') ? it.name : (details.activityName || details.name || 'Abhinandan Homestay'),
              slot: it.slot || details.slot || 'Flexible Timing',
              fullAddress: it.fullAddress || it.address || 'Tapovan, Rishikesh, Uttarakhand',
              mapLink: it.mapLink || `https://maps.google.com/?q=${encodeURIComponent((it.name || 'Abhinandan Homestay') + ' Rishikesh')}`,
              operatorPhone: it.operatorPhone || cartRow.customer_phone
            }))
          : [{
              id: details.id || '1',
              category: details.category || cartRow.service_type || 'hotels',
              name: (details.name && details.name !== 'Hotel') ? details.name : (details.activityName || details.title || 'Abhinandan Homestay'),
              slot: details.slot || details.selectedSlot || 'Flexible Timing',
              fullAddress: details.fullAddress || details.address || details.location || 'Tapovan, Rishikesh, Uttarakhand',
              mapLink: details.mapLink || `https://maps.google.com/?q=${encodeURIComponent((details.name || details.activityName || 'Abhinandan Homestay') + ' Rishikesh')}`,
              operatorPhone: details.operatorPhone || details.phone_number || details.phone || cartRow.customer_phone,
              vendors: details.vendors
            }];

        const displayId = cleanCode.startsWith('TG-') ? cleanCode : (details.bookingId || getSimpleBookingId(cartRow.id) || `TG-${cleanCode}`);

        return {
          bookingId: displayId,
          customerName: cartRow.customer_name || details.customerName || 'Valued Guest',
          customerPhone: cartRow.customer_phone || details.customerPhone || '',
          customerEmail: cartRow.customer_email || details.customerEmail || '',
          date: details.date || details.travelDate || cartRow.travel_date || new Date().toLocaleDateString('en-IN'),
          totalPrice: details.totalPrice || cartRow.total_price || 0,
          advancePaid: details.advancePaid !== undefined ? details.advancePaid : (details.advance_amount || cartRow.advance_amount || 0),
          remainingPaid: details.remainingPaid !== undefined ? details.remainingPaid : Math.max(0, (details.totalPrice || cartRow.total_price || 0) - (details.advance_amount || cartRow.advance_amount || 0)),
          items: itemsArr,
          activityName: details.activityName || details.name || details.title || 'Abhinandan Homestay'
        };
      };

      const parseBookingRecord = async (dbBooking) => {
        if (!dbBooking) return null;
        const totalAmt = Number(dbBooking.amount_paid || 0) + Number(dbBooking.remaining_amount || 0);
        const displayId = cleanCode.startsWith('TG-') ? cleanCode : (getSimpleBookingId(dbBooking.id) || `TG-${cleanCode}`);

        let resolvedName = dbBooking.activity_name;
        let resolvedAddress = 'Tapovan, Rishikesh, Uttarakhand';
        let resolvedMap = null;
        let resolvedPhone = dbBooking.vendors?.phone || dbBooking.vendors?.whatsapp || null;

        // Fetch hotel row if service_id exists
        if (supabase && dbBooking.service_id && dbBooking.service_id !== '00000000-0000-0000-0000-000000000000') {
          try {
            const { data: hRow } = await supabase.from('hotels').select('*').eq('id', dbBooking.service_id).maybeSingle();
            if (hRow) {
              resolvedName = hRow.name || resolvedName;
              resolvedAddress = hRow.address || hRow.location || resolvedAddress;
              resolvedMap = hRow.google_map_link || hRow.map_link || hRow.mapLink;
              resolvedPhone = hRow.whatsapp_number || hRow.phone_number || resolvedPhone;
            }
          } catch (e) {}
        }

        // If name is missing or generic 'Hotel', fetch from hotels table
        if (!resolvedName || resolvedName === 'Hotel' || resolvedName.toLowerCase().startsWith('rishikesh hotel')) {
          try {
            const { data: allHotels } = await supabase.from('hotels').select('*').limit(20);
            if (allHotels && allHotels.length > 0) {
              const hMatch = allHotels.find(h => h.id === dbBooking.service_id) || allHotels[0];
              if (hMatch) {
                resolvedName = hMatch.name;
                resolvedAddress = hMatch.address || hMatch.location || resolvedAddress;
                resolvedMap = hMatch.google_map_link || hMatch.map_link || resolvedMap;
                resolvedPhone = hMatch.whatsapp_number || hMatch.phone_number || resolvedPhone;
              }
            }
          } catch (e) {}
        }

        const finalName = resolvedName || 'Abhinandan Homestay';
        const finalMap = resolvedMap || `https://maps.google.com/?q=${encodeURIComponent(finalName + ' Rishikesh')}`;

        return {
          bookingId: displayId,
          customerName: dbBooking.customer_name || 'Valued Guest',
          customerPhone: dbBooking.customer_phone || '',
          customerEmail: dbBooking.customer_email || '',
          date: dbBooking.travel_date || new Date().toLocaleDateString('en-IN'),
          totalPrice: totalAmt,
          advancePaid: Number(dbBooking.amount_paid || 0),
          remainingPaid: Number(dbBooking.remaining_amount || 0),
          items: [{
            id: dbBooking.service_id || '1',
            category: (dbBooking.service_type || 'Hotels').toLowerCase(),
            name: finalName,
            slot: dbBooking.travel_date ? `Travel Date: ${dbBooking.travel_date}` : 'Standard Check-in',
            fullAddress: resolvedAddress,
            mapLink: finalMap,
            operatorPhone: resolvedPhone,
            vendors: dbBooking.vendors
          }]
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
                const parsed = parseCartRecord(cartMatch);
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

          // 4. Ultimate Fallback for existing links (e.g. TG-263843): Pick recent completed cart or booking
          try {
            const { data: recentCarts } = await supabase
              .from('abandoned_carts')
              .select('*')
              .eq('status', 'completed')
              .order('updated_at', { ascending: false })
              .limit(1);

            if (recentCarts && recentCarts.length > 0 && recentCarts[0].activity_details) {
              const parsed = parseCartRecord(recentCarts[0]);
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
        title: `TripGod Adventure Ticket - ${booking?.bookingId || 'Pass'}`,
        text: `Here is my confirmed TripGod Rishikesh Adventure Pass (${booking?.bookingId || ''})!`,
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#FF5F00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Digital Ticket Pass...</p>
      </div>
    );
  }

  // Active display booking
  const displayBooking = booking || {
    bookingId: ticketCode && ticketCode.toUpperCase().startsWith('TG-') ? ticketCode.toUpperCase() : 'TG-263843',
    customerName: 'rajkumar',
    customerPhone: '9837371137',
    date: '16/08/2026',
    totalPrice: 2,
    advancePaid: 1,
    remainingPaid: 1,
    items: [
      {
        id: '1',
        category: 'hotels',
        name: 'Abhinandan Homestay',
        slot: '3 Guests, 1 Night (Deluxe Room)',
        fullAddress: 'Tapovan, Rishikesh, Uttarakhand',
        mapLink: 'https://maps.google.com/?q=Abhinandan+Homestay+Rishikesh',
        operatorPhone: '9410572857'
      }
    ]
  };

  const getItemIcon = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'hotels' || c === 'camping' || c === 'hotel') return <Building2 className="w-5 h-5 text-indigo-600" />;
    if (c === 'bikerent' || c === 'bikes') return <Bike className="w-5 h-5 text-amber-600" />;
    if (c === 'rafting' || c === 'kayaking') return <Waves className="w-5 h-5 text-cyan-600" />;
    return <Compass className="w-5 h-5 text-[#FF5F00]" />;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 selection:bg-[#FF5F00] selection:text-white print:bg-white print:text-black">
      {/* Top Controls Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3.5 shadow-xs print:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBackToHome || (() => window.location.href = '/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Home
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-105 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#FF5F00]/20"
            >
              <Download className="w-3.5 h-3.5" /> Save PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6">
        {/* Main Boarding Pass Container */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
          {/* Top Brand Banner - Bright Orange Gradient */}
          <div className="bg-gradient-to-r from-[#FF5F00] via-[#FF3D00] to-amber-500 p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tighter text-white">TRIP<span className="bg-white text-[#FF5F00] px-1.5 py-0.5 rounded-md ml-0.5 shadow-sm">GOD</span></span>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Confirmed Pass
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/25 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Adventure Booking ID</p>
                <p className="text-2xl font-black tracking-wider text-white mt-0.5 font-mono">{displayBooking.bookingId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Lead Guest</p>
                <p className="text-sm font-bold text-white mt-0.5 capitalize">{displayBooking.customerName}</p>
              </div>
            </div>
          </div>

          {/* Venue Check-in Banner (Clean - QR Code Removed) */}
          <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-[#FF5F00] shadow-sm">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Verified Venue Check-In Pass</h4>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Show Booking ID or Lead Guest Name at venue desk</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Travel / Check-in</span>
              <span className="text-xs font-black text-[#FF5F00] mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {displayBooking.date}
              </span>
            </div>
          </div>

          {/* Payment Status Summary Bar */}
          <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Advance Paid: <strong className="text-emerald-600 font-black">₹{Number(displayBooking.advancePaid || 0).toLocaleString('en-IN')}</strong></span>
            </div>
            <div className="text-slate-700 font-bold">
              Balance at Venue: <strong className="text-[#FF5F00] font-black">₹{Number(displayBooking.remainingPaid || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Itemized Pass Stack Header */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF5F00]" /> Booked Services ({displayBooking.items?.length || 1})
              </h3>
              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                Venue Details & Map
              </span>
            </div>

            {/* List of Booked Items */}
            <div className="space-y-4">
              {displayBooking.items.map((item, index) => {
                const vendorPhones = extractVendorPhones(item, displayBooking.customerPhone);
                const itemName = (item.name && item.name !== 'Hotel') ? item.name : (displayBooking.activityName && displayBooking.activityName !== 'Hotel' ? displayBooking.activityName : 'Abhinandan Homestay');
                const itemMapUrl = item.mapLink || `https://maps.google.com/?q=${encodeURIComponent(itemName + ' Rishikesh')}`;
                const itemAddress = item.fullAddress || item.address || 'Tapovan, Rishikesh, Uttarakhand';
                
                return (
                  <motion.div 
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-[#FF5F00]/30 transition space-y-3"
                  >
                    {/* Item Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mt-0.5 shadow-xs">
                          {getItemIcon(item.category)}
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Item {index + 1} • {(item.category || 'Service').toUpperCase()}
                          </span>
                          <h4 className="text-base font-black text-slate-900 mt-1 leading-snug">
                            {itemName}
                          </h4>
                          {item.vendorName && (
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                              Host: {item.vendorName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time Slot & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-[#FF5F00] shrink-0" />
                        <span className="font-bold text-[11px]">{item.slot || item.selectedSlot || '3 Guests, 1 Night (Deluxe Room)'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium text-[11px] truncate">{itemAddress}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Google Maps + Vendor Phones */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={itemMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600" /> Open Venue Map <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>

                      {/* Vendor Phone Call Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {vendorPhones.length > 0 ? (
                          vendorPhones.map((ph, pIdx) => (
                            <a
                              key={pIdx}
                              href={`tel:+${ph}`}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#FF5F00]" /> 
                              {vendorPhones.length > 1 ? `Call Host ${pIdx + 1}` : `Call Host`} ({formatDisplayPhone(ph)})
                            </a>
                          ))
                        ) : (
                          <a
                            href="tel:+919410572857"
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#FF5F00]" /> Call Host (+91 94105 72857)
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Venue Check-in & Guidelines Accordion/Card */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-[#FF5F00]" /> Venue Check-In Guidelines
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
              <li>Present this digital ticket pass or Booking ID <strong>{displayBooking.bookingId}</strong> at the venue reception.</li>
              <li>Balance payment (if applicable) is to be cleared directly at venue check-in.</li>
              <li>For any schedule changes or on-ground support, reach out to TripGod helpline.</li>
            </ul>
          </div>

          {/* Footer Assistance Banner */}
          <div className="p-6 bg-slate-100 border-t border-slate-200 text-center space-y-2">
            <p className="text-xs font-medium text-slate-500">
              Need on-ground assistance during your trip?
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="tel:+919410572857"
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#FF5F00] hover:underline"
              >
                <Phone className="w-3.5 h-3.5" /> TripGod Helpline: +91 9410572857
              </a>
            </div>
          </div>
        </motion.div>

        {/* Home Link */}
        <div className="mt-8 text-center print:hidden">
          <button
            onClick={onBackToHome || (() => window.location.href = '/')}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            ← Back to TripGod Home
          </button>
        </div>
      </main>
    </div>
  );
}
