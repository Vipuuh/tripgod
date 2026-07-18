import React, { useEffect } from 'react';
import { ChevronLeft, Star, MapPin, Tag } from 'lucide-react';

export default function TourPartnerSelection({ currentCity, openBookingModal, selectedTour, setSelectedTour, navigateTo }) {
  useEffect(() => {
    // If user refreshes and selectedTour is lost, redirect back to tours listing
    if (!selectedTour) {
      navigateTo('tours');
    }
  }, [selectedTour, navigateTo]);

  if (!selectedTour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-slate-500 text-sm font-medium">
        Loading Partner Desk...
      </div>
    );
  }

  const renderStars = (rating = 4.5) => {
    const stars = [];
    const floor = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<Star key={i} size={11} className="fill-amber-500 text-amber-500" />);
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
        stars.push(<Star key={i} size={11} className="text-slate-200" />);
      }
    }
    return stars;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 font-sans text-left">
      {/* Header */}
      <div className="bg-white border-b border-gray-150 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigateTo('tours')}
            className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider hover:text-[#FF5722] cursor-pointer border-none bg-transparent"
          >
            <ChevronLeft size={16} /> Back to Details
          </button>
          <span className="text-[10px] font-bold text-slate-450 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            Local Partner Selection Page
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Selected Package summary */}
        <div className="bg-white border border-gray-100/50 rounded-2xl p-4 shadow-sm">
          <span className="text-[9px] bg-[#FF5722]/10 border border-[#FF5722]/20 text-[#FF5722] font-black px-2 py-0.5 rounded uppercase tracking-wider">
            Active Package
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-2 font-display uppercase leading-tight">
            {selectedTour.name}
          </h2>
          <p className="text-[11px] text-slate-500 font-bold mt-1">Duration: {selectedTour.duration}</p>
        </div>

        {/* Partners list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
              Available Local Operators ({selectedTour.operators?.length || 0})
            </h3>
          </div>

          <div className="space-y-4">
            {selectedTour.operators?.map((op, idx) => {
              const rating = op.vendors?.star_rating || op.rating || 4.5;
              const expYears = op.vendors?.years_of_experience || (4 + (idx * 2) % 6);
              const reportingAddress = selectedTour.reporting_address || op.vendors?.address || 'Reporting Address: TripGod Office near Rishikesh';
              const displayPrice = Number(op.price || selectedTour.minPrice || 0);
              // Fallback to 1.5x active price if database original_price is null
              const displayOriginalPrice = op.original_price ? Number(op.original_price) : Math.round(displayPrice * 1.5);
              const hasDiscount = displayOriginalPrice > displayPrice;

              return (
                <div
                  key={op.id || idx}
                  className="bg-white shadow-md rounded-2xl p-4 border border-gray-100 flex flex-col justify-between relative overflow-hidden"
                >
                  {op.is_limited_offer && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF5722]" />
                  )}

                  {/* Header Row: logo and details */}
                  <div className="flex gap-4.5 items-start">
                    {/* Partner Logo */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-slate-50 flex-shrink-0 flex items-center justify-center">
                      {op.vendors?.shop_image ? (
                        <img
                          src={op.vendors.shop_image}
                          alt={op.vendors.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-1 text-[#FF5722]">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06l2.47 2.47 4.97-4.97a.75.75 0 111.06 1.06l-5.5 5.5z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.75H10.5a.75.75 0 000 1.5h.75v.75a.75.75 0 001.5 0V8.25h.75a.75 0 000-1.5h-.75V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[6px] font-black uppercase tracking-widest mt-1">PARTNER</span>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-grow min-w-0 space-y-1.5 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-black text-slate-900 font-display leading-tight truncate">
                          {op.vendors?.name || op.name || 'Verified Local Operator'}
                        </h4>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/10">
                          <div className="flex items-center">{renderStars(rating)}</div>
                          <span className="text-[10px] font-black text-amber-700">
                            {rating}
                          </span>
                        </div>
                      </div>

                      {/* Trust signals */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider text-slate-650 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          {expYears} Years Experience
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-md">
                          <CheckBadgeGreen />
                          Verified Local Fleet
                        </span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-1 text-[11px] text-slate-500 font-bold pt-0.5 leading-tight">
                        <MapPin size={11} className="text-[#FF5722] flex-shrink-0 mt-0.5" />
                        <span className="text-slate-600 font-medium">
                          Reporting Address: {reportingAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing row & booking button */}
                  {(() => {
                    const pMode = op.payment_mode || 'commission_advance';
                    const commPct = op.commission_percentage !== undefined && op.commission_percentage !== null ? Number(op.commission_percentage) : 10;
                    const fixedAmt = op.fixed_advance_amount !== undefined && op.fixed_advance_amount !== null ? Number(op.fixed_advance_amount) : 0;

                    let advanceAmount = 0;
                    if (pMode === 'full_payment') {
                      advanceAmount = displayPrice;
                    } else if (pMode === 'fixed_advance') {
                      advanceAmount = fixedAmt;
                    } else {
                      advanceAmount = Math.round((displayPrice * commPct) / 100);
                    }
                    const remainingAmount = Math.max(0, displayPrice - advanceAmount);

                    let paymentTermsLabel = '';
                    if (pMode === 'full_payment') {
                      paymentTermsLabel = 'Pay 100% Online';
                    } else {
                      paymentTermsLabel = `Pay ₹${advanceAmount.toLocaleString('en-IN')} now • Pay ₹${remainingAmount.toLocaleString('en-IN')} at venue`;
                    }

                    return (
                      <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between gap-4">
                        {/* Left: Prices */}
                        <div className="flex flex-col text-left">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-neutral-900">
                              ₹{displayPrice.toLocaleString('en-IN')}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through font-medium">
                                ₹{displayOriginalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                            {op.is_limited_offer && (
                              <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-[#FF5722] bg-[#FF5722]/10 border border-[#FF5722]/20 px-1.5 py-0.5 rounded-md">
                                <Tag size={8} /> Limited Offer
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-[#FF5722] mt-0.5">
                            🟢 {paymentTermsLabel}
                          </span>
                        </div>

                        {/* Right: Checkout Button */}
                        <button
                          onClick={() => {
                            openBookingModal({
                              id: op.id,
                              name: `${selectedTour.name} - ${op.vendors?.name || op.name || 'Local Operator'}`,
                              price: displayPrice,
                              category: 'tour',
                              city_id: op.city_id,
                              vendor_id: op.vendor_id,
                              payment_mode: pMode,
                              commission_percentage: commPct,
                              fixed_advance_amount: fixedAmt,
                              vendors: op.vendors,
                              slots: ['Morning Departure (08:00 AM)', 'Custom Timing']
                            });
                          }}
                          className="py-2.5 px-6 bg-[#FF5722] hover:bg-[#E54A18] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border-none font-display shrink-0"
                        >
                          Book Operator
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            {(!selectedTour.operators || selectedTour.operators.length === 0) && (
              <div className="bg-white border border-slate-100 rounded-xl p-8 text-center text-slate-500 text-sm font-medium">
                No local operators offering this yatra packages at the moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline svg components
function CheckBadgeGreen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-[#10B981]">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}
