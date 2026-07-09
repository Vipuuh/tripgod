// src/components/OperatorSelector.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Check, ShieldCheck, HelpCircle, MessageSquare } from 'lucide-react';

const formatLandmarkDistance = (landmark) => {
  if (!landmark) return { text: 'Rishikesh Office', details: '🚶 5 min walk' };
  
  const lower = landmark.toLowerCase();
  
  if (lower.includes('laxman') || lower.includes('lakshman')) {
    return { text: 'Near Laxman Jhula', details: '🚶 4 min walk' };
  }
  if (lower.includes('ram')) {
    return { text: 'Near Ram Jhula', details: '🚶 2 min walk' };
  }
  if (lower.includes('tapovan')) {
    return { text: 'Tapovan Market', details: '🚶 3 min walk' };
  }
  if (lower.includes('shivpuri')) {
    return { text: 'Shivpuri Office', details: '🚗 2 min drive' };
  }
  if (lower.includes('triveni')) {
    return { text: 'Near Triveni Ghat', details: '🚗 5 min drive' };
  }
  if (lower.includes('nim')) {
    return { text: 'Nim Beach Office', details: '🚶 5 min walk' };
  }
  
  // Clean up long addresses into landmark format
  return { 
    text: landmark.length > 25 ? landmark.split(',')[0] : landmark, 
    details: '🚶 5 min walk' 
  };
};

export default function OperatorSelector({ operators = [], onBookOperator, activityName }) {
  const [showInfo, setShowInfo] = useState(false);

  if (!operators || operators.length === 0) {
    return (
      <div className="bg-white border border-slate-150 rounded-3xl p-8 text-center text-slate-500 text-sm font-medium">
        No booking options available for this selection at the moment.
      </div>
    );
  }

  // Find min price for "Best Value" badge calculation
  const prices = operators.map(op => op.price || 0);
  const minPrice = Math.min(...prices);

  // Find max rating for "Top Rated" badge calculation
  const ratings = operators.map(op => op.starRating || op.safetyRating || 4.5);
  const maxRating = Math.max(...ratings);

  return (
    <div className="w-full space-y-6 font-sans text-slate-800">
      
      {/* Trust Card: Verified by TripGod */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2.5 text-[#FF5F00]">
          <ShieldCheck size={20} className="stroke-[2.5]" />
          <h4 className="font-black text-sm text-slate-900 tracking-tight uppercase">
            Verified by TripGod
          </h4>
        </div>
        
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Every listed operator is verified by TripGod and follows required safety standards.
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-black text-slate-700 uppercase tracking-wide pt-1">
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500 stroke-[3]" />
            <span>Licensed Operator</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500 stroke-[3]" />
            <span>Safety Gear Included</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500 stroke-[3]" />
            <span>Certified Guides</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500 stroke-[3]" />
            <span>Instant Confirmation</span>
          </div>
        </div>

        {/* Why choose explanation collapse */}
        <div className="pt-2 border-t border-slate-200/50">
          <button 
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-1.5 text-[11px] font-black text-[#FF5F00] hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            <HelpCircle size={13} />
            <span>Why choose an option?</span>
          </button>
          
          {showInfo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-2 pl-4 border-l border-[#FF5F00]/30 space-y-1"
            >
              <p className="font-extrabold text-slate-700">All operators provide the same activity.</p>
              <p>The main differences are:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Price & discount offers</li>
                <li>Pickup Office Location (proximity to your hotel)</li>
                <li>Ratings and reviews</li>
                <li>Included Services</li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* Operator List Container */}
      <div className="space-y-4 text-left">
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
          } else {
            badgeText = '📍 Closest to You';
          }

          // Parse Landmark Location psychology
          const loc = formatLandmarkDistance(op.landmark);

          return (
            <motion.div
              key={op.id || idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden text-black"
            >
              {/* Top Row: Badge & Rating */}
              <div className="flex items-center justify-between gap-2">
                {badgeText ? (
                  <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-[#FF5F00] bg-[#FF5F00]/8 border border-[#FF5F00]/15 px-2.5 py-1 rounded-full shadow-xs">
                    {badgeText}
                  </span>
                ) : <div />}

                {/* Rating Badge */}
                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/10">
                  <Star size={11} className="fill-amber-500 text-amber-500" />
                  <span className="text-[10px] font-black text-amber-800">
                    {rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Middle Row: Logo, Location & Details */}
              <div className="flex gap-4 items-center">
                {/* Operator Logo / Safety Icon */}
                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-center shadow-xs">
                  {op.operatorLogo || op.shopImage ? (
                    <img
                      src={op.operatorLogo || op.shopImage}
                      alt={op.vendorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                      <ShieldCheck size={24} className="text-[#FF5F00]/70" />
                    </div>
                  )}
                </div>

                {/* Info Block */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Landmark Location (Prominent) */}
                  <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                    <MapPin size={14} className="text-[#FF5F00]" />
                    <span>{loc.text}</span>
                    <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded">
                      {loc.details}
                    </span>
                  </div>

                  {/* Vendor Name */}
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Provided by: {op.vendorName || 'Verified Operator'}
                  </span>

                  {/* Included features tags */}
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-1 text-[10px] text-slate-500 font-bold">
                    <span>✔ Safety Gear</span>
                    <span>✔ Certified Guide</span>
                    <span>✔ Same Route</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Price Summary & Book Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-4">
                {/* Price block */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 leading-none">
                      ₹{displayPrice.toLocaleString('en-IN')}
                    </span>
                    {isDiscounted && (
                      <span className="text-xs text-slate-400 line-through font-semibold">
                        ₹{displayOriginalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wide mt-1">
                      Save ₹{savings.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Continue button */}
                <button
                  type="button"
                  onClick={() => onBookOperator(op)}
                  className="py-3 px-5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer font-display"
                >
                  Continue with ₹{displayPrice.toLocaleString('en-IN')}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Sticky WhatsApp Help Section */}
      <div className="pt-2 border-t border-slate-150 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Need help deciding?</span>
        <a
          href={`https://wa.me/918630027341?text=${encodeURIComponent(`Hi, I'm booking ${activityName || 'activities'} on TripGod and need help choosing the best option!`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-extrabold no-underline"
        >
          <MessageSquare size={14} className="fill-emerald-600/10" />
          <span>Chat with a TripGod Expert</span>
        </a>
      </div>
    </div>
  );
}
