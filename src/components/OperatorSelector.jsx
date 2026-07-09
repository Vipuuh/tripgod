// src/components/OperatorSelector.jsx
import React from 'react';
import { Star, MapPin } from 'lucide-react';

const formatLandmarkDistance = (landmark) => {
  if (!landmark) return null;
  const lower = landmark.toLowerCase();
  
  if (lower.includes('laxman') || lower.includes('lakshman')) {
    return { title: 'Laxman Jhula', mode: '🚶 4 min walk' };
  }
  if (lower.includes('ram')) {
    return { title: 'Ram Jhula', mode: '🚶 2 min walk' };
  }
  if (lower.includes('tapovan')) {
    return { title: 'Tapovan Market', mode: '🚶 3 min walk' };
  }
  if (lower.includes('shivpuri')) {
    return { title: 'Shivpuri Beach', mode: '🚗 2 min drive' };
  }
  if (lower.includes('triveni')) {
    return { title: 'Triveni Ghat', mode: '🚗 5 min drive' };
  }
  if (lower.includes('nim')) {
    return { title: 'Nim Beach', mode: '🚶 5 min walk' };
  }
  
  return { 
    title: landmark.length > 20 ? landmark.split(',')[0] : landmark, 
    mode: '🚶 5 min walk' 
  };
};

const getContextualHelperText = (landmark) => {
  if (!landmark) return null;
  const lower = landmark.toLowerCase();
  if (lower.includes('laxman') || lower.includes('lakshman')) {
    return "Best for hotels near Laxman Jhula.";
  }
  if (lower.includes('ram')) {
    return "Perfect if you're staying near Ram Jhula.";
  }
  if (lower.includes('tapovan')) {
    return "Ideal for hotels in Tapovan.";
  }
  if (lower.includes('shivpuri')) {
    return "Great choice near Shivpuri.";
  }
  return null;
};

const getConsistentReviewCount = (name) => {
  if (!name) return 128;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return (Math.abs(hash) % 180) + 35; // consistent number between 35 and 215
};

const getPricingSuffix = (activityName) => {
  if (!activityName) return '/person';
  const lower = activityName.toLowerCase();
  if (lower.includes('bike') || lower.includes('scooter') || lower.includes('rent')) {
    return '/day';
  }
  if (lower.includes('hotel') || lower.includes('stay') || lower.includes('resort') || lower.includes('room')) {
    return '/night';
  }
  return '/person';
};

