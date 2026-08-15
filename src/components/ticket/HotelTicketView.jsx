import React from 'react';
import { Building2, Calendar, Clock, MapPin, Phone, ExternalLink, DoorClosed, Sparkles } from 'lucide-react';
import TicketHeader from './TicketHeader';
import TicketQRSection from './TicketQRSection';
import TicketPaymentSummary from './TicketPaymentSummary';

const formatDisplayPhone = (phone) => {
  if (!phone) return '';
  let clean = phone.toString().replace(/\D/g, '');
  if (clean.length === 10) return `+91 ${clean.substring(0, 5)} ${clean.substring(5)}`;
  if (clean.length === 12 && clean.startsWith('91')) return `+91 ${clean.substring(2, 7)} ${clean.substring(7)}`;
  return `+${clean}`;
};

export default function HotelTicketView({ booking, onBackToHome }) {
  const item = booking.items?.[0] || {};
  const vendor = item.vendors || booking.vendor || {};
  
  // Clean Single Source of Truth Field Resolutions
  const rawName = item.name || item.title || booking.activityName || booking.name || '';
  const hotelName = (!rawName || rawName === 'Hotel' || rawName === 'hotels')
    ? (booking.activityName && booking.activityName !== 'Hotel' ? booking.activityName : 'Abhinandan Homestay & Resort')
    : rawName;

  const checkInDate = item.checkInDate || booking.checkInDate || booking.date || 'Flexible Date';
  const checkInTime = item.checkInTime || vendor.check_in_time || '12:00 PM';
  const checkOutDate = item.checkOutDate || booking.checkOutDate || 'Next Day';
  const checkOutTime = item.checkOutTime || vendor.check_out_time || '11:00 AM';
  
  const roomsCount = Number(item.roomsCount || booking.roomsCount || 1);
  const totalGuests = Number(item.guests || booking.guests || item.adultsCount || booking.adultsCount || 2);
  const childrenCount = Number(item.childrenCount || booking.childrenCount || 0);
  const roomType = item.roomType || booking.roomType || 'Standard Deluxe Room';

  // Strict Meal Plan Validation (NO Hardcoded Breakfast Default)
  const rawMealPlan = item.mealPlan || item.inclusions || item.meals || booking.mealPlan;
  const isValidMealPlan = rawMealPlan && 
    typeof rawMealPlan === 'string' && 
    !rawMealPlan.toLowerCase().includes('not available') && 
    !rawMealPlan.toLowerCase().includes('no meal') && 
    !rawMealPlan.toLowerCase().includes('none') &&
    rawMealPlan.trim().length > 0;

  // Format exact guest breakdown string: e.g. "1 ROOM · 3 GUESTS · DELUXE ROOM"
  const roomLabel = `${roomsCount} ${roomsCount > 1 ? 'ROOMS' : 'ROOM'}`;
  const guestLabel = `${totalGuests} ${totalGuests > 1 ? 'GUESTS' : 'GUEST'}`;
  const childLabel = childrenCount > 0 ? ` · ${childrenCount} ${childrenCount > 1 ? 'CHILDREN' : 'CHILD'}` : '';
  const guestBreakdownStr = `${roomLabel} · ${guestLabel}${childLabel} · ${roomType.toUpperCase()}`;

  // Vendor contact & address resolution
  const vendorName = item.vendorName || item.vendors?.name || vendor.name;
  const vendorPhone = item.operatorPhone || item.phone_number || item.whatsapp_number || item.phone || vendor.phone || vendor.whatsapp || booking.vendorPhone || '9410572857';
  const fullAddress = item.fullAddress || item.address || vendor.address || item.location || vendor.location || 'Rishikesh, Uttarakhand';
  // Prioritize live backend google_maps_link over stale item.mapLink
  let rawMap = item.google_maps_link || vendor.google_maps_link || item.mapLink || booking.googleMapsLink;
  if (hotelName.toLowerCase().includes('abhinandan') && (!rawMap || rawMap.includes('cEXc2dxuNpDF5k6V8'))) {
    rawMap = 'https://maps.app.goo.gl/MrQFRbjC4Etio3dS7';
  }
  const googleMapsUrl = rawMap;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 print:bg-white print:text-black">
      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          <TicketHeader 
            bookingId={booking.bookingId} 
            customerName={booking.customerName} 
            badgeText="Confirmed Hotel Pass"
            onBackToHome={onBackToHome}
          />

          <TicketQRSection 
            bookingId={booking.bookingId}
            primaryDate={`Check-in: ${checkInDate}`}
            primaryTime={`Time: ${checkInTime}`}
            instructions="Show QR code or Booking ID at hotel reception desk"
          />

          <TicketPaymentSummary 
            advancePaid={booking.advancePaid}
            balancePayable={booking.remainingPaid}
            balanceWording="Balance Payable at Hotel"
          />

          <div className="p-6 space-y-6">
            
            {/* Hotel Name & Category Title */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Hotel / Homestay Accommodation
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">{hotelName}</h2>
              {vendorName && vendorName !== hotelName && !vendorName.toLowerCase().includes('evergreen') && (
                <p className="text-xs font-bold text-slate-500 mt-0.5">Operated by: {vendorName}</p>
              )}
            </div>

            {/* Check-In / Check-Out Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-600" /> Check-in Date
                </span>
                <p className="font-black text-slate-900 text-sm">{checkInDate}</p>
                <p className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Time: {checkInTime}
                </p>
              </div>

              <div className="space-y-1 border-l border-slate-200 pl-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-600" /> Check-out Date
                </span>
                <p className="font-black text-slate-900 text-sm">{checkOutDate}</p>
                <p className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Time: {checkOutTime}
                </p>
              </div>
            </div>

            {/* Room & Guest Breakdown Pill */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 flex items-center gap-3">
              <DoorClosed className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Accommodation Breakdown</span>
                <p className="text-xs font-black tracking-wide text-indigo-950 mt-0.5">{guestBreakdownStr}</p>
              </div>
            </div>

            {/* Meal Plan / Inclusions (Rendered ONLY if explicitly provided and available) */}
            {isValidMealPlan && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Meal Plan / Inclusions: <strong className="text-slate-900">{rawMealPlan}</strong></span>
              </div>
            )}

            {/* Full Hotel Address & Exact Backend Map Link */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Full Hotel Address
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">{fullAddress}</p>
              </div>

              {googleMapsUrl ? (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <MapPin className="w-4 h-4 text-white" /> OPEN VENUE MAP <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              ) : null}
            </div>

            {/* Hotel Contact Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Hotel Host Contact</span>
                <p className="text-xs font-black text-slate-800 mt-0.5">{formatDisplayPhone(vendorPhone)}</p>
              </div>
              <a
                href={`tel:+${vendorPhone.toString().replace(/\D/g, '')}`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#FF5F00]" /> Call Hotel Desk
              </a>
            </div>

            {/* Check-in Instructions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Check-in Requirements</span>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Please present a valid Government ID (Aadhaar / Passport / Driving Licence) for all guests upon arrival at the hotel reception desk.
              </p>
            </div>

          </div>

          {/* Footer Helpline */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs font-medium text-slate-500">
            Need assistance? <a href="tel:+919410572857" className="font-black text-[#FF5F00] hover:underline ml-1">TripGod Helpline: +91 9410572857</a>
          </div>

        </div>
      </main>
    </div>
  );
}
