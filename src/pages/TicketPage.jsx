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
      setNotFoundCode(cleanCode);

      try {
        // 1. Fetch from Supabase `abandoned_carts` table (Stores exact simpleBookingCode like TG-305100)
        if (supabase) {
          try {
            const { data: cartData } = await supabase
              .from('abandoned_carts')
              .select('*')
              .or(`id.ilike.%${cleanCode}%,customer_name.ilike.%${cleanCode}%`)
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

              setBooking({
                bookingId: cleanCode.startsWith('TG-') ? cleanCode : `TG-${cleanCode}`,
                customerName: cartData.customer_name || details.customerName || 'Valued Guest',
                customerPhone: cartData.customer_phone || details.customerPhone || '',
                customerEmail: cartData.customer_email || details.customerEmail || '',
                date: details.travelDate || cartData.travel_date || new Date().toLocaleDateString('en-IN'),
                totalPrice: details.total_price || details.totalPrice || 0,
                advancePaid: details.advance_amount || cartData.advance_amount || 0,
                remainingPaid: details.remainingPaid !== undefined ? details.remainingPaid : Math.max(0, (details.total_price || details.totalPrice || 0) - (details.advance_amount || 0)),
                category: isCombo ? 'combo' : (rawItems[0]?.category || cartData.service_type || 'hotels').toLowerCase(),
                items: rawItems,
                activityName: details.name || details.title || 'Rishikesh Adventure Pass'
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error fetching cart from DB:', e);
          }

          // 2. Fetch from Supabase `bookings` table
          try {
            const { data: dbBooking } = await supabase
              .from('bookings')
              .select('*, vendors(*)')
              .or(`id.ilike.%${cleanCode}%`)
              .maybeSingle();

            if (dbBooking) {
              let vendorObj = dbBooking.vendors;
              if (!vendorObj && dbBooking.vendor_id) {
                const { data: vData } = await supabase
                  .from('vendors')
                  .select('*')
                  .eq('id', dbBooking.vendor_id)
                  .maybeSingle();
                if (vData) vendorObj = vData;
              }

              const serviceType = (dbBooking.service_type || 'Hotels').toLowerCase();
              const totalAmt = Number(dbBooking.amount_paid || 0) + Number(dbBooking.remaining_amount || 0);

              const resolvedBooking = {
                bookingId: cleanCode.startsWith('TG-') ? cleanCode : `TG-${cleanCode}`,
                customerName: dbBooking.customer_name || 'Valued Guest',
                customerPhone: dbBooking.customer_phone || '',
                customerEmail: dbBooking.customer_email || '',
                date: dbBooking.travel_date || new Date().toLocaleDateString('en-IN'),
                totalPrice: totalAmt,
                advancePaid: Number(dbBooking.amount_paid || 0),
                remainingPaid: Number(dbBooking.remaining_amount || 0),
                category: serviceType,
                vendor: vendorObj || {},
                items: [{
                  id: dbBooking.service_id || '1',
                  category: serviceType,
                  name: dbBooking.activity_name || dbBooking.service_type || 'TripGod Rishikesh Booking',
                  slot: dbBooking.travel_date ? `Date: ${dbBooking.travel_date}` : 'Standard Timing',
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
          } catch (e) {
            console.error('Error fetching booking from DB:', e);
          }
        }

        // 3. Check direct localStorage keys
        const directLocal = localStorage.getItem(`tripgod_booking_${cleanCode}`);
        if (directLocal) {
          try {
            const parsed = JSON.parse(directLocal);
            const isCombo = Array.isArray(parsed.items) && parsed.items.length > 1;
            setBooking({
              ...parsed,
              category: isCombo ? 'combo' : (parsed.category || parsed.items?.[0]?.category || 'hotels').toLowerCase()
            });
            setLoading(false);
            return;
          } catch (e) {}
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

  // If no booking was found in DB or localStorage, render a clean "Ticket Not Found" screen (DO NOT render fake hotel pass!)
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
