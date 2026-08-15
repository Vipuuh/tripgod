import React, { useState } from 'react';
import { ChevronLeft, Share2, Download, CheckCircle2 } from 'lucide-react';

export default function TicketHeader({ 
  bookingId, 
  customerName, 
  badgeText = "Confirmed Pass", 
  onBackToHome 
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `TripGod Adventure Pass - ${bookingId || 'Ticket'}`,
        text: `Here is my confirmed TripGod Pass (${bookingId || ''})!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Fixed Sticky Header for Controls */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs print:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBackToHome || (() => window.location.href = '/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Home
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-105 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#FF5F00]/20"
            >
              <Download className="w-3.5 h-3.5" /> Save PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Top Banner Card */}
      <div className="bg-gradient-to-r from-[#FF5F00] via-[#FF3D00] to-amber-500 p-6 text-white relative overflow-hidden rounded-t-3xl">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black tracking-tighter text-white">TRIP<span className="bg-white text-[#FF5F00] px-1.5 py-0.5 rounded-md ml-0.5 shadow-sm">GOD</span></span>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" /> {badgeText}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-white/25 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Adventure Booking ID</p>
            <p className="text-2xl font-black tracking-wider text-white mt-0.5 font-mono">{bookingId || 'TG-PASS'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Lead Guest</p>
            <p className="text-sm font-bold text-white mt-0.5">{customerName || 'Valued Guest'}</p>
          </div>
        </div>
      </div>
    </>
  );
}
