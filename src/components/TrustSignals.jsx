import React from 'react';
import { ShieldCheck, Compass, Lock, Zap, Award, Calendar } from 'lucide-react';

export default function TrustSignals({ freeCancellation = true, instantConfirmation = true }) {
  const signals = [
    { id: 'verified', label: 'Verified Operator', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200/60' },
    { id: 'guides', label: 'Certified Guides', icon: Compass, color: 'text-sky-700 bg-sky-50 border-sky-200/60' },
    { id: 'secure', label: '10% Advance Booking', icon: Lock, color: 'text-orange-700 bg-orange-50 border-orange-200/60' },
    { id: 'lowest', label: 'Best Price Guarantee', icon: Award, color: 'text-amber-700 bg-amber-50 border-amber-200/60' }
  ];

  if (instantConfirmation) {
    signals.push({ id: 'instant', label: 'Instant Confirmation', icon: Zap, color: 'text-indigo-700 bg-indigo-50 border-indigo-200/60' });
  }

  if (freeCancellation) {
    signals.push({ id: 'cancellation', label: 'Free Cancellation (24h)', icon: Calendar, color: 'text-teal-700 bg-teal-50 border-teal-200/60' });
  }

  return (
    <div className="w-full space-y-2.5 font-sans text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-display">Trust & Guarantees</h4>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">100% Verified</span>
      </div>
      
      {/* Symmetrical 2x3 Grid with crisp borders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <div 
              key={sig.id} 
              className={`flex items-center gap-2 px-2.5 py-2 border rounded-xl bg-white shadow-2xs hover:shadow-xs transition-all ${sig.color.split(' ')[2] || 'border-slate-200'}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${sig.color.split(' ')[1]}`}>
                <Icon size={13} className={`stroke-[2.5] ${sig.color.split(' ')[0]}`} />
              </div>
              <span className="font-bold text-[10.5px] text-slate-800 leading-tight">
                {sig.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

