import React from 'react';
import { Sparkles, ArrowRight, Percent, ShieldCheck, CheckCircle2, Flame } from 'lucide-react';

export default function TripGodSpecialBanner({ onOpenComboBuilder }) {
  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div 
        onClick={onOpenComboBuilder}
        className="group relative bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.15)] hover:border-[#FF5F00]/60 transition-all duration-500 cursor-pointer"
      >
        {/* Decorative Background Accents */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#FF5F00]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#FF5F00]/25 transition-all duration-700" />
        <div className="absolute top-0 right-1/3 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Left Content */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF5F00] to-amber-500 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              TRIPGOD SPECIAL BUNDLES
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display tracking-tight leading-tight">
              Build Your Rishikesh Combo & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5F00] via-amber-400 to-emerald-400">Save Up To 20%</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Add 2 or more services to your cart (Hotel + Rafting + Scooty + Camping). Auto-unlock tiered percentage discounts on your total booking!
            </p>

            {/* Benefit Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 2 Items = 5% OFF
              </span>
              <span className="text-[11px] font-bold text-slate-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-400" /> 3 Items = 10% OFF
              </span>
              <span className="text-[11px] font-bold text-slate-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 4+ Items = 15% - 20% OFF
              </span>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-2">
            <button
              type="button"
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#FF5F00] via-amber-500 to-[#FF3E00] group-hover:scale-105 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#FF5F00]/30 transition flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              <span>BUILD YOUR BUNDLE NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-slate-400 font-medium text-center md:text-right">
              ⚡ Instant WhatsApp Location Vouchers
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
