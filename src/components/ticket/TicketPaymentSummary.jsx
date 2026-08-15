import React from 'react';
import { ShieldCheck, CreditCard } from 'lucide-react';

export default function TicketPaymentSummary({ 
  advancePaid = 0, 
  balancePayable = 0, 
  balanceWording = "Balance Payable at Venue" 
}) {
  const advance = Number(advancePaid || 0);
  const remaining = Number(balancePayable || 0);

  return (
    <div className="px-6 py-3.5 bg-amber-50/70 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Advance Paid Online: <strong className="text-emerald-700 font-black">₹{advance.toLocaleString('en-IN')}</strong></span>
      </div>
      <div className="flex items-center gap-1 text-slate-800 font-bold">
        <CreditCard className="w-3.5 h-3.5 text-[#FF5F00] shrink-0" />
        <span>{balanceWording}: <strong className="text-[#FF5F00] font-black">₹{remaining.toLocaleString('en-IN')}</strong></span>
      </div>
    </div>
  );
}
