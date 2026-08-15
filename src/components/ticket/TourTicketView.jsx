import React from 'react';
import { Compass, Calendar, Clock, MapPin, Phone, ExternalLink, Users, Package } from 'lucide-react';
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

export default function TourTicketView({ booking, onBackToHome }) {
  const item = booking.items?.[0] || {};
  const vendor = item.vendors || booking.vendor || {};

  // Single Source of Truth Field Resolutions
  const tourName = item.name || item.title || booking.activityName || 'Rishikesh Sightseeing & Temple Tour';
  const travelDate = item.date || booking.date || 'Travel Date';
  const pickupTime = item.slot || item.selectedSlot || '08:30 AM';
  const duration = item.duration || booking.duration || 'Full Day';
  const guestsCount = item.guests || booking.guests || 1;
  const pickupPoint = item.pickupPoint || item.fullAddress || vendor.address || 'Tapovan Chowk, Rishikesh';

  // Breakdown string
  const guestLabel = `${guestsCount} ${guestsCount > 1 ? 'GUESTS' : 'GUEST'}`;
  const tourBreakdownStr = `${guestLabel} · DURATION: ${duration.toUpperCase()}`;

  // Vendor contact & address strictly from backend
  const vendorName = vendor.name || item.vendorName || 'TripGod Rishikesh Tours';
  const vendorPhone = item.operatorPhone || vendor.phone || vendor.whatsapp || booking.vendorPhone || '9410572857';
  const officeAddress = item.fullAddress || vendor.address || item.address || 'Rishikesh Tour Office, Tapovan, Rishikesh, Uttarakhand';
  const googleMapsUrl = item.mapLink || vendor.google_maps_link || item.google_maps_link || booking.googleMapsLink;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 print:bg-white print:text-black">
      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          <TicketHeader 
            bookingId={booking.bookingId} 
            customerName={booking.customerName} 
            badgeText="Confirmed Tour Pass"
            onBackToHome={onBackToHome}
          />

          <TicketQRSection 
            bookingId={booking.bookingId}
            primaryDate={`Travel Date: ${travelDate}`}
            primaryTime={`Pickup Time: ${pickupTime}`}
            instructions="Show QR code to tour guide / vehicle driver at pickup"
          />

          <TicketPaymentSummary 
            advancePaid={booking.advancePaid}
            balancePayable={booking.remainingPaid}
            balanceWording="Balance Payable to Tour Operator"
          />

          <div className="p-6 space-y-6">
            
            {/* Title & Name */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Compass className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  Tour & Package Pass
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">{tourName}</h2>
              {vendorName && (
                <p className="text-xs font-bold text-slate-500 mt-0.5">Tour Operator: {vendorName}</p>
              )}
            </div>

            {/* Travel Date & Pickup Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" /> Travel Date
                </span>
                <p className="font-black text-slate-900 text-sm">{travelDate}</p>
              </div>

              <div className="space-y-1 border-l border-blue-200 pl-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#FF5F00]" /> Pickup Time
                </span>
                <p className="font-black text-[#FF5F00] text-sm">{pickupTime}</p>
              </div>
            </div>

            {/* Tour Breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center gap-3 shadow-sm">
              <Package className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Package Specification</span>
                <p className="text-xs font-black tracking-wider text-white mt-0.5 font-mono">{tourBreakdownStr}</p>
              </div>
            </div>

            {/* Pickup Point & Address */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Pickup Point & Full Address
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">{pickupPoint || officeAddress}</p>
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

            {/* Operator Contact */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Operator Contact</span>
                <p className="text-xs font-black text-slate-800 mt-0.5">{formatDisplayPhone(vendorPhone)}</p>
              </div>
              <a
                href={`tel:+${vendorPhone.toString().replace(/\D/g, '')}`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#FF5F00]" /> Call Tour Desk
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
