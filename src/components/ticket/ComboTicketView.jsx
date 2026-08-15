import React from 'react';
import { Sparkles, Building2, Waves, Zap, Bike, Flame, Compass, MapPin, Phone, ExternalLink, Clock, Calendar, ShieldCheck } from 'lucide-react';
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

export default function ComboTicketView({ booking, onBackToHome }) {
  const items = Array.isArray(booking.items) && booking.items.length > 0
    ? booking.items
    : [{
        name: booking.activityName || 'Rishikesh Combo Pass',
        category: 'tours',
        slot: booking.slot || 'Flexible',
        fullAddress: 'Rishikesh, Uttarakhand'
      }];

  const getItemIcon = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'hotels' || c === 'hotel' || c === 'homestay') return <Building2 className="w-5 h-5 text-indigo-600" />;
    if (c === 'rafting' || c === 'kayaking') return <Waves className="w-5 h-5 text-cyan-600" />;
    if (c === 'bungee' || c === 'swing' || c === 'zipline') return <Zap className="w-5 h-5 text-purple-600" />;
    if (c === 'bikerent' || c === 'bikes' || c === 'bike') return <Bike className="w-5 h-5 text-amber-600" />;
    if (c === 'camping' || c === 'camp') return <Flame className="w-5 h-5 text-orange-600" />;
    return <Compass className="w-5 h-5 text-blue-600" />;
  };

  const getItemCategoryLabel = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'hotels' || c === 'hotel' || c === 'homestay') return 'Hotel Accommodation';
    if (c === 'rafting') return 'River Rafting Adventure';
    if (c === 'bungee') return 'Freestyle Bungee Jump';
    if (c === 'swing') return 'Giant Swing Adventure';
    if (c === 'zipline') return 'Flying Fox Zipline';
    if (c === 'bikerent' || c === 'bikes') return 'Vehicle Rental';
    if (c === 'camping') return 'Riverside Camping';
    return 'Adventure Service';
  };

  const getBalanceWordingForItem = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('hotel')) return 'Hotel';
    if (c.includes('rafting')) return 'Reporting Office';
    if (c.includes('bungee') || c.includes('swing') || c.includes('zipline')) return 'Venue';
    if (c.includes('bike')) return 'Pickup Garage';
    if (c.includes('camp')) return 'Camp';
    return 'Venue';
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 print:bg-white print:text-black">
      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          <TicketHeader 
            bookingId={booking.bookingId} 
            customerName={booking.customerName} 
            badgeText="Confirmed Combo Package Pass"
            onBackToHome={onBackToHome}
          />

          <TicketQRSection 
            bookingId={booking.bookingId}
            primaryDate={`Date: ${booking.date || 'Travel Date'}`}
            instructions={`Show QR code at venue desk for all ${items.length} booked services`}
          />

          <TicketPaymentSummary 
            advancePaid={booking.advancePaid}
            balancePayable={booking.remainingPaid}
            balanceWording="Total Balance Payable at Venues"
          />

          <div className="p-6 space-y-6">
            
            {/* Header Title */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5F00] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Multi-Service Combo Pass
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">Booked Combo Services ({items.length})</h2>
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Itemized Details
              </span>
            </div>

            {/* Render itemized card stack for every booked item in the combo */}
            <div className="space-y-5">
              {items.map((item, index) => {
                const vendor = item.vendors || booking.vendor || {};
                const cat = (item.category || item.type || 'service').toLowerCase();
                const itemName = item.name || item.title || `Combo Item ${index + 1}`;
                const vendorName = vendor.name || item.vendorName;
                const vendorPhone = item.operatorPhone || vendor.phone || vendor.whatsapp || booking.vendorPhone || '9410572857';
                const fullAddress = item.fullAddress || vendor.address || item.address || 'Rishikesh, Uttarakhand';
                const googleMapsUrl = item.mapLink || vendor.google_maps_link || item.google_maps_link;
                const itemSlot = item.slot || item.selectedSlot || 'Flexible Timing';
                const itemDate = item.date || booking.date || 'Travel Date';

                return (
                  <div 
                    key={item.id || index}
                    className="p-5 rounded-2xl bg-white border border-slate-250 shadow-sm space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                        {getItemIcon(cat)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            Service {index + 1} • {getItemCategoryLabel(cat)}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1 leading-snug">{itemName}</h3>
                        {vendorName && (
                          <p className="text-[11px] font-bold text-slate-500 mt-0.5">Operator: {vendorName}</p>
                        )}
                      </div>
                    </div>

                    {/* Timing & Date Grid for this item */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Date</span>
                        <span className="font-extrabold text-slate-900 text-[11px] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#FF5F00]" /> {itemDate}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Slot / Timing</span>
                        <span className="font-extrabold text-slate-900 text-[11px] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-emerald-600" /> {itemSlot}
                        </span>
                      </div>
                    </div>

                    {/* Specific Item Full Address */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" /> Venue / Meeting Address
                      </span>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">{fullAddress}</p>
                    </div>

                    {/* Action Buttons: Exact Backend Map Link + Specific Operator Contact */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      {googleMapsUrl ? (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> OPEN VENUE MAP <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : <div />}

                      <a
                        href={`tel:+${vendorPhone.toString().replace(/\D/g, '')}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#FF5F00]" /> Call Host ({formatDisplayPhone(vendorPhone)})
                      </a>
                    </div>

                  </div>
                );
              })}
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
