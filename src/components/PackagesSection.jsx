import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Star, CheckCircle, Flame, ArrowRight, 
  Hotel, Waves, Bike, Tent, ShieldCheck, ChevronRight
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
      case 'hotel': return <Hotel className="w-4 h-4 text-indigo-400" />;
      case 'waves':
      case 'rafting': return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'bike':
      case 'scooty': return <Bike className="w-4 h-4 text-amber-400" />;
      case 'tent':
      case 'camping': return <Tent className="w-4 h-4 text-emerald-400" />;
      default: return <Sparkles className="w-4 h-4 text-orange-400" />;
    }
  };

  return (
    <section id="packages-section" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      
      {/* Section Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            EXCLUSIVE COMBO DEALS
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            Hot Pre-Built Packages <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">(Save Up To 30%)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Book complete Rishikesh adventure bundles — Hotel Stay, River Rafting & Scooty Rental packed together at discounted partner rates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 hover:text-orange-300 transition cursor-pointer group">
          <span>All Combos Verified</span>
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {packages.map((pkg) => {
          const basePrice = Number(pkg.final_price || pkg.price);
          const originalPrice = Number(pkg.original_price || basePrice * 1.25);
          
          return (
            <div 
              key={pkg.id}
              className="group relative bg-slate-900/80 border border-slate-800/80 hover:border-orange-500/40 rounded-3xl overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                {/* Image Section */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                  <img 
                    src={(pkg.images && pkg.images[0]) || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80'} 
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Overlaid Badges (Max 2 Badges) */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                    {pkg.verified && (
                      <span className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-600/90 text-white backdrop-blur-md flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified Operator
                      </span>
                    )}
                    {pkg.badge && (
                      <span className="px-3 py-1 text-[11px] font-extrabold rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  {/* Discount Tag Top Right */}
                  <div className="absolute top-4 right-4">
                    {pkg.discount_type === 'flat' ? (
                      <span className="px-3 py-1.5 text-xs font-black rounded-xl bg-rose-600 text-white shadow-lg">
                        FLAT ₹{pkg.discount_value} OFF
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 text-xs font-black rounded-xl bg-orange-600 text-white shadow-lg">
                        {pkg.discount_value}% OFF
                      </span>
                    )}
                  </div>

                  {/* Vertical Rating Stack Bottom Left */}
                  <div className="absolute bottom-3 left-4 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <div className="text-left leading-none">
                      <div className="text-xs font-bold text-white">
                        ⭐ {pkg.rating || 4.9}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {pkg.review_count || 120} Reviews
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-orange-400 mb-1">
                      {pkg.duration || '2 Days / 1 Night'}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition font-display">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {pkg.tagline}
                    </p>
                  </div>

                  {/* Included Items Ribbon */}
                  <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800 flex flex-wrap gap-3">
                    {(pkg.included_items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                        {getItemIcon(item.icon)}
                        <span className="font-semibold text-white">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Inclusions Tags */}
                  {pkg.inclusions && pkg.inclusions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.inclusions.slice(0, 3).map((inc, i) => (
                        <span key={i} className="text-[11px] text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/40">
                          ✓ {inc}
                        </span>
                      ))}
                      {pkg.inclusions.length > 3 && (
                        <span className="text-[11px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">
                          +{pkg.inclusions.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & Action Bar */}
              <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
                    Starting From
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 line-through">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-2xl font-black text-white font-display">
                      ₹{basePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ person</span>
                  </div>
                </div>

                <button
                  onClick={() => setActivePackageModal(pkg)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition flex items-center gap-1.5"
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
