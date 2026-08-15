import React from 'react';
import { Waves, Calendar, Clock, MapPin, Phone, ExternalLink, Users, AlertCircle, Compass } from 'lucide-react';
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

export default function RaftingTicketView({ booking, onBackToHome }) {
  const item = booking.items?.[0] || {};
  const vendor = item.vendors || booking.vendor || {};

  // Single Source of Truth Field Resolutions
  const activityName = item.name || item.title || booking.activityName || 'Rishikesh White Water Rafting';
  const stretch = item.stretch || booking.stretch || '16 KM';
  const route = item.route || booking.route || 'Shivpuri to Nim Beach';
  const activityDate = item.date || booking.date || 'Travel Date';
  const reportingTime = item.slot || item.selectedSlot || booking.slot || '09:00 AM';
  const participantsCount = item.guests || booking.guests || 1;

  // Participant & Stretch pill string: e.g. "16 KM · 4 PARTICIPANTS"
  const stretchLabel = stretch ? stretch.toUpperCase() : 'WHITE WATER RAFTING';
  const participantLabel = `${participantsCount} ${participantsCount > 1 ? 'PARTICIPANTS' : 'PARTICIPANT'}`;
  const raftingBreakdownStr = `${stretchLabel} · ${participantLabel}`;

  // Vendor contact & address strictly from backend
  const vendorName = vendor.name || item.vendorName || 'Rishikesh River Rafting Center';
  const vendorPhone = item.operatorPhone || vendor.phone || vendor.whatsapp || booking.vendorPhone || '9410572857';
  const meetingPointAddress = item.fullAddress || vendor.address || item.address || 'Rishikesh Rafting Office, Tapovan / Shivpuri, Rishikesh';
  const googleMapsUrl = item.mapLink || vendor.google_maps_link || item.google_maps_link || booking.googleMapsLink;
  const meetingInstructions = vendor.meeting_instructions || item.meeting_instructions || 'Please arrive 15 minutes before your scheduled reporting time at the rafting office for safety briefing and gear fitting.';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 print:bg-white print:text-black">
      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          <TicketHeader 
            bookingId={booking.bookingId} 
            customerName={booking.customerName} 
            badgeText="Confirmed Adventure Pass"
            onBackToHome={onBackToHome}
          />

          <TicketQRSection 
            bookingId={booking.bookingId}
            primaryDate={`Reporting Date: ${activityDate}`}
            primaryTime={`Time: ${reportingTime}`}
            instructions="Present QR code at Rafting Office desk for river gear check-in"
          />

          <TicketPaymentSummary 
            advancePaid={booking.advancePaid}
            balancePayable={booking.remainingPaid}
            balanceWording="Balance Payable at Reporting Office"
          />

          <div className="p-6 space-y-6">
            
            {/* Rafting Pass Title & Name */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Waves className="w-5 h-5 text-cyan-600 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-100">
                  River Adventure Reporting Pass
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-snug">{activityName}</h2>
              {vendorName && (
                <p className="text-xs font-bold text-slate-500 mt-0.5">Operator: {vendorName}</p>
              )}
            </div>

            {/* Reporting Date & Reporting Time Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-600" /> Reporting Date
                </span>
                <p className="font-black text-slate-900 text-sm">{activityDate}</p>
              </div>

              <div className="space-y-1 border-l border-cyan-200 pl-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#FF5F00]" /> Reporting Time
                </span>
                <p className="font-black text-[#FF5F00] text-sm">{reportingTime}</p>
              </div>
            </div>

            {/* Rafting Stretch & Participants Breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center gap-3 shadow-sm">
              <Compass className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Stretch & Participants</span>
                <p className="text-xs font-black tracking-wider text-white mt-0.5 font-mono">{raftingBreakdownStr}</p>
                {route && <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Route: {route}</p>}
              </div>
            </div>

            {/* Full Reporting Address & Exact Backend Map Link */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Reporting Point / Office Address
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">{meetingPointAddress}</p>
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

            {/* Operator Contact Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Operator Contact</span>
                <p className="text-xs font-black text-slate-800 mt-0.5">{formatDisplayPhone(vendorPhone)}</p>
              </div>
              <a
                href={`tel:+${vendorPhone.toString().replace(/\D/g, '')}`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#FF5F00]" /> Call Rafting Office
              </a>
            </div>

            {/* Meeting Instructions */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Meeting & Safety Instructions
              </span>
              <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                {meetingInstructions}
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