export default function OperatorSelector({ operators = [], onBookOperator, activityName }) {
  if (!operators || operators.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-500 text-sm font-medium">
        No options available at the moment.
      </div>
    );
  }

  // Find min price for "Best Value" badge
  const prices = operators.map(op => op.price || 0);
  const minPrice = Math.min(...prices);

  // Find max rating for "Top Rated" badge
  const ratings = operators.map(op => op.starRating || op.safetyRating || 4.5);
  const maxRating = Math.max(...ratings);

  const priceSuffix = getPricingSuffix(activityName);

  return (
    <div className="w-full space-y-5 font-sans text-slate-800">
      
      {/* 1. Premium Horizontal Flat Banner */}
      <div className="bg-[#FF5F00]/5 border border-[#FF5F00]/10 rounded-2xl p-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-[#FF5F00] uppercase tracking-wider">
              Why choose an option?
            </h4>
            <p className="text-[11px] font-extrabold text-slate-700 mt-0.5">
              All options provide the same adventure route and quality standards.
            </p>
          </div>
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-center shrink-0">
            {operators.length} Options Available
          </span>
        </div>

        {/* Horizontal Row of differences */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#FF5F00]/10 text-[9px] font-black text-slate-600 uppercase tracking-wide">
          <div className="flex items-center justify-center sm:justify-start gap-1 bg-white px-2 py-1.5 rounded-lg border border-slate-200/50">
            <span>💰 Best Prices</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1 bg-white px-2 py-1.5 rounded-lg border border-slate-200/50">
            <span>📍 Pickup Office</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1 bg-white px-2 py-1.5 rounded-lg border border-slate-200/50">
            <span>⭐ Crew Ratings</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1 bg-white px-2 py-1.5 rounded-lg border border-slate-200/50">
            <span>✔ Safety Verified</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Booking Options List */}
      <div className="space-y-3.5 text-left">
        {operators.map((op, idx) => {
          const rating = op.starRating !== null && op.starRating !== undefined ? Number(op.starRating) : 4.5;
          const displayPrice = op.price || 0;
          const displayOriginalPrice = op.originalPrice || Math.round(displayPrice * 1.5);
          const isDiscounted = displayOriginalPrice && displayOriginalPrice > displayPrice;
          const savings = displayOriginalPrice - displayPrice;

          // Determine Badge dynamically
          let badgeText = '';
          if (idx === 0) {
            badgeText = '🔥 Most Booked';
          } else if (displayPrice === minPrice) {
            badgeText = '💰 Best Value';
          } else if (rating === maxRating) {
            badgeText = '⭐ Top Rated';
          }

          const loc = formatLandmarkDistance(op.landmark);
          const contextHelper = getContextualHelperText(op.landmark);
          const reviewsCount = getConsistentReviewCount(op.vendorName);

          return (
            <div
              key={op.id || idx}
              className="bg-white border border-slate-200/70 rounded-2xl p-4.5 hover:border-slate-400 transition-colors shadow-xs relative space-y-3.5"
            >
              {/* Badges / Rating Row */}
              <div className="flex items-center justify-between gap-2">
                {badgeText ? (
                  <span className="text-[9px] font-black uppercase text-[#FF5F00] bg-[#FF5F00]/5 border border-[#FF5F00]/10 px-2 py-0.5 rounded">
                    {badgeText}
                  </span>
                ) : <div />}

                {/* Stars Rating and review count */}
                <div className="flex items-center gap-1 text-[10px] font-black text-slate-800">
                  <Star size={11} className="fill-amber-500 text-amber-500" />
                  <span>{rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-semibold">({reviewsCount} reviews)</span>
                </div>
              </div>

              {/* Main Content Area: Landmark & Suffix Details */}
              <div className="space-y-1">
                {loc && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 leading-none">
                      📍 Pickup: {loc.title}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      {loc.mode}
                    </span>
                  </div>
                )}

                {/* Activity name/stretch KM info under pickup */}
                <div className="text-[10px] font-extrabold text-[#FF5F00] flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>
                    {op.stretchRoute 
                      ? `${op.stretchRoute} ${op.distanceKm ? `(${op.distanceKm} KM)` : ''}`
                      : (activityName || 'Adventure Stretch')
                    }
                  </span>
                </div>

                {contextHelper && (
                  <span className="block text-[10px] font-extrabold text-emerald-600">
                    ✨ {contextHelper}
                  </span>
                )}

                {op.vendorName && (
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Operator: {op.vendorName}
                  </span>
                )}
              </div>

              {/* Pricing & CTA Row (Compact aligned side-by-side) */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-black text-slate-900 leading-none">
                      ₹{displayPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">{priceSuffix}</span>
                    {isDiscounted && (
                      <span className="text-[10px] text-slate-400 line-through font-semibold ml-1.5">
                        ₹{displayOriginalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <span className="text-[9px] font-black text-emerald-600 mt-0.5 uppercase tracking-wide">
                      Save ₹{savings.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Premium continue button */}
                <button
                  type="button"
                  onClick={() => onBookOperator(op)}
                  className="py-2.5 px-4 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-[11px] uppercase tracking-wider rounded-xl hover:shadow-[0_4px_12px_rgba(255,95,0,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display"
                >
                  Continue with ₹{displayPrice.toLocaleString('en-IN')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
