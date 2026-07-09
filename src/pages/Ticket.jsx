import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ShieldCheck, MapPin, Phone, Mail, Calendar, Clock, Download, ArrowLeft, Printer, Users } from 'lucide-react';

export default function Ticket() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Extract booking UUID from URL path
  const path = window.location.pathname;
  const bookingId = path.substring('/ticket/'.length);

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

  const formatDisplayPhone = (phone) => {
    if (!phone) return '8630027341';
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `+91 ${clean.substring(0, 5)} ${clean.substring(5)}`;
    }
    if (clean.length === 12 && clean.startsWith('91')) {
      return `+91 ${clean.substring(2, 7)} ${clean.substring(7)}`;
    }
    if (clean.startsWith('91') && clean.length > 2) {
      return `+91 ${clean.substring(2)}`;
    }
    return `+${clean}`;
  };

  useEffect(() => {
    const fetchBookingDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: fetchErr } = await supabase
          .from('bookings')
          .select('*, vendors(*)')
          .eq('id', bookingId)
          .single();

        if (fetchErr) throw fetchErr;

        if (data) {
          // If metadata is missing, attempt fallback query to resolve service name & details
          let metadata = data.metadata || {};

          if (!data.metadata) {
            console.log('Legacy booking detected. Resolving details from service tables...');
            try {
              let serviceName = 'TripGod Service';
              let operatorPhone = data.vendors?.whatsapp || data.vendors?.phone || '8630027341';
              let stretchStr = '';
              let checkOut = null;
              let nightsCount = null;

              if (data.service_type === 'Hotel') {
                const { data: sData } = await supabase.from('hotels').select('name, whatsapp_number').eq('id', data.service_id).single();
                if (sData) {
                  serviceName = sData.name;
                  operatorPhone = sData.whatsapp_number || operatorPhone;
                }
              } else if (data.service_type === 'Rafting' || data.service_type === 'Camping') {
                const { data: sData } = await supabase.from('rafting').select('name, route, whatsapp_number').eq('id', data.service_id).single();
                if (sData) {
                  serviceName = sData.name;
                  stretchStr = sData.route || '';
                  operatorPhone = sData.whatsapp_number || operatorPhone;
                }
              } else if (data.service_type === 'Tour') {
                const { data: sData } = await supabase.from('tours').select('name, contact_number').eq('id', data.service_id).single();
                if (sData) {
                  serviceName = sData.name;
                  operatorPhone = sData.contact_number || operatorPhone;
                }
              } else if (data.service_type === 'Bike Rental') {
                const { data: sData } = await supabase.from('bikes').select('name, whatsapp_number').eq('id', data.service_id).single();
                if (sData) {
                  serviceName = sData.name;
                  operatorPhone = sData.whatsapp_number || operatorPhone;
                }
              }

              metadata = {
                activity_name: serviceName,
                stretch: stretchStr,
                check_out_date: checkOut,
                nights: nightsCount,
                slot: data.service_type === 'Hotel' ? 'Standard Stay (Check-in 12:00 PM)' : 'Standard Slot',
                guests: 1,
                total_price: Number(data.amount_paid) + Number(data.remaining_amount),
                operator_phone: operatorPhone
              };
            } catch (fallbackErr) {
              console.error('Fallback query failed:', fallbackErr);
            }
          }

          setBooking({
            ...data,
            resolvedDetails: metadata
          });
        } else {
          setError('Booking record not found.');
        }
      } catch (err) {
        console.error('Failed to load booking ticket:', err);
        setError('Invalid or expired booking ticket URL.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('Missing booking reference.');
      setLoading(false);
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-black space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#FF5F00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <span className="text-[10px] uppercase font-black tracking-widest text-[#FF5F00]">Generating Voucher...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 bg-red-100 text-red-600 rounded-full">
          <ArrowLeft size={24} className="cursor-pointer" onClick={() => window.location.href = '/'} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Booking Ticket Error</h2>
        <p className="text-sm text-slate-500 max-w-sm">{error || 'Unable to retrieve voucher.'}</p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="py-2.5 px-6 bg-accent-gradient text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const { resolvedDetails } = booking;
  const isHotel = booking.service_type === 'Hotel';
  const displayId = getSimpleBookingId(booking.id);

  // Generate QR Code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(booking.id)}&color=000000`;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans flex flex-col items-center justify-start p-4 md:p-8 text-left text-slate-800 relative">
      
      {/* Dynamic Printing styling override */}
      <style>{`
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 1.5rem !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
          }
          .dotted-divider {
            border-top: 3px dotted #000000 !important;
          }
        }
      `}</style>

      {/* Floating control buttons */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 no-print">
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-slate-500 hover:text-black transition-colors bg-white border border-slate-200 px-3.5 py-2 rounded-full cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to Website
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider bg-black hover:bg-slate-900 text-white px-4 py-2.5 rounded-full cursor-pointer shadow-md hover:scale-[1.02] transition-all"
        >
          <Printer size={12} /> Print / Save PDF
        </button>
      </div>

      {/* Ticket Boarding Pass Container */}
      <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden print-card">
        
        {/* Ticket Header (Brand & CONFIRMED Badge) */}
        <div className="bg-gradient-to-r from-slate-900 to-neutral-950 p-6 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#FF5F00]/10 rounded-full blur-2xl" />
          <div className="space-y-1">
            <div className="flex items-center select-none">
              <span className="font-black text-xl tracking-tighter text-white">TRIP</span>
              <span className="font-black text-xl tracking-tighter text-accent bg-white/10 px-1 py-0.5 rounded ml-0.5">GOD</span>
            </div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Official Booking Voucher</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">Confirmed</span>
          </div>
        </div>

        {/* Boarding Pass Body */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Section 1: Customer details & QR Code */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-4 flex-grow">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Booking ID</span>
                <p className="text-base font-black text-slate-900 font-sans">{displayId}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Passenger / Guest</span>
                <p className="text-sm font-extrabold text-slate-900 truncate">{booking.customer_name}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Phone</span>
                <p className="text-xs font-bold text-slate-800">{formatDisplayPhone(booking.customer_phone)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Email</span>
                <p className="text-xs font-bold text-slate-800 truncate">{booking.customer_email}</p>
              </div>
            </div>
            
            {/* QR Verification slip */}
            <div className="flex flex-col items-center bg-slate-50 border border-slate-100 p-2.5 rounded-2xl shrink-0">
              <img src={qrCodeUrl} alt="Voucher QR Verification" className="w-24 h-24" />
              <span className="text-[8px] font-black uppercase text-slate-400 mt-1 tracking-widest">Verify at Venue</span>
            </div>
          </div>

          {/* Section 2: Trip Details */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">📂 Service Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-0.5 col-span-1 md:col-span-2">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Service / Package</span>
                <p className="text-sm font-black text-slate-900 leading-tight">{resolvedDetails.activity_name}</p>
              </div>

              {resolvedDetails.stretch && (
                <div className="space-y-0.5 col-span-1 md:col-span-2">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Stretch / Route</span>
                  <p className="text-xs font-bold text-slate-800">{resolvedDetails.stretch}</p>
                </div>
              )}

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">{isHotel ? 'Check-in Date' : 'Travel Date'}</span>
                <div className="flex items-center gap-1 text-slate-800">
                  <Calendar size={13} className="text-slate-400" />
                  <p className="text-xs font-bold">{booking.travel_date ? booking.travel_date.split('-').reverse().join('/') : 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">{isHotel ? 'Check-out Date' : 'Reporting Slot'}</span>
                <div className="flex items-center gap-1 text-slate-800">
                  <Clock size={13} className="text-slate-400" />
                  <p className="text-xs font-bold">
                    {isHotel && resolvedDetails.check_out_date 
                      ? `${resolvedDetails.check_out_date.split('-').reverse().join('/')} (${resolvedDetails.nights} Night${resolvedDetails.nights > 1 ? 's' : ''})` 
                      : (resolvedDetails.slot || 'N/A')}
                  </p>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">{isHotel ? 'Booking Details' : 'No. of Guests'}</span>
                <div className="flex items-center gap-1 text-slate-800">
                  <Users size={13} className="text-slate-400" />
                  <p className="text-xs font-bold">
                    {isHotel 
                      ? `${resolvedDetails.guests} Guest(s) [${resolvedDetails.slot}]`
                      : `${resolvedDetails.guests} Person(s)`}
                  </p>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Host/Hotel Helpline</span>
                <div className="flex items-center gap-1 text-[#FF5F00]">
                  <Phone size={13} />
                  <p className="text-xs font-black font-sans">{formatDisplayPhone(resolvedDetails.operator_phone)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dotted Divider representing Tear-off coupon */}
          <div className="relative py-2 dotted-divider border-t-2 border-dashed border-slate-200/80 my-8">
            <div className="absolute left-[-26px] md:left-[-34px] top-[-10px] w-6 h-6 bg-slate-50/50 rounded-full border border-slate-200/80 z-10 no-print" />
            <div className="absolute right-[-26px] md:right-[-34px] top-[-10px] w-6 h-6 bg-slate-50/50 rounded-full border border-slate-200/80 z-10 no-print" />
          </div>

          {/* Section 3: Billing & Cost breakdown */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">💳 Payment Breakdown</h4>
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Total Price Package</span>
                <span className="font-extrabold text-slate-900 font-sans">₹{Number(resolvedDetails.total_price || (Number(booking.amount_paid) + Number(booking.remaining_amount))).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-600 font-black">Advance Paid Online</span>
                <span className="font-black text-emerald-600 font-sans">₹{Number(booking.amount_paid).toLocaleString('en-IN')}</span>
              </div>
              {Number(booking.remaining_amount) > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#FF5F00] font-black">{isHotel ? 'Collect at Check-in' : 'Pay to Operator at Venue'}</span>
                  <span className="font-black text-[#FF5F00] font-sans">₹{Number(booking.remaining_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Barcode styling */}
          <div className="flex flex-col items-center pt-8 space-y-1">
            <div className="flex justify-between items-stretch h-8 w-full max-w-[320px] opacity-70">
              <div className="w-1 bg-black mr-0.5" />
              <div className="w-[1.5px] bg-black mr-0.5" />
              <div className="w-[0.5px] bg-black mr-0.5" />
              <div className="w-2.5 bg-black mr-0.5" />
              <div className="w-0.5 bg-black mr-0.5" />
              <div className="w-[1px] bg-black mr-0.5" />
              <div className="w-1.5 bg-black mr-0.5" />
              <div className="w-[0.5px] bg-black mr-0.5" />
              <div className="w-2 bg-black mr-0.5" />
              <div className="w-0.5 bg-black mr-0.5" />
              <div className="w-1 bg-black mr-0.5" />
              <div className="w-[1.5px] bg-black mr-0.5" />
              <div className="w-[0.5px] bg-black mr-0.5" />
              <div className="w-2.5 bg-black mr-0.5" />
              <div className="w-0.5 bg-black mr-0.5" />
              <div className="w-[1px] bg-black mr-0.5" />
              <div className="w-1.5 bg-black mr-0.5" />
              <div className="w-[0.5px] bg-black mr-0.5" />
              <div className="w-2 bg-black mr-0.5" />
              <div className="w-0.5 bg-black" />
            </div>
            <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest font-sans">{booking.id}</span>
          </div>

        </div>

        {/* Ticket Footer Guidelines */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 text-xs text-slate-500 space-y-2">
          <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">📢 Important Passenger Guidelines</p>
          <ul className="list-disc pl-4 space-y-1 text-[10px] leading-relaxed">
            <li>Please show this digital ticket voucher or QR code upon arrival at the desk/venue.</li>
            <li>For stays, check-in timings are standard 12:00 PM. Early check-in is subject to availability.</li>
            <li>For paragliding, paragliders must dress in sports shoes. Jeans/trousers are recommended.</li>
            <li>Rafting participants must not consume alcohol before or during the water activities.</li>
            <li>Helpline support is open 24/7 at <span className="font-extrabold text-black font-sans">+91 86300 27341</span>.</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
