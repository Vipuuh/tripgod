import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ChevronLeft, Ticket, AlertCircle, Phone } from 'lucide-react';
import HotelTicketView from '../components/ticket/HotelTicketView';
import RaftingTicketView from '../components/ticket/RaftingTicketView';
import ExtremeSportsTicketView from '../components/ticket/ExtremeSportsTicketView';
import BikeRentalTicketView from '../components/ticket/BikeRentalTicketView';
import CampingTicketView from '../components/ticket/CampingTicketView';
import TourTicketView from '../components/ticket/TourTicketView';
import ComboTicketView from '../components/ticket/ComboTicketView';

// Helper to derive simple booking code from UUID or ID string (Matches backend algorithm)
const getSimpleBookingId = (id) => {
  if (!id || id === 'N/A') return 'TG-000000';
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

// Robust category normalizer
const normalizeCategory = (catStr = '', nameStr = '') => {
  const combined = `${catStr} ${nameStr}`.toLowerCase();
  if (combined.includes('rafting')) return 'rafting';
  if (combined.includes('bungee') || combined.includes('swing') || combined.includes('zipline') || combined.includes('kayak')) return 'bungee';
  if (combined.includes('bike') || combined.includes('scooty') || combined.includes('rental')) return 'bikerent';
  if (combined.includes('camp')) return 'camping';
  if (combined.includes('hotel') || combined.includes('homestay') || combined.includes('resort')) return 'hotels';
  if (combined.includes('tour') || combined.includes('package')) return 'tours';
  return 'hotels';
};

export default function TicketPage({ ticketCode, onBackToHome }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFoundCode, setNotFoundCode] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBookingFromBackend = async () => {
      setLoading(true);
      const code = ticketCode || new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();
      
      if (!code || code === 'ticket' || code === 'pass') {
        setLoading(false);
        setNotFoundCode('TG-PASS');
        return;
      }

      const cleanCode = code.toUpperCase().trim();
      const codeNumOnly = cleanCode.replace(/\D/g, '');
      setNotFoundCode(cleanCode);

      try {
        if (supabase) {
          // 1. Fetch from Supabase `abandoned_carts` table (Matches simpleBookingCode like TG-578377)
          try {
            const { data: cartData } = await supabase
              .from('abandoned_carts')
              .select('*')
              .or(`id.ilike.%${cleanCode}%,id.ilike.%${codeNumOnly}%`)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (cartData && cartData.activity_details) {
              const details = typeof cartData.activity_details === 'string' 
                ? JSON.parse(cartData.activity_details) 
                : cartData.activity_details;

              const rawItems = Array.isArray(details.items) && details.items.length > 0
                ? details.items
                : [{
                    id: details.id || '1',
                    category: details.category || cartData.service_type || 'hotels',
                    name: details.name || details.title || details.activityName || 'Rishikesh Adventure Booking',
                    slot: details.slot || details.selectedSlot || 'Flexible Timing',
                    fullAddress: details.fullAddress || details.address || details.location || 'Rishikesh, Uttarakhand',
                    mapLink: details.mapLink || details.google_maps_link || details.vendors?.google_maps_link,
                    operatorPhone: details.operatorPhone || details.phone_number || details.phone || details.vendors?.phone || details.vendors?.whatsapp,
                    vendors: details.vendors
                  }];

              const isCombo = rawItems.length > 1;
              const cat = isCombo ? 'combo' : normalizeCategory(rawItems[0]?.category || cartData.service_type, rawItems[0]?.name || details.activityName);

              setBooking({
                bookingId: cleanCode.startsWith('TG-') ? cleanCode : `TG-${cleanCode}`,
                customerName: cartData.customer_name || details.customerName || 'Valued Guest',
                customerPhone: cartData.customer_phone || details.customerPhone || '',
                customerEmail: cartData.customer_email || details.customerEmail || '',
                date: details.travelDate || cartData.travel_date || new Date().toLocaleDateString('en-IN'),
                totalPrice: details.total_price || details.totalPrice || 0,
                advancePaid: details.advance_amount || cartData.advance_amount || 0,
                remainingPaid: details.remainingPaid !== undefined ? details.remainingPaid : Math.max(0, (details.total_price || details.totalPrice || 0) - (details.advance_amount || 0)),
                category: cat,
                items: rawItems,
                activityName: details.name || details.title || 'Rishikesh Adventure Pass'
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error fetching cart from DB:', e);
          }

          // 2. Fetch from Supabase `bookings` table by querying recent bookings & computing simpleBookingCode
          try {
            const { data: dbBookings } = await supabase
              .from('bookings')
              .select('*, vendors(*)')
              .order('created_at', { ascending: false })
              .limit(100);

            if (dbBookings && dbBookings.length > 0) {
              const dbMatch = dbBookings.find(b => {
                const computedCode = getSimpleBookingId(b.id);
                return computedCode.toUpperCase() === cleanCode || 
                       computedCode.toUpperCase().replace('TG-', '') === cleanCode.replace('TG-', '') ||
                       b.id.toUpperCase().includes(cleanCode) ||
                       (codeNumOnly && b.id.replace(/\D/g, '').includes(codeNumOnly));
              });

              if (dbMatch) {
                let vendorObj = dbMatch.vendors;
                if (!vendorObj && dbMatch.vendor_id) {
                  const { data: vData } = await supabase
                    .from('vendors')
                    .select('*')
                    .eq('id', dbMatch.vendor_id)
                    .maybeSingle();
                  if (vData) vendorObj = vData;
                }

                const cat = normalizeCategory(dbMatch.service_type, dbMatch.activity_name);
                const totalAmt = Number(dbMatch.amount_paid || 0) + Number(dbMatch.remaining_amount || 0);

                const resolvedBooking = {
                  bookingId: cleanCode.startsWith('TG-') ? cleanCode : `TG-${cleanCode}`,
                  customerName: dbMatch.customer_name || 'Valued Guest',
                  customerPhone: dbMatch.customer_phone || '',
                  customerEmail: dbMatch.customer_email || '',
                  date: dbMatch.travel_date || new Date().toLocaleDateString('en-IN'),
                  totalPrice: totalAmt,
                  advancePaid: Number(dbMatch.amount_paid || 0),
                  remainingPaid: Number(dbMatch.remaining_amount || 0),
                  category: cat,
                  vendor: vendorObj || {},
                  items: [{
                    id: dbMatch.service_id || '1',
                    category: cat,
                    name: dbMatch.activity_name || dbMatch.service_type || 'Rishikesh Adventure Pass',
                    slot: dbMatch.travel_date ? `Date: ${dbMatch.travel_date}` : 'Standard Timing',
                    fullAddress: vendorObj?.address || vendorObj?.location || 'Rishikesh, Uttarakhand',
                    mapLink: vendorObj?.google_maps_link || null,
                    operatorPhone: vendorObj?.phone || vendorObj?.whatsapp || '9410572857',
                    vendors: vendorObj
                  }]
                };

                setBooking(resolvedBooking);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('Error matching booking from DB:', e);
          }
        }

        // 3. Check direct localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.includes(cleanCode) || key.includes(codeNumOnly)) {
            try {
              const parsed = JSON.parse(localStorage.getItem(key) || '{}');
              if (parsed && (parsed.bookingId || parsed.id || parsed.items)) {
                const isCombo = Array.isArray(parsed.items) && parsed.items.length > 1;
                const cat = isCombo ? 'combo' : normalizeCategory(parsed.category || parsed.items?.[0]?.category, parsed.activityName || parsed.items?.[0]?.name);
                setBooking({
                  ...parsed,
                  category: cat
                });
                setLoading(false);
                return;
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error fetching ticket details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingFromBackend();
  }, [ticketCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#FF5F00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Digital Adventure Pass...</p>
      </div>
    );
  }

  // If no booking was found in DB or localStorage, render clean "Ticket Not Found" screen
  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-[#FF5F00] rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-xs">
            <Ticket className="w-8 h-8" />
          </div>
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-black uppercase tracking-wider mb-3">
              <AlertCircle className="w-3.5 h-3.5" /> Ticket Pass Not Found
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Booking Record Unavailable</h2>
            <p className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase tracking-widest">
              Searched ID: {notFoundCode || 'N/A'}
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              We could not find a confirmed booking pass matching this ID. Please verify your Booking Code from your WhatsApp / Email confirmation or contact TripGod support.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Need Immediate Help?</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">TripGod Helpline</span>
              <a href="tel:+919410572857" className="font-black text-[#FF5F00] flex items-center gap-1 hover:underline">
                <Phone className="w-3.5 h-3.5" /> +91 9410572857
              </a>
            </div>
          </div>

          <button
            onClick={onBackToHome || (() => window.location.href = '/')}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-4 h-4" /> Return to TripGod Home
          </button>
        </div>
      </div>
    );
  }

  // Determine category router dispatcher
  const mainCategory = (booking.category || booking.items?.[0]?.category || 'hotels').toLowerCase();
  const isCombo = booking.category === 'combo' || (Array.isArray(booking.items) && booking.items.length > 1);

  if (isCombo) {
    return <ComboTicketView booking={booking} onBackToHome={onBackToHome} />;
  }

  switch (mainCategory) {
    case 'hotel':
    case 'hotels':
    case 'homestay':
      return <HotelTicketView booking={booking} onBackToHome={onBackToHome} />;

    case 'rafting':
      return <RaftingTicketView booking={booking} onBackToHome={onBackToHome} />;

    case 'bungee':
    case 'swing':
    case 'zipline':
    case 'kayaking':
      return <ExtremeSportsTicketView booking={booking} onBackToHome={onBackToHome} />;

    case 'bikerent':
    case 'bikes':
    case 'bike':
      return <BikeRentalTicketView booking={booking} onBackToHome={onBackToHome} />;

    case 'camping':
    case 'camp':
      return <CampingTicketView booking={booking} onBackToHome={onBackToHome} />;

    case 'tours':
    case 'tour':
      return <TourTicketView booking={booking} onBackToHome={onBackToHome} />;

    default:
      return <HotelTicketView booking={booking} onBackToHome={onBackToHome} />;
  }
}
