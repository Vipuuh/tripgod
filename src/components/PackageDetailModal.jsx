import React, { useState } from 'react';
import { 
  X, Star, CheckCircle, ShieldCheck, Sparkles, Calendar, Users, 
  Hotel, Waves, Bike, Tent, Flame, Heart, Share2, Plus, Check, ChevronRight, MessageSquare, ArrowRight
} from 'lucide-react';

export default function PackageDetailModal({ packageData, onClose, onBookNow }) {
  if (!packageData) return null;

  const [selectedImage, setSelectedImage] = useState(0);
  const [persons, setPersons] = useState(2);
  const [travelDate, setTravelDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  
  // Track selected optional add-ons
  const [selectedAddons, setSelectedAddons] = useState([]);

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) => 
      prev.includes(addonId) 
        ? prev.filter((id) => id !== addonId) 
        : [...prev, addonId]
    );
  };

  // Icon mapper helper
  const getIcon = (iconName) => {
    switch (iconName?.toLowerCase()) {
      case 'hotel': return <Hotel className="w-5 h-5 text-indigo-500" />;
      case 'waves':
      case 'rafting': return <Waves className="w-5 h-5 text-cyan-500" />;
      case 'bike':
      case 'scooty': return <Bike className="w-5 h-5 text-amber-500" />;
      case 'tent':
      case 'camping': return <Tent className="w-5 h-5 text-emerald-500" />;
      default: return <Sparkles className="w-5 h-5 text-orange-500" />;
    }
  };

  // Price calculations
  const basePricePerPerson = Number(packageData.final_price || packageData.price || 0);
  const originalPricePerPerson = Number(packageData.original_price || basePricePerPerson * 1.25);
  
  // Calculate add-on totals per person
  const addonsTotalPerPerson = (packageData.optional_addons || [])
    .filter((addon) => selectedAddons.includes(addon.id))
    .reduce((sum, addon) => sum + Number(addon.price || 0), 0);

  const totalPricePerPerson = basePricePerPerson + addonsTotalPerPerson;
  const grandTotal = totalPricePerPerson * persons;
  const totalSaved = (originalPricePerPerson - basePricePerPerson) * persons;

  const handleBookingTrigger = () => {
    const chosenAddonsList = (packageData.optional_addons || [])
      .filter((addon) => selectedAddons.includes(addon.id));

    const bookingPayload = {
      id: packageData.id,
      title: packageData.title,
      type: 'package',
      duration: packageData.duration,
      persons,
      travelDate,
      basePrice: basePricePerPerson,
      addons: chosenAddonsList,
      totalPrice: grandTotal,
      includedItems: packageData.included_items || []
    };

    if (onBookNow) {
      onBookNow(bookingPayload);
    }
  };

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hi TripGod! I am interested in booking the combo package: *${packageData.title}*\n\n` +
      `📅 Travel Date: ${travelDate}\n` +
      `👥 Guests: ${persons} Persons\n` +
      `💰 Expected Amount: ₹${grandTotal.toLocaleString('en-IN')}\n\n` +
      `Please confirm availability.`
    );
    window.open(`https://wa.me/${packageData.whatsapp_number || '919876543210'}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white">
              {packageData.badge || '🔥 Special Combo'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {packageData.duration || '2 Days / 1 Night'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Main Title & Rating Stack */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                {packageData.title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {packageData.tagline || 'Complete Rishikesh Adventure Bundle'}
              </p>
            </div>
            
            {/* Rating Stack */}
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/50">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              <div className="text-left">
                <div className="text-base font-bold text-white leading-none">
                  {packageData.rating || 4.9}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {packageData.review_count || 120} Reviews
                </div>
              </div>
            </div>
          </div>

          {/* Photos Grid / Slider */}
          <div className="space-y-3">
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-950">
              <img 
                src={(packageData.images && packageData.images[selectedImage]) || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80'} 
                alt={packageData.title}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                {packageData.verified && (
                  <span className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600/90 text-white backdrop-blur-sm flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified Operator
                  </span>
                )}
                {packageData.discount_type === 'flat' ? (
                  <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white">
                    🔥 Flat ₹{packageData.discount_value} OFF
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-orange-600 text-white">
                    🔥 {packageData.discount_value}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {packageData.images && packageData.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {packageData.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition ${
                      selectedImage === idx ? 'border-orange-500 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* How Self-Service Pass Works Info Banner */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> How Self-Service Combo Passes Work
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 font-medium">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span><strong>Book Online:</strong> Get up to 30% combo discount instantly online.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span><strong>Get Instant Passes:</strong> Receive WhatsApp vouchers with direct Google Map links & reporting times.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <span><strong>Self-Paced Visit:</strong> Show your pass at Hotel / Rafting / Scooty counters & enjoy!</span>
              </div>
            </div>
          </div>

          {/* Included Activities Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                What's Included in this Combo
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {(packageData.included_items || []).length} Services Bundled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(packageData.included_items || []).map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-500/50 transition group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
                        {getIcon(item.icon)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-orange-400">
                          {item.category}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {item.name}
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Guaranteed Included
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Add-Ons Section */}
          {packageData.optional_addons && packageData.optional_addons.length > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Customize Your Experience (Optional Add-Ons)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select extra activities to add to your booking at exclusive combo partner rates
                </p>
              </div>

              <div className="space-y-2">
                {packageData.optional_addons.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                        isChecked 
                          ? 'bg-orange-500/10 border-orange-500/80 text-white' 
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-600 bg-slate-800'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-sm font-medium">{addon.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-400">
                          +₹{addon.price}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/ person</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inclusions Ribbon & Notes */}
          {packageData.inclusions && packageData.inclusions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Package Perks & Highlights
              </h4>
              <div className="flex flex-wrap gap-2">
                {packageData.inclusions.map((inc, i) => (
                  <span 
                    key={i} 
                    className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700/60 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {inc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout Bar */}
        <div className="sticky bottom-0 z-20 p-5 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Guest & Date Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
              <Calendar className="w-4 h-4 text-orange-400" />
              <input 
                type="date" 
                value={travelDate} 
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setTravelDate(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-slate-300">Guests:</span>
              <select 
                value={persons}
                onChange={(e) => setPersons(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num} className="bg-slate-900 text-white">
                    {num} {num === 1 ? 'Person' : 'Persons'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 line-through">
                  ₹{(originalPricePerPerson * persons).toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Save ₹{totalSaved.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-display">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400">Total ({persons} Pax)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleWhatsAppInquiry}
                className="p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 transition"
                title="Inquire on WhatsApp"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={handleBookingTrigger}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition flex items-center gap-2"
              >
                BOOK COMBO <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
