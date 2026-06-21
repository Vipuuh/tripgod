import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Tag, Info } from 'lucide-react';


export default function OperatorSelector({ operators = [], onBookOperator, activityName }) {
  if (!operators || operators.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500 text-sm font-medium">
        No operators available for this activity at the moment.
      </div>
    );
  }

  // Helper to render star ratings
  const renderStars = (rating = 4.5) => {
    const stars = [];
    const floor = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(
          <Star key={i} size={11} className="fill-amber-500 text-amber-500" />
        );
      } else if (i === floor + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative inline-block text-slate-200">
            <Star size={11} className="text-slate-200" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={11} className="fill-amber-500 text-amber-500" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} size={11} className="text-slate-200" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
          Select Your Operator
        </h4>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
          {operators.length} Operator{operators.length > 1 ? 's' : ''} available
        </span>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-650 leading-relaxed flex gap-2">
        <Info size={14} className="text-accent flex-shrink-0 mt-0.5" />
        <p>
          Select an operator to book. Your reporting, safety briefing, and activity pickup will begin directly at the chosen operator's offline office location shown below.
        </p>
      </div>


      <div className="space-y-3">
        {operators.map((op, idx) => {
          const rating = op.starRating !== null && op.starRating !== undefined ? Number(op.starRating) : 4.5;
          const displayPrice = op.price || 0;
          const displayOriginalPrice = op.originalPrice;
          const isDiscounted = displayOriginalPrice && displayOriginalPrice > displayPrice;
          
          return (
            <motion.div
              key={op.id || idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
            >
              {/* Limited Offer Accent Bar */}
              {op.isLimitedOffer && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-[#FF3E00]" />
              )}

              {/* Upper Section: Photo and Info */}
              <div className="flex gap-4.5 items-start">
                {/* Operator Photo */}
                <div className="w-18 h-18 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                  {op.shopImage ? (
                    <img
                      src={op.shopImage}
                      alt={op.vendorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-display font-black text-lg text-slate-400 uppercase">
                      {op.vendorName ? op.vendorName.charAt(0) : 'O'}
                    </div>
                  )}
                </div>

                {/* Operator Meta details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-sm font-black text-slate-900 truncate font-display">
                      {op.vendorName || 'Local Operator'}
                    </h5>
                    
                    {/* Rating badge */}
                    <div className="flex items-center gap-1 flex-shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/10">
                      <div className="flex items-center">{renderStars(rating)}</div>
                      <span className="text-[10px] font-black text-amber-700">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Landmark/Location */}
                  {op.landmark && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold truncate">
                      <MapPin size={11} className="text-accent flex-shrink-0" />
                      <span className="truncate">Office/Pickup: {op.landmark}</span>
                    </div>
                  )}

                  {/* Pricing / Badges Row */}
                  <div className="flex items-center flex-wrap gap-2 pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-accent">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      {isDiscounted && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{displayOriginalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {op.isLimitedOffer && (
                      <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-md">
                        <Tag size={8} /> Limited Offer
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lower Section: Book Button */}
              <button
                onClick={() => onBookOperator(op)}
                className="w-full py-2.5 bg-accent hover:bg-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                Book with {op.vendorName || 'Operator'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
