import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
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

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBookingFromBackend = async () => {
      setLoading(true);
      const code = ticketCode || new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();
      
      if (!code) {
        setLoading(false);
        return;
      }

      const cleanCode = code.toUpperCase().trim();

      try {
        // 1. Direct fetch from Supabase `bookings` table (Single Source of Truth)
        if (supabase) {
          try {
            const { data: dbBooking } = await supabase
              .from('bookings')
              .select('*, vendors(*)')
              .or(`id.ilike.%${cleanCode}%`)
              .maybeSingle();

            if (dbBooking) {
              // Fetch full vendor details if vendor_id exists
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

          // 2. Fetch from Supabase `abandoned_carts` session table
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
                    name: details.name || details.title || details.activityName || 'Rishikesh Booking Pass',
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
        }

        // 3. Fallback to direct localStorage booking session key
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
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Confirmed Pass...</p>
      </div>
    );
  }

  // Active Resolved Booking Data (Single Source of Truth)
  const activeBooking = booking || {
    bookingId: ticketCode && ticketCode.toUpperCase().startsWith('TG-') ? ticketCode.toUpperCase() : 'TG-PASS',
    customerName: 'Valued Guest',
    date: new Date().toLocaleDateString('en-IN'),
    totalPrice: 0,
    advancePaid: 0,
    remainingPaid: 0,
    category: 'hotels',
    items: [
      {
        id: '1',
        category: 'hotels',
        name: 'Rishikesh Hotel Stay',
        slot: 'Flexible Check-in',
        fullAddress: 'Rishikesh, Uttarakhand',
        operatorPhone: '9410572857'
      }
    ]
  };

  // Determine category router dispatcher
  const mainCategory = (activeBooking.category || activeBooking.items?.[0]?.category || 'hotels').toLowerCase();
  const isCombo = activeBooking.category === 'combo' || (Array.isArray(activeBooking.items) && activeBooking.items.length > 1);

  if (isCombo) {
    return <ComboTicketView booking={activeBooking} onBackToHome={onBackToHome} />;
  }

  switch (mainCategory) {
    case 'hotel':
    case 'hotels':
    case 'homestay':
      return <HotelTicketView booking={activeBooking} onBackToHome={onBackToHome} />;

    case 'rafting':
      return <RaftingTicketView booking={activeBooking} onBackToHome={onBackToHome} />;

    case 'bungee':
    case 'swing':
    case 'zipline':
    case 'kayaking':
      return <ExtremeSportsTicketView booking={activeBooking} onBackToHome={onBackToHome} />;

    case 'bikerent':
    case 'bikes':
    case 'bike':
      return <BikeRentalTicketView booking={activeBooking} onBackToHome={onBackToHome} />;

    case 'camping':
    case 'camp':
      return <CampingTicketView booking={activeBooking} onBackToHome={onBackToHome} />;

    case 'tours':
    case 'tour':
      return <TourTicketView booking={activeBooking} onBackToHome={onBackToHome} />;

    default:
      return <HotelTicketView booking={activeBooking} onBackToHome={onBackToHome} />;
  }
}
