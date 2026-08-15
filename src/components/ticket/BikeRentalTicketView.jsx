import React from 'react';
import { Bike, Calendar, Clock, MapPin, Phone, ExternalLink, ShieldCheck, Fuel } from 'lucide-react';
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

export default function BikeRentalTicketView({ booking, onBackToHome }) {
  const item = booking.items?.[0] || {};
  const vendor = item.vendors || booking.vendor || {};

  // Single Source of Truth Field Resolutions
  const vehicleName = item.name || item.title || booking.activityName || 'Royal Enfield Classic 350';
  const pickupDate = item.pickupDate || booking.date || 'Pickup Date';
  const pickupTime = item.pickupTime || item.slot || '09:00 AM';
  const returnDate = item.returnDate || booking.returnDate || 'Return Date';
  const returnTime = item.returnTime || '08:00 PM';
  const duration = item.duration || booking.duration || '1 Day';
  const vehicleCount = item.vehiclesCount || item.guests || booking.guests || 1;
  const helmetInfo = item.helmetInfo || '2 Helmets Included';
  const licenseReq = item.licenseInfo || 'Original Driving Licence & Aadhaar Required';

  // Breakdown string
  const vehicleLabel = `${vehicleCount} ${vehicleCount > 1 ? 'VEHICLES' : 'VEHICLE'}`;
  const bikeBreakdownStr = `${vehicleLabel} · DURATION: ${duration.toUpperCase()} · ${helmetInfo.toUpperCase()}`;

  // Vendor contact & address strictly from backend
  const vendorName = vendor.name || item.vendorName || 'TripGod Bike Rental Garage';
  const vendorPhone = item.operatorPhone || vendor.phone || vendor.whatsapp || booking.vendorPhone || '9410572857';
  const garageAddress = item.fullAddress || vendor.address || item.address || 'Bike Garage, Tapovan Main Road, Rishikesh, Uttarakhand';
  const googleMapsUrl = item.mapLink || vendor.google_maps_link || item.google_maps_link || booking.googleMapsLink;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 print:bg-white print:text-black">
      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          <TicketHeader 
            bookingId={booking.bookingId} 
            customerName={booking.customerName} 
            badgeText="Confirmed Vehicle Rental Pass"
            onBackToHome={onBackToHome}
          />

          <TicketQRSection 
            bookingId={booking.bookingId}
            primaryDate={`Pickup: ${pickupDate}`}
            primaryTime={`Time: ${pickupTime}`}
            instructions="Show QR code & Driving Licence at garage pickup desk"
          />

          <TicketPaymentSummary 
            advancePaid={booking.advancePaid}
            balancePayable={booking.remainingPaid}
            balanceWording="Balance Payable at Pickup Garage"
          />

          <div className="p-6 space-y-6">
            
            {/* Title & Name */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Bike className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                  Vehicle Rental Pass
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">{vehicleName}</h2>
              {vendorName && (
                <p className="text-xs font-bold text-slate-500 mt-0.5">Garage: {vendorName}</p>
              )}
            </div>

            {/* Pickup & Return Timing Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-600" /> Vehicle Pickup Date
                </span>
                <p className="font-black text-slate-900 text-sm">{pickupDate}</p>
                <p className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Time: {pickupTime}
                </p>
              </div>

              <div className="space-y-1 border-l border-amber-200 pl-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-600" /> Vehicle Return Date
                </span>
                <p className="font-black text-slate-900 text-sm">{returnDate}</p>
                <p className="font-bold text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Time: {returnTime}
                </p>
              </div>
            </div>

            {/* Breakdown Box */}
            <div className="p-3.5 rounded-2xl bg-amber-950 text-white flex items-center gap-3 shadow-sm">
              <Fuel className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">Rental Specification</span>
                <p className="text-xs font-black tracking-wider text-white mt-0.5 font-mono">{bikeBreakdownStr}</p>
              </div>
            </div>

            {/* Full Garage Address & Exact Backend Map Link */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Full Pickup Garage Address
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">{garageAddress}</p>
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

            {/* Garage Contact Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Garage Contact</span>
                <p className="text-xs font-black text-slate-800 mt-0.5">{formatDisplayPhone(vendorPhone)}</p>
              </div>
              <a
                href={`tel:+${vendorPhone.toString().replace(/\D/g, '')}`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#FF5F00]" /> Call Garage Desk
              </a>
            </div>

            {/* Licence Requirement Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Licence & Deposit Policy
              </span>
              <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                {licenseReq}. Fuel level is provided at handover and must be returned at equal level.
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
