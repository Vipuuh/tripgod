import React from 'react';
import { ShieldCheck, Compass, Lock, Zap, Award, Calendar } from 'lucide-react';

export default function TrustSignals({ freeCancellation = true, instantConfirmation = true }) {
  const signals = [
    { id: 'verified', label: 'Verified Operator', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50/80 border-emerald-100/80' },
    { id: 'guides', label: 'Certified Guides', icon: Compass, color: 'text-sky-700 bg-sky-50/80 border-sky-100/80' },
    { id: 'secure', label: '10% Advance Booking', icon: Lock, color: 'text-rose-700 bg-rose-50/80 border-rose-100/80' },
    { id: 'lowest', label: 'Lowest Price Guarantee', icon: Award, color: 'text-amber-700 bg-amber-50/80 border-amber-100/80' }
  ];

  if (instantConfirmation) {
    signals.push({ id: 'instant', label: 'Instant Confirmation', icon: Zap, color: 'text-indigo-700 bg-indigo-50/80 border-indigo-100/80' });
  }

  if (freeCancellation) {
    signals.push({ id: 'cancellation', label: 'Free Cancellation (24h)', icon: Calendar, color: 'text-cyan-700 bg-cyan-50/80 border-cyan-100/80' });
  }

  return (
    <div className="w-full space-y-2 font-sans text-left">
      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trust & Guarantees</h4>
      
      <div className="flex flex-wrap gap-1.5">
        {signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <div 
              key={sig.id} 
              className="flex items-center gap-1 px-2.5 py-1.5 border rounded-lg shadow-3xs bg-white text-slate-800 border-slate-200"
            >
              <Icon size={12} className="stroke-[2.5] shrink-0 text-[#FF6B00]" />
              <span className="font-black text-[9px] uppercase tracking-wide text-slate-700">
                {sig.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
