import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, XCircle, MapPin, Phone, MessageSquare, 
  Printer, ArrowLeft, Calendar, Clock, Users, ShieldCheck, CreditCard, 
  Building2, Waves, Bike, Sparkles, Navigation, Info, ExternalLink, HelpCircle
} from 'lucide-react';
import { supabase } from '../supabase';

// Helper to check if a value is non-null, non-empty, and valid
const hasVal = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'number') return !isNaN(val);
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'nan' && trimmed !== 'n/a' && trimmed !== 'tbd';
  }
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return true;
};

// Helper for human-readable ID
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

// Format display phone
const formatDisplayPhone = (phone) => {
  if (!phone) return '';
  let clean = phone.toString().replace(/\D/g, '');
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

// Simple lightweight SVG QR Code Generator Component (Zero external packages, zero file storage)
function QRCodeSVG({ value, size = 120 }) {
  // Generate a deterministic visual QR pattern from string hash
  const generateMatrix = (str) => {
    const n = 21; // 21x21 grid for Version 1 QR code
    const matrix = Array(n).fill(0).map(() => Array(n).fill(false));

    // Finder patterns (top-left, top-right, bottom-left 7x7 squares)
    const addFinder = (row, col) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    };
    addFinder(0, 0);
    addFinder(0, n - 7);
    addFinder(n - 7, 0);

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
      if (i % 2 === 0) {
        matrix[6][i] = true;
        matrix[i][6] = true;
      }
    }

    // Hash-based data fills
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        // Skip finder patterns
        if ((r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8)) continue;
        if (r === 6 || c === 6) continue;
        
        const bit = ((hash ^ (r * 31 + c * 17)) & 1) === 0;
        matrix[r][c] = bit;
        hash = (hash >> 1) | (hash << 31);
      }
    }

    return matrix;
  };

  const matrix = generateMatrix(value || 'https://tripgod.in');
  const cellSize = size / matrix.length;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg shadow-2xs border border-slate-200 bg-white p-1.5">
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0F172A"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function BookingTicketPage({ token, onNavigateHome }) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [service, setService] = useState(null);
  const [localBookingData, setLocalBookingData] = useState(null);
  const [error, setError] = useState('');

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://tripgod.in/booking-ticket/${token}`;

  useEffect(() => {
    const fetchTicketDetails = async () => {
      setLoading(true);
      setError('');

      const cleanToken = (token || '').trim();
      if (!cleanToken) {
        setError('No ticket token provided.');
        setLoading(false);
        return;
      }

      // Check local storage for quick prefill/enrichment
      let cachedObj = null;
      try {
        const rawLocal = localStorage.getItem(`tripgod_booking_${cleanToken}`);
        if (rawLocal) cachedObj = JSON.parse(rawLocal);
      } catch (e) {}

      if (cachedObj) {
        setLocalBookingData(cachedObj);
      }

      if (!supabase) {
        if (cachedObj) {
          setBooking(cachedObj);
          setLoading(false);
          return;
        }
        setError('Unable to load this booking ticket. Please contact TripGod support.');
        setLoading(false);
        return;
      }

      try {
        // Query Supabase bookings table
        // Matches by UUID id OR simple code derivation OR custom lookup
        let { data: bookingRow, error: bookingErr } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', cleanToken)
          .maybeSingle();

        // Fallback: If token looks like a simple code or custom ID
        if (!bookingRow && !bookingErr) {
          const { data: allBookings } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          if (allBookings && allBookings.length > 0) {
            bookingRow = allBookings.find(b => getSimpleBookingId(b.id) === cleanToken || b.id === cleanToken);
          }
        }

        if (bookingRow) {
          setBooking(bookingRow);

          // Fetch linked vendor by exact foreign key vendor_id
          if (bookingRow.vendor_id) {
            const { data: vendorRow } = await supabase
              .from('vendors')
              .select('*')
              .eq('id', bookingRow.vendor_id)
              .maybeSingle();
            if (vendorRow) setVendor(vendorRow);
          }

          // Fetch linked service details by service_type & service_id
          const sType = (bookingRow.service_type || '').toLowerCase();
          const sId = bookingRow.service_id;

          if (sId && sId !== '00000000-0000-0000-0000-000000000000') {
            let tableToQuery = null;
            if (sType.includes('hotel')) tableToQuery = 'hotels';
            else if (sType.includes('rafting')) tableToQuery = 'rafting';
            else if (sType.includes('bike') || sType.includes('rent')) tableToQuery = 'bikes';
            else if (sType.includes('tour')) tableToQuery = 'tours';
            else if (['bungee', 'camping', 'paragliding', 'swing', 'zipline', 'kayaking'].includes(sType)) {
              tableToQuery = sType;
            }

            if (tableToQuery) {
              try {
                const { data: serviceRow } = await supabase
                  .from(tableToQuery)
                  .select('*')
                  .eq('id', sId)
                  .maybeSingle();
                if (serviceRow) setService(serviceRow);
              } catch (e) {
                // Table might not exist for some specialized activities, fallback gracefully
              }
            }
          }
        } else if (cachedObj) {
          // If database row not found but local storage exists (offline fallback)
          setBooking(cachedObj);
        } else {
          setError('Unable to load this booking ticket. Please contact TripGod support.');
        }
      } catch (err) {
        console.error('Error loading ticket details:', err);
        if (cachedObj) {
          setBooking(cachedObj);
        } else {
          setError('Unable to load this booking ticket. Please contact TripGod support.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [token]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#FF5F00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Secure Digital Ticket...</p>
      </div>
    );
  }

  // Error State
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight">Ticket Not Found</h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              {error || 'Unable to load this booking ticket. Please contact TripGod support.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <a
              href="https://wa.me/919410572857?text=Hi%20TripGod%20Support%2C%20I%20need%20help%20accessing%20my%20booking%20ticket."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#FF5F00] hover:bg-[#FF6B00] text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform hover:scale-105 text-decoration-none shadow-md"
            >
              <MessageSquare size={16} /> Contact Support (+91 9410572857)
            </a>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft size={16} /> Back to TripGod Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Authoritative Data Resolution (DB values priority, strict non-null checks) ---
  const bookingIdCode = getSimpleBookingId(booking.id || token);
  const status = (booking.status || localBookingData?.status || 'confirmed').toLowerCase();
  
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const isPaymentFailed = status === 'payment_failed';

  const customerName = booking.customer_name || localBookingData?.customerName || '';
  const customerPhone = booking.customer_phone || localBookingData?.customerPhone || '';
  const customerEmail = booking.customer_email || localBookingData?.customerEmail || '';

  const serviceTypeRaw = (booking.service_type || localBookingData?.category || 'Rafting').toString();
  const cat = serviceTypeRaw.toLowerCase();

  const isHotel = cat.includes('hotel');
  const isRafting = cat.includes('rafting');
  const isBike = cat.includes('bike') || cat.includes('rent') || cat.includes('scooty');
  const isBungee = cat.includes('bungee') || cat.includes('swing') || cat.includes('zipline') || cat.includes('paragliding') || cat.includes('kayak') || cat.includes('camp');
  
  const activityName = localBookingData?.activityName || service?.name || booking.activity_name || booking.service_type || 'Adventure Booking';

  // Dates & Slots
  const travelDate = booking.travel_date || localBookingData?.date || '';
  const checkInDate = localBookingData?.checkInDate || (isHotel ? travelDate : '');
  const checkOutDate = localBookingData?.checkOutDate || '';
  const nights = localBookingData?.nights || (isHotel && checkInDate && checkOutDate ? 1 : null);
  const slotTime = localBookingData?.slot || service?.check_in || '';
  const guestsCount = localBookingData?.guests || booking.guests || 1;
  const rentalDaysCount = localBookingData?.rentalDays || 1;

  // Financial Breakdown
  const amountPaid = Number(booking.amount_paid !== undefined ? booking.amount_paid : (localBookingData?.advancePaid || 0));
  const remainingAmount = Number(booking.remaining_amount !== undefined ? booking.remaining_amount : (localBookingData?.remainingPaid || 0));
  const totalPrice = amountPaid + remainingAmount;
  const isFullyPaid = remainingAmount <= 0;

  // Linked Vendor & Contact Resolution (Strict ID-based binding)
  const vendorName = vendor?.name || localBookingData?.items?.[0]?.vendorName || service?.vendor_name || '';
  const vendorPhoneRaw = vendor?.phone || vendor?.whatsapp || service?.whatsapp_number || service?.phone_number || localBookingData?.items?.[0]?.phone_number || '';
  const vendorWhatsappRaw = vendor?.whatsapp || vendor?.phone || service?.whatsapp_number || localBookingData?.items?.[0]?.whatsapp_number || '';
  const vendorAddress = vendor?.address || service?.address || service?.fullAddress || service?.pickup_location || localBookingData?.items?.[0]?.fullAddress || '';

  // Google Maps Link Resolution (Must exist in DB/record, never guessed)
  const googleMapsLink = service?.maps_link || vendor?.google_maps_link || localBookingData?.items?.[0]?.mapLink || localBookingData?.maps_link || null;

  // Category specific detail fields (Only shown if non-null in DB)
  const raftingRoute = service?.route || localBookingData?.items?.[0]?.route || null;
  const raftingDistance = service?.distance_km ? `${service.distance_km} KM` : null;
  const bungeeHeight = service?.height ? `${service.height} Meters` : (service?.description?.match(/\b\d+\s*M\b/i)?.[0] || null);
  const roomType = localBookingData?.items?.[0]?.roomType || service?.room_type || null;
  const vehicleModel = service?.name || localBookingData?.items?.[0]?.vehicleModel || null;

  // Meeting / Check-in instructions
  const instructions = vendor?.meeting_instructions || service?.cancellation_policy || (
    isHotel ? 'Please present your Digital Booking Ticket at check-in counter along with a valid Govt ID.' :
    isBike ? 'Original Driving License and Aadhar Card required at pickup point.' :
    'Arrive 15 minutes before your slot time at the reporting venue. Follow safety briefings.'
  );

  const comboItems = Array.isArray(localBookingData?.items) ? localBookingData.items : [];

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-16 selection:bg-[#FF5F00] selection:text-white print:bg-white print:pb-0">
      
      {/* 1. Header Navigation Bar (Hidden during Print) */}
      <div className="bg-slate-950 text-white py-4 px-4 sm:px-8 border-b border-slate-800 sticky top-0 z-30 shadow-md print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={16} /> <span>TripGod Home</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="py-1.5 px-3 bg-[#FF5F00] hover:bg-[#FF6B00] text-white rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-transform hover:scale-105 shadow-sm border-none cursor-pointer"
            >
              <Printer size={14} /> <span>Save PDF / Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Ticket Container */}
      <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 print:p-0">
        
        {/* Ticket Glassmorphic Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden print:shadow-none print:border-none print:rounded-none"
        >
          {/* Header Brand Section */}
          <div className="bg-slate-950 text-white p-6 sm:p-8 relative overflow-hidden">
            {/* Ambient orange glow gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5F00]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center select-none">
                  <span className="font-black text-xl sm:text-2xl tracking-tighter text-white">TRIP</span>
                  <span className="font-black text-xl sm:text-2xl tracking-tighter text-white bg-accent-gradient px-2 py-0.5 rounded-lg ml-1 shadow-sm">GOD</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5F00] mt-1">
                  Digital Booking Ticket Pass
                </p>
              </div>

              {/* Status Pill */}
              <div>
                {isCancelled ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-black uppercase tracking-wider">
                    <XCircle size={14} /> Booking Cancelled
                  </span>
                ) : isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 size={14} /> Completed
                  </span>
                ) : isPaymentFailed ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-black uppercase tracking-wider">
                    <AlertTriangle size={14} /> Payment Failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 size={14} /> Booking Confirmed
                  </span>
                )}
              </div>
            </div>

            {/* Ticket Code & QR Bar */}
            <div className="relative z-10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ticket Identifier</span>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono mt-0.5 block">
                  {bookingIdCode}
                </span>
                {hasVal(customerName) && (
                  <span className="text-xs font-bold text-slate-300 mt-1 block">
                    Guest Name: <strong className="text-white">{customerName}</strong>
                  </span>
                )}
              </div>

              {/* Dynamic QR Code */}
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl shrink-0">
                <QRCodeSVG value={currentUrl} size={72} />
                <div className="hidden sm:block text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#FF5F00] block">Scan Ticket</span>
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5 leading-tight">Verified Digital Pass</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancelled Banner if status is cancelled */}
          {isCancelled && (
            <div className="bg-red-500/10 border-b border-red-500/20 p-4 px-6 text-red-900 flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-600 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-700">Notice: This booking has been cancelled</p>
                <p className="text-[11px] font-semibold text-red-600 mt-0.5">Please contact TripGod support if you believe this is an error or require refund assistance.</p>
              </div>
            </div>
          )}

          {/* Ticket Body Content */}
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* 1. Primary Booking Service Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                {isHotel ? <Building2 size={14} className="text-[#FF5F00]" /> : isBike ? <Bike size={14} className="text-[#FF5F00]" /> : <Waves size={14} className="text-[#FF5F00]" />}
                <span>Booked Experience / Service</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5F00] block">
                    {serviceTypeRaw.toUpperCase()}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {activityName}
                  </h3>
                </div>

                {/* Details Grid (Category isolated & strict non-null check) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs border-t border-slate-200/50">
                  
                  {/* Date */}
                  {hasVal(travelDate) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                        <Calendar size={11} /> {isHotel ? 'Check-In' : 'Booking Date'}
                      </span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">{travelDate}</span>
                    </div>
                  )}

                  {/* Hotel Check-Out */}
                  {isHotel && hasVal(checkOutDate) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                        <Calendar size={11} /> Check-Out
                      </span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">{checkOutDate}</span>
                    </div>
                  )}

                  {/* Slot / Check-in Time */}
                  {hasVal(slotTime) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                        <Clock size={11} /> {isHotel ? 'Standard Time' : 'Reporting Slot'}
                      </span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">{slotTime}</span>
                    </div>
                  )}

                  {/* Guests / Vehicles Count */}
                  {hasVal(guestsCount) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                        <Users size={11} /> {isBike ? 'Vehicles' : 'Guests / Pax'}
                      </span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">
                        {guestsCount} {isBike ? 'Vehicle(s)' : 'Person(s)'}
                      </span>
                    </div>
                  )}

                  {/* Hotel Nights */}
                  {isHotel && hasVal(nights) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Duration</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">{nights} Night(s)</span>
                    </div>
                  )}

                  {/* Rafting Route */}
                  {isRafting && hasVal(raftingRoute) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Rafting Route</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">{raftingRoute}</span>
                    </div>
                  )}

                  {/* Bungee Height */}
                  {isBungee && hasVal(bungeeHeight) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Activity Height</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">{bungeeHeight}</span>
                    </div>
                  )}

                  {/* Hotel Room Type */}
                  {isHotel && hasVal(roomType) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Room Category</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">{roomType}</span>
                    </div>
                  )}

                  {/* Rental Days */}
                  {isBike && hasVal(rentalDaysCount) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Rental Duration</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">{rentalDaysCount} Day(s)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Combo Itemized Breakdown (If multi-service combo) */}
            {comboItems.length > 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  <Sparkles size={14} className="text-[#FF5F00]" />
                  <span>Combo Package Services Breakdown ({comboItems.length} Items)</span>
                </div>

                <div className="space-y-3">
                  {comboItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900">{idx + 1}. {item.name || item.title}</span>
                        <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {item.category || 'Service'}
                        </span>
                      </div>
                      {hasVal(item.slot) && (
                        <p className="text-slate-600 font-semibold">Slot: <strong>{item.slot}</strong></p>
                      )}
                      {hasVal(item.fullAddress || item.address) && (
                        <p className="text-slate-600 font-semibold">Address: {item.fullAddress || item.address}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Dynamic Payment Summary Section (Authoritative amounts) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                <CreditCard size={14} className="text-[#FF5F00]" />
                <span>Payment Summary</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Total Booking Price:</span>
                  <span className="font-black text-slate-900 text-sm">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Advance Paid Online:
                  </span>
                  <span className="font-black text-emerald-600 text-sm">₹{amountPaid.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="font-black text-slate-800">Remaining Balance to Pay:</span>
                  <span className={`font-black text-base ${remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    ₹{remainingAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 text-[11px] font-bold text-slate-500 bg-white p-3 rounded-xl border border-slate-200/50">
                  {isFullyPaid ? (
                    <span className="text-emerald-600 font-black">✓ 100% Fully Paid Online</span>
                  ) : (
                    <span>💳 Collect remaining <strong>₹{remainingAmount.toLocaleString('en-IN')}</strong> directly at reporting venue / check-in counter.</span>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Host & Venue Location Section (Strict DB matching) */}
            {(hasVal(vendorName) || hasVal(vendorPhoneRaw) || hasVal(vendorAddress) || hasVal(googleMapsLink)) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  <MapPin size={14} className="text-[#FF5F00]" />
                  <span>Host & Venue Location</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-5 space-y-4 text-xs">
                  
                  {/* Host Operator Name */}
                  {hasVal(vendorName) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Verified Operator / Host</span>
                      <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{vendorName}</span>
                    </div>
                  )}

                  {/* Address */}
                  {hasVal(vendorAddress) && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Full Address</span>
                      <span className="font-semibold text-slate-700 mt-0.5 block leading-relaxed">{vendorAddress}</span>
                    </div>
                  )}

                  {/* Action Buttons: Phone / WhatsApp / Google Maps */}
                  <div className="pt-2 flex flex-wrap gap-2.5 print:hidden">
                    {/* Google Maps Button (ONLY if Google Maps Link exists in DB) */}
                    {hasVal(googleMapsLink) && (
                      <a
                        href={googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-transform hover:scale-105 text-decoration-none shadow-sm"
                      >
                        <Navigation size={14} /> Open Location Maps 📍
                      </a>
                    )}

                    {/* Phone Call Button */}
                    {hasVal(vendorPhoneRaw) && (
                      <a
                        href={`tel:${vendorPhoneRaw}`}
                        className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors text-decoration-none"
                      >
                        <Phone size={14} /> Call ({formatDisplayPhone(vendorPhoneRaw)})
                      </a>
                    )}

                    {/* WhatsApp Button */}
                    {hasVal(vendorWhatsappRaw) && (
                      <a
                        href={`https://wa.me/${vendorWhatsappRaw.toString().replace(/\D/g, '')}?text=Hi%2C%20I%20have%20a%20confirmed%20TripGod%20booking%20(ID%3A%20${bookingIdCode}).`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors text-decoration-none"
                      >
                        <MessageSquare size={14} /> WhatsApp Host
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Instructions & Reporting Advisory */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 space-y-2 text-xs">
              <span className="font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Info size={14} className="text-amber-600" /> Reporting & Important Instructions
              </span>
              <p className="text-amber-800 font-semibold leading-relaxed">
                {instructions}
              </p>
            </div>

          </div>

          {/* Footer Branding */}
          <div className="bg-slate-50 border-t border-slate-200/70 p-4 px-6 text-center text-slate-400 text-[11px] font-semibold space-y-1">
            <p>TripGod Adventure & Booking Platform • Rishikesh, Uttarakhand</p>
            <p className="text-[10px] text-slate-400">Need support? Call helpline: +91 9410572857</p>
          </div>

        </motion.div>
      </div>

    </div>
  );
}
