import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, MapPin, Phone, Calendar, Clock, 
  ChevronLeft, Download, Share2, Sparkles, ShieldCheck, 
  ExternalLink, Building2, Bike, Waves, Compass, QrCode, AlertCircle
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

// Helper to extract clean vendor phone numbers (1 or 2 numbers)
const extractVendorPhones = (item) => {
  const rawList = [];
  const addVal = (val) => {
    if (!val) return;
    const str = val.toString().trim();
    if (str) rawList.push(str);
  };

  addVal(item.operatorPhone);
  addVal(item.phone_number || item.phone);
  addVal(item.whatsapp_number || item.whatsapp);
  addVal(item.secondary_phone || item.alternate_phone);

  if (item.vendors) {
    addVal(item.vendors.phone || item.vendors.phone_number);
    addVal(item.vendors.whatsapp || item.vendors.whatsapp_number);
    addVal(item.vendors.secondary_phone || item.vendors.alternate_phone);
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

  return cleanPhones.length > 0 ? cleanPhones : ["9410572857"];
};

export default function TicketPage({ ticketCode, onBackToHome }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBookingDetails = async () => {
      setLoading(true);
      const code = ticketCode || new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();
      
      if (!code) {
        setLoading(false);
        return;
      }

      try {
        // 1. Check local storage first for instant loading
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('tripgod_bookings_')) {
            try {
              const list = JSON.parse(localStorage.getItem(key) || '[]');
              const match = list.find(b => 
                (b.id && b.id.toLowerCase().includes(code.toLowerCase())) ||
                (b.bookingId && b.bookingId.toLowerCase().includes(code.toLowerCase()))
              );
              if (match) {
                setBooking(match);
                setLoading(false);
                return;
              }
            } catch (e) {}
          }
        }

        // 2. Fetch from Supabase bookings table
        if (supabase) {
          try {
            const { data: dbBooking } = await supabase
              .from('bookings')
              .select('*, vendors(*)')
              .or(`id.ilike.%${code}%`)
              .maybeSingle();

            if (dbBooking) {
              const totalAmt = Number(dbBooking.amount_paid || 0) + Number(dbBooking.remaining_amount || 0);
              setBooking({
                bookingId: code.toUpperCase().startsWith('TG-') ? code.toUpperCase() : `TG-${code.substring(0, 6).toUpperCase()}`,
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
                  name: dbBooking.service_type || 'Rishikesh Experience',
                  slot: dbBooking.travel_date ? `Travel Date: ${dbBooking.travel_date}` : 'Flexible Timing',
                  fullAddress: 'Rishikesh, Uttarakhand',
                  mapLink: `https://maps.google.com/?q=${encodeURIComponent((dbBooking.service_type || 'Rishikesh') + ' Rishikesh')}`,
                  operatorPhone: dbBooking.vendors?.phone || dbBooking.vendors?.whatsapp || '9410572857',
                  vendors: dbBooking.vendors
                }]
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error fetching booking from DB:', e);
          }

          // 3. Fetch from abandoned_carts table
          try {
            const { data: cartData } = await supabase
              .from('abandoned_carts')
              .select('*')
              .or(`id.ilike.%${code}%,customer_name.ilike.%${code}%`)
              .maybeSingle();

            if (cartData && cartData.activity_details) {
              const details = typeof cartData.activity_details === 'string' 
                ? JSON.parse(cartData.activity_details) 
                : cartData.activity_details;

              const itemsArr = Array.isArray(details.items) && details.items.length > 0
                ? details.items
                : [{
                    id: details.id || '1',
                    category: details.category || 'hotels',
                    name: details.name || details.title || cartData.service_type || 'Rishikesh Experience',
                    slot: details.slot || details.selectedSlot || 'Flexible Timing',
                    fullAddress: details.fullAddress || details.address || 'Rishikesh, Uttarakhand',
                    mapLink: details.mapLink || `https://maps.google.com/?q=${encodeURIComponent((details.name || 'Rishikesh') + ' Rishikesh')}`,
                    operatorPhone: details.operatorPhone || details.phone || cartData.customer_phone,
                    vendors: details.vendors
                  }];

              setBooking({
                bookingId: code.toUpperCase().startsWith('TG-') ? code.toUpperCase() : `TG-${code.substring(0, 6).toUpperCase()}`,
                customerName: cartData.customer_name || 'Valued Guest',
                customerPhone: cartData.customer_phone || '',
                customerEmail: cartData.customer_email || '',
                date: details.travelDate || cartData.travel_date || new Date().toLocaleDateString('en-IN'),
                totalPrice: details.totalPrice || cartData.total_price || 0,
                advancePaid: details.advance_amount || cartData.advance_amount || 0,
                remainingPaid: Math.max(0, (details.totalPrice || 0) - (details.advance_amount || 0)),
                items: itemsArr,
                activityName: details.name || details.title || 'Rishikesh Experience'
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error fetching cart from DB:', e);
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#FF5F00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generating Digital Pass...</p>
      </div>
    );
  }

  // Fallback booking ONLY if code was empty or not found
  const displayBooking = booking || {
    bookingId: ticketCode && ticketCode.startsWith('TG-') ? ticketCode : 'TG-000000',
    customerName: 'Valued Traveler',
    date: new Date().toLocaleDateString('en-IN'),
    totalPrice: 0,
    advancePaid: 0,
    remainingPaid: 0,
    items: [
      {
        id: '1',
        category: 'hotels',
        name: 'Rishikesh Adventure Booking Pass',
        slot: 'Flexible Timing',
        fullAddress: 'Rishikesh, Uttarakhand',
        mapLink: 'https://maps.google.com/?q=Rishikesh',
        operatorPhone: '9410572857'
      }
    ]
  };

  const getItemIcon = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'hotels' || c === 'camping') return <Building2 className="w-5 h-5 text-indigo-400" />;
    if (c === 'bikerent' || c === 'bikes') return <Bike className="w-5 h-5 text-amber-400" />;
    if (c === 'rafting' || c === 'kayaking') return <Waves className="w-5 h-5 text-cyan-400" />;
    return <Compass className="w-5 h-5 text-[#FF5F00]" />;
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 font-sans pb-16 selection:bg-[#FF5F00] selection:text-white print:bg-white print:text-black">
      {/* Top Header Controls */}
      <header className="sticky top-0 z-40 bg-[#0A0D14]/90 backdrop-blur-xl border-b border-slate-800/60 px-4 py-3.5 print:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBackToHome || (() => window.location.href = '/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Home
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-[#FF5F00] hover:bg-[#FF3D00] text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#FF5F00]/20"
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
          className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md"
        >
          {/* Top Brand Banner */}
          <div className="bg-gradient-to-r from-[#FF5F00] via-[#FF3D00] to-amber-600 p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tighter text-white">TRIP<span className="bg-white text-[#FF5F00] px-1.5 py-0.5 rounded-md ml-0.5">GOD</span></span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Confirmed Pass
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Adventure Booking ID</p>
                <p className="text-2xl font-black tracking-wider text-white mt-0.5 font-mono">{displayBooking.bookingId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Lead Guest</p>
                <p className="text-sm font-bold text-white mt-0.5">{displayBooking.customerName}</p>
              </div>
            </div>
          </div>

          {/* Quick QR Check-in Box */}
          <div className="bg-slate-950/60 p-5 border-b border-slate-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[#FF5F00] shadow-inner">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">Fast Venue Check-in</h4>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Show this QR code or Booking ID at venue desk</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Travel Date</span>
              <span className="text-xs font-black text-amber-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {displayBooking.date}
              </span>
            </div>
          </div>

          {/* Payment Status Summary Bar */}
          <div className="px-6 py-3 bg-slate-900 border-b border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Advance Paid: <strong className="text-emerald-400">₹{displayBooking.advancePaid?.toLocaleString('en-IN')}</strong></span>
            </div>
            <div className="text-slate-400 font-bold">
              Balance at Venue: <strong className="text-amber-400">₹{displayBooking.remainingPaid?.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Itemized Pass Stack Header */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF5F00]" /> Booked Services ({displayBooking.items?.length || 1})
              </h3>
              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-md">
                Individual Venues & Contact
              </span>
            </div>

            {/* List of Booked Items */}
            <div className="space-y-4">
              {displayBooking.items.map((item, index) => {
                const vendorPhones = extractVendorPhones(item);
                const itemMapUrl = item.mapLink || `https://maps.google.com/?q=${encodeURIComponent((item.fullAddress || item.vendorName || item.name) + ' Rishikesh')}`;
                
                return (
                  <motion.div 
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  >
                    {/* Item Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 mt-0.5 shadow-xs">
                          {getItemIcon(item.category)}
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Item {index + 1} • {(item.category || 'Service').toUpperCase()}
                          </span>
                          <h4 className="text-sm font-black text-white mt-1 leading-snug">
                            {item.name || item.title}
                          </h4>
                          {item.vendorName && (
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                              Host: {item.vendorName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time Slot & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-[#FF5F00] shrink-0" />
                        <span className="font-bold text-[11px]">{item.slot || item.selectedSlot || 'Flexible Timing'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium text-[11px] truncate">{item.fullAddress || 'Rishikesh Station / Venue'}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Google Maps + Vendor Phones */}
                    <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={itemMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/50 text-emerald-300 text-[11px] font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Open Map <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>

                      {/* Vendor Phone Call Buttons (Handles 1 or 2 phones) */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {vendorPhones.map((ph, pIdx) => (
                          <a
                            key={pIdx}
                            href={`tel:+${ph}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Phone className="w-3 h-3 text-[#FF5F00]" /> 
                            {vendorPhones.length > 1 ? `Call Host ${pIdx + 1}` : `Call Host`} ({formatDisplayPhone(ph)})
                          </a>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer Assistance Banner */}
          <div className="p-6 bg-slate-950 border-t border-slate-800 text-center space-y-2">
            <p className="text-xs font-medium text-slate-400">
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
            className="text-xs font-bold text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            ← Back to TripGod Home
          </button>
        </div>
      </main>
    </div>
  );
}
