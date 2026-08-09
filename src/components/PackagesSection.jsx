import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Star, CheckCircle, ArrowRight, 
  Hotel, Waves, Bike, Tent, ShieldCheck
} from 'lucide-react';
import PackageDetailModal from './PackageDetailModal';
import { supabase } from '../supabase';

// Fallback initial packages if database fetch is loading or empty
const FALLBACK_PACKAGES = [
  {
    id: 'rishikesh-weekend-thrill-combo',
    title: 'Rishikesh Weekend Thrill Combo',
    tagline: 'Hotel Stay + 16KM Rafting + Honda Activa 6G',
    badge: '👑 Bestseller',
    duration: '2 Days / 1 Night',
    original_price: 5200,
    discount_type: 'percentage',
    discount_value: 25,
    final_price: 3900,
    verified: true,
    rating: 4.9,
    review_count: 142,
    images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80'
    ],
    included_items: [
      { category: 'Hotel', name: 'Deluxe AC Room Stay', icon: 'Hotel', details: '1 Night stay at Grand Tapovan with Mountain View, Wi-Fi & Breakfast' },
      { category: 'Rafting', name: '16 KM Shivpuri Rafting', icon: 'Waves', details: 'Includes Cliff Jumping, Safety Gear, & Certified River Guide' },
      { category: 'Scooty', name: 'Honda Activa 6G (24 Hours)', icon: 'Bike', details: 'Unlimited KM, Helmet included, Pick up at Tapovan' }
    ],
    optional_addons: [
      { id: 'ganga_aarti', name: 'Ganga Aarti VIP Guided Pass', price: 299 },
      { id: 'camping', name: 'Riverside Camping Night Upgrade', price: 999 },
      { id: 'bungee', name: 'Jumpin Heights 83m Bungee Jump Slot', price: 3100 }
    ],
    inclusions: ['1 Night Deluxe Accommodation', '16 KM Shivpuri River Rafting', '24 Hours Scooty Rental', 'Buffet Breakfast', 'Free Cliff Jumping']
  },
  {
    id: 'ultimate-extreme-adventurer-package',
    title: 'Ultimate Extreme Adventurer Package',
    tagline: 'Stay + Rafting + Scooty + Riverside Camping',
    badge: '🔥 Flat ₹1,500 OFF',
    duration: '3 Days / 2 Nights',
    original_price: 7500,
    discount_type: 'flat',
    discount_value: 1500,
    final_price: 6000,
    verified: true,
    rating: 4.9,
    review_count: 98,
    images: [
      'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
    ],
    included_items: [
      { category: 'Hotel', name: '1 Night Boutique Hotel Stay', icon: 'Hotel', details: 'Luxury stay in Tapovan with pool & rooftop cafe' },
      { category: 'Camping', name: '1 Night Riverside Camping', icon: 'Tent', details: 'Campfire, Evening Snacks, & Live Music' },
      { category: 'Rafting', name: '26 KM Marine Drive Rafting', icon: 'Waves', details: 'Full day extreme rafting experience' },
      { category: 'Scooty', name: 'Jupiter / Activa Rental (48 Hours)', icon: 'Bike', details: 'Full 2 Days rental for Rishikesh exploration' }
    ],
    optional_addons: [
      { id: 'bungee', name: '83m Bungee Jump Slot', price: 3100 },
      { id: 'ganga_aarti', name: 'Triveni Ghat Aarti VIP Pass', price: 299 }
    ],
    inclusions: ['1 Night Hotel + 1 Night Camping', '26 KM Extreme Rafting', '48 Hours Scooty Rental', 'Campfire & Snacks']
  }
];

