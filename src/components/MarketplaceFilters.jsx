import React from 'react';
import { Sparkles, TrendingUp, Award, DollarSign, Compass, Users } from 'lucide-react';

const FILTER_OPTIONS = [
  { id: 'most_booked', label: 'Most Booked', icon: TrendingUp },
  { id: 'best_rated', label: 'Best Rated', icon: Award },
  { id: 'lowest_price', label: 'Lowest Price', icon: DollarSign },
  { id: 'nearest', label: 'Nearest Office', icon: Compass },
  { id: 'choice', label: 'TripGod Choice', icon: Sparkles },
  { id: 'family', label: 'Family Friendly', icon: Users }
];

export default function MarketplaceFilters({ activeFilter, onChangeFilter }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 -mx-6 px-6 sm:-mx-0 sm:px-0 flex gap-2 select-none">
      {FILTER_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = activeFilter === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChangeFilter(isActive ? null : opt.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all duration-300 ${
              isActive
                ? 'bg-accent-gradient text-white border-transparent shadow-[0_4px_12px_rgba(255,107,0,0.2)] scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <Icon size={12} className={isActive ? 'text-white' : 'text-[#FF6B00]'} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
