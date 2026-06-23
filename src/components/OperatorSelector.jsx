import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Tag, Info, Sparkles } from 'lucide-react';


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
        <Info size={14} className="text-[#FF5722] flex-shrink-0 mt-0.5" />
        <p>
          Select an operator to book. Your reporting, safety briefing, and activity pickup will begin directly at the chosen operator's offline office location shown below.
        </p>
      </div>


      <div className="space-y-3 text-left">
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
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
            >
              {/* Limited Offer Accent Bar */}
              {op.isLimitedOffer && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF5722] to-[#E54A18]" />
              )}

              {/* Upper Section: Photo and Info */}
              <div className="flex gap-4.5 items-start">
                {/* Operator Photo / Safety Trust Badge */}
                <div className="w-18 h-18 rounded-xl overflow-hidden border border-gray-100 bg-gradient-to-br from-orange-50 to-orange-100/50 flex-shrink-0 flex items-center justify-center">
                  {op.operatorLogo || op.shopImage ? (
                    <img
                      src={op.operatorLogo || op.shopImage}
                      alt={op.vendorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-[#FF5722]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 drop-shadow-sm">
                        <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06l2.47 2.47 4.97-4.97a.75.75 0 111.06 1.06l-5.5 5.5z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.75H10.5a.75.75 0 000 1.5h.75v.75a.75.75 0 001.5 0V8.25h.75a.75 0 000-1.5h-.75V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[7px] font-black uppercase tracking-widest mt-1 leading-none">SAFETY TRUST</span>
                    </div>
                  )}
                </div>

                {/* Operator Meta details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-sm font-black text-slate-900 font-display leading-tight truncate">
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

                  {/* Trust Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {op.yearsOfExperience && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-150 border border-slate-200 px-2 py-0.5 rounded-md">
                        {op.yearsOfExperience} Years Exp
                      </span>
                    )}
                    {op.isGovtApproved && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-emerald-650">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        Govt. Approved
                      </span>
                    )}
                  </div>

                  {/* Landmark/Location */}
                  {op.landmark && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold truncate pt-0.5">
                      <MapPin size={11} className="text-[#FF5722] flex-shrink-0" />
                      <span className="truncate">Office/Pickup: {op.landmark}</span>
                    </div>
                  )}

                  {/* Pricing & Discount copy */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-neutral-900">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      {isDiscounted && (
                        <span className="text-xs text-gray-400 line-through font-medium">
                          ₹{displayOriginalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      {op.isLimitedOffer && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-[#FF5722] bg-[#FF5722]/10 border border-[#FF5722]/20 px-1.5 py-0.5 rounded-md">
                          <Tag size={8} /> Limited Offer
                        </span>
                      )}
                    </div>
                    {op.fullPaymentUpiDiscount > 0 && (
                      <p className="text-[10px] text-orange-600 font-black tracking-wide flex items-center gap-1.5">
                        <Sparkles size={12} className="text-[#FF5722] flex-shrink-0" />
                        <span>Get Flat ₹{op.fullPaymentUpiDiscount} off on 100% Full UPI Payment</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lower Section: Book Button */}
              <button
                onClick={() => onBookOperator(op)}
                className="w-full py-2.5 bg-[#FF5722] hover:bg-[#E54A18] text-white font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 border-none"
              >
                {op.stretchRoute ? (
                  <span className="truncate max-w-full">
                    Book {op.stretchRoute} ({op.distanceKm} KM)
                  </span>
                ) : (
                  <span>Book with {op.vendorName || 'Operator'}</span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