export default function PackagesSection({ onBookPackage }) {
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);
  const [loading, setLoading] = useState(false);
  const [activePackageModal, setActivePackageModal] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true);

      if (data && data.length > 0 && !error) {
        setPackages(data);
      }
    } catch (err) {
      console.log('Using fallback packages:', err);
    }
  };

  const getItemIcon = (iconName) => {
    switch (iconName?.toLowerCase()) {
      case 'hotel': return <Hotel className="w-3.5 h-3.5 text-indigo-600" />;
      case 'waves':
      case 'rafting': return <Waves className="w-3.5 h-3.5 text-cyan-600" />;
      case 'bike':
      case 'scooty': return <Bike className="w-3.5 h-3.5 text-amber-600" />;
      case 'tent':
      case 'camping': return <Tent className="w-3.5 h-3.5 text-emerald-600" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-orange-600" />;
    }
  };

  return (
    <section id="packages-section" className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      
      {/* Section Title Header (Matching TripGod Light Theme Typography) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5F00]" />
            EXCLUSIVE COMBO DEALS
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 font-display tracking-tight leading-tight">
            Hot Pre-Built Packages <span className="text-[#FF5F00]">(Save Up To 30%)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-medium">
            Book complete Rishikesh adventure bundles — Hotel Stay, River Rafting & Scooty Rental packed together at discounted partner rates.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF5F00] hover:underline cursor-pointer">
          <span>All Combos Verified</span>
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Cards Grid - Compact & Sleek Matching Site Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {packages.map((pkg) => {
          const basePrice = Number(pkg.final_price || pkg.price);
          const originalPrice = Number(pkg.original_price || basePrice * 1.25);
          
          return (
            <div 
              key={pkg.id}
              onClick={() => setActivePackageModal(pkg)}
              className="group relative bg-white border border-slate-200/80 hover:border-[#FF5F00]/60 rounded-3xl overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(255,95,0,0.12)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Compact Image Section */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                  <img 
                    src={(pkg.images && pkg.images[0]) || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80'} 
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Overlaid Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-start max-w-[75%]">
                    {pkg.verified && (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                        <CheckCircle className="w-3 h-3" /> Verified Operator
                      </span>
                    )}
                    {pkg.badge && (
                      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-lg bg-gradient-to-r from-[#FF5F00] to-amber-500 text-white shadow-xs uppercase">
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  {/* Discount Tag Top Right */}
                  <div className="absolute top-3 right-3">
                    {pkg.discount_type === 'flat' ? (
                      <span className="px-2.5 py-1 text-[11px] font-black rounded-xl bg-rose-600 text-white shadow-md">
                        FLAT ₹{pkg.discount_value} OFF
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-black rounded-xl bg-[#FF5F00] text-white shadow-md">
                        {pkg.discount_value}% OFF
                      </span>
                    )}
                  </div>

                  {/* Vertical Rating Stack Bottom Left */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <div className="text-left leading-none">
                      <div className="text-xs font-bold text-white">
                        ⭐ {pkg.rating || 4.9}
                      </div>
                      <div className="text-[9px] text-slate-300 font-medium mt-0.5">
                        {pkg.review_count || 120} Reviews
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div>
                    <div className="text-[11px] font-black text-[#FF5F00] uppercase tracking-wider">
                      {pkg.duration || '2 Days / 1 Night'}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#FF5F00] transition font-display mt-0.5">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
                      {pkg.tagline}
                    </p>
                  </div>

                  {/* Included Items Ribbon */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 flex flex-wrap gap-2.5">
                    {(pkg.included_items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                        {getItemIcon(item.icon)}
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Inclusions Tags with Working +X More Button */}
                  {pkg.inclusions && pkg.inclusions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.inclusions.slice(0, 3).map((inc, i) => (
                        <span key={i} className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60 font-medium">
                          ✓ {inc}
                        </span>
                      ))}
                      {pkg.inclusions.length > 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePackageModal(pkg);
                          }}
                          className="text-[11px] font-bold text-[#FF5F00] bg-[#FF5F00]/10 hover:bg-[#FF5F00]/20 px-2 py-0.5 rounded-md transition cursor-pointer border border-[#FF5F00]/20"
                        >
                          +{pkg.inclusions.length - 3} more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & Action Bar */}
              <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                    Starting From
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-slate-400 line-through font-medium">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 font-display">
                      ₹{basePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">/ person</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePackageModal(pkg);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-105 active:scale-95 text-white font-black text-xs shadow-md shadow-[#FF5F00]/20 transition flex items-center gap-1"
                >
                  VIEW COMBO <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Detail Modal */}
      {activePackageModal && (
        <PackageDetailModal 
          packageData={activePackageModal}
          onClose={() => setActivePackageModal(null)}
          onBookNow={(bookingPayload) => {
            setActivePackageModal(null);
            if (onBookPackage) {
              onBookPackage(bookingPayload);
            }
          }}
        />
      )}

    </section>
  );
}
