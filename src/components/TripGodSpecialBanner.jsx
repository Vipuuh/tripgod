import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function TripGodSpecialBanner({ onOpenComboBuilder }) {
  return (
    <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div 
        onClick={onOpenComboBuilder}
        className="group relative bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 hover:border-[#FF5F00]/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 overflow-hidden shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer"
      >
        {/* Decorative Background Glows */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#FF5F00]/20 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FF5F00]/30 transition-all duration-500" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Content Left */}
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF5F00] text-white text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              TRIPGOD SPECIAL BUNDLES
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white font-display tracking-tight leading-snug">
              Build Your Rishikesh Combo & <span className="text-[#FF5F00]">Save Up To 20%</span>
            </h2>

            <p className="text-xs text-slate-300 font-medium line-clamp-1 sm:line-clamp-2">
              Combine Hotel, Rafting & Scooty. Auto-unlock 5%, 10%, 15% OFF + Instant WhatsApp Vouchers!
            </p>

            {/* Micro Benefit Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> 2 Items = 5% OFF
              </span>
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-amber-400" /> 3 Items = 10% OFF
              </span>
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> 4+ Items = 15% OFF
              </span>
            </div>
          </div>

          {/* Action Button Right */}
          <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <button
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] group-hover:scale-105 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#FF5F00]/20 transition flex items-center justify-center gap-1.5 border-none cursor-pointer"
            >
              <span>BUILD BUNDLE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
