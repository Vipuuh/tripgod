import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function TripGodSpecialBanner({ onOpenComboBuilder }) {
  return (
    <section className="py-3 sm:py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div 
        onClick={onOpenComboBuilder}
        className="group relative bg-[#FFF8F5] border border-[#FF5F00]/25 hover:border-[#FF5F00]/50 rounded-2xl p-4 sm:p-5 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
      >
        {/* Decorative Background Accent */}
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-[#FF5F00]/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Main Copy (Short, Punchy, Zero Text Cut) */}
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#FF5F00]" />
              TRIPGOD SPECIAL BUNDLES
            </div>

            <h2 className="text-base sm:text-xl font-extrabold text-neutral-900 font-display tracking-tight leading-snug">
              Build Custom Combo & <span className="text-[#FF5F00]">Save Up To 20%</span>
            </h2>

            <p className="text-xs text-slate-600 font-medium">
              Book Hotel, Rafting & Scooty together at combo rates.
            </p>
          </div>

          {/* Action Button */}
          <div className="w-full sm:w-auto shrink-0">
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
