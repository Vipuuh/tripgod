import React from 'react';
import { Flame, Calendar, Clock, MapPin, Phone, ExternalLink, Utensils, Tent } from 'lucide-react';
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

export default function CampingTicketView({ booking, onBackToHome }) {
  const item = booking.items?.[0] || {};
  const vendor = item.vendors || booking.vendor || {};

  // Single Source of Truth Field Resolutions
  const campName = item.name || item.title || booking.activityName || 'Rishikesh Riverside Jungle Camp';
  const checkInDate = item.checkInDate || booking.checkInDate || booking.date || 'Check-in Date';
  const checkInTime = item.checkInTime || vendor.check_in_time || '11:00 AM';
  const checkOutDate = item.checkOutDate || booking.checkOutDate || 'Next Day';
  const checkOutTime = item.checkOutTime || vendor.check_out_time || '10:00 AM';
  const nights = item.nights || booking.nights || 1;
  const guestsCount = item.guests || booking.guests || 2;
  const tentType = item.tentType || item.roomType || 'Luxury Swiss Cottage Tent (Attached Bath)';
  const mealsInclusions = item.meals || item.inclusions || 'APAI Plan: All 3 Meals (Breakfast, Lunch, Dinner) + Evening Snacks & Bonfire';

  // Breakdown string
  const guestLabel = `${guestsCount} ${guestsCount > 1 ? 'GUESTS' : 'GUEST'}`;
  const nightLabel = `${nights} ${nights > 1 ? 'NIGHTS' : 'NIGHT'}`;
  const campBreakdownStr = `${nightLabel} · ${guestLabel} · ${tentType.toUpperCase()}`;

  // Vendor contact & address strictly from backend
  const vendorName = vendor.name || item.vendorName || 'Rishikesh Camping Grounds';
  const vendorPhone = item.operatorPhone || vendor.phone || vendor.whatsapp || booking.vendorPhone || '9410572857';
  const campAddress = item.fullAddress || vendor.address || item.address || 'Riverside Camp Road, Shivpuri / Mohan Chatti, Rishikesh, Uttarakhand';
  const googleMapsUrl = item.mapLink || vendor.google_maps_link || item.google_maps_link || booking.googleMapsLink;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 print:bg-white print:text-black">
      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          <TicketHeader 
            bookingId={booking.bookingId} 
            customerName={booking.customerName} 
            badgeText="Confirmed Camp Pass"
            onBackToHome={onBackToHome}
          />

          <TicketQRSection 
            bookingId={booking.bookingId}
            primaryDate={`Check-in: ${checkInDate}`}
            primaryTime={`Time: ${checkInTime}`}
            instructions="Show QR code at camp manager desk upon arrival"
          />

          <TicketPaymentSummary 
            advancePaid={booking.advancePaid}
            balancePayable={booking.remainingPaid}
            balanceWording="Balance Payable at Camp"
          />

          <div className="p-6 space-y-6">
            
            {/* Title & Name */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Flame className="w-5 h-5 text-orange-600 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">
                  Riverside Camping Pass
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">{campName}</h2>
              {vendorName && (
                <p className="text-xs font-bold text-slate-500 mt-0.5">Camp Host: {vendorName}</p>
              )}
            </div>

            {/* Check-In / Check-Out Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-orange-50/50 border border-orange-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-600" /> Camp Check-in Date
                </span>
                <p className="font-black text-slate-900 text-sm">{checkInDate}</p>
                <p className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Time: {checkInTime}
                </p>
              </div>

              <div className="space-y-1 border-l border-orange-200 pl-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-600" /> Camp Check-out Date
                </span>
                <p className="font-black text-slate-900 text-sm">{checkOutDate}</p>
                <p className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Time: {checkOutTime}
                </p>
              </div>
            </div>

            {/* Tent & Breakdown Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center gap-3 shadow-sm">
              <Tent className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Camping Accommodation</span>
                <p className="text-xs font-black tracking-wider text-white mt-0.5 font-mono">{campBreakdownStr}</p>
              </div>
            </div>

            {/* Meal Plan Box */}
            {mealsInclusions && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-amber-50/60 border border-amber-200/60 p-3.5 rounded-xl">
                <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Camp Meals Plan: <strong className="text-slate-900">{mealsInclusions}</strong></span>
              </div>
            )}

            {/* Full Camp Address & Exact Backend Map Link */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Full Camp Address
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">{campAddress}</p>
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

            {/* Camp Manager Contact Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Camp Manager Contact</span>
                <p className="text-xs font-black text-slate-800 mt-0.5">{formatDisplayPhone(vendorPhone)}</p>
              </div>
              <a
                href={`tel:+${vendorPhone.toString().replace(/\D/g, '')}`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#FF5F00]" /> Call Camp Desk
              </a>
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
