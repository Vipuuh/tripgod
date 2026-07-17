import React from 'react';
import { ShieldCheck, Compass, Lock, Zap, Award, Calendar } from 'lucide-react';

export default function TrustSignals({ freeCancellation = true, instantConfirmation = true }) {
  const signals = [
    { id: 'verified', label: 'TripGod Verified', desc: 'Pre-screened & safety certified operators', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { id: 'guides', label: 'Certified Guides', desc: 'Government approved experts only', icon: Compass, color: 'text-sky-600 bg-sky-50 border-sky-100' },
    { id: 'secure', label: 'Secure Booking', desc: '10% token payment, remaining on arrival', icon: Lock, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    { id: 'lowest', label: 'Lowest Price', desc: '100% price match guarantee', icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-100' }
  ];

  if (instantConfirmation) {
    signals.push({ id: 'instant', label: 'Instant Confirmation', desc: 'Voucher sent on WhatsApp immediately', icon: Zap, color: 'text-indigo-650 bg-indigo-50 border-indigo-100' });
  }

  if (freeCancellation) {
    signals.push({ id: 'cancellation', label: 'Free Cancellation', desc: '100% refund up to 24 hours prior', icon: Calendar, color: 'text-cyan-650 bg-cyan-50 border-cyan-100' });
  }

  return (
    <div className="w-full space-y-4 font-sans text-left">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust & Guarantees</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <div 
              key={sig.id} 
              className="flex gap-3 bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs hover:border-slate-350 transition-colors"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${sig.color} shadow-xs`}>
                <Icon size={16} className="stroke-[2.5]" />
              </div>
              <div className="space-y-0.5">
                <span className="block font-black text-xs text-slate-900 uppercase leading-snug">
                  {sig.label}
                </span>
                <span className="block text-[10px] text-slate-500 font-semibold leading-normal">
                  {sig.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
