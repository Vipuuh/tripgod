import React, { useState, useEffect } from 'react';
import { 
  Building2, Waves, Bike, Tent, Sparkles, CheckCircle2, 
  ArrowRight, ShieldCheck, Calendar, Users, Percent, Plus, Check, Trash2, X, Star, MapPin
} from 'lucide-react';
import { supabase } from '../supabase';

export default function CustomComboPage({ onClose, onBookCustomCombo }) {
  // Database Items
  const [hotels, setHotels] = useState([]);
  const [rafting, setRafting] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState('all');

  // Dynamic Discount Tier Rules (Editable via Admin or Default)
  const [discountRules, setDiscountRules] = useState(() => {
    try {
      const saved = localStorage.getItem('tripgod_combo_discount_rules');
      return saved ? JSON.parse(saved) : { tier2: 5, tier3: 10, tier4: 15, tier5: 20 };
    } catch {
      return { tier2: 5, tier3: 10, tier4: 15, tier5: 20 };
    }
  });

  // Selected Services Cart Array
  const [cartItems, setCartItems] = useState([]);

  // Booking Preferences
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [persons, setPersons] = useState(2);

  useEffect(() => {
    fetchDatabaseItems();
  }, []);

  const fetchDatabaseItems = async () => {
    setLoading(true);
    try {
      if (!supabase) return;
      const [
        { data: hData },
        { data: rData },
        { data: bData }
      ] = await Promise.all([
        supabase.from('hotels').select('id, name, price, address, images, rating, landmarks').order('name'),
        supabase.from('rafting').select('id, name, price, route, distance_km, images').order('price'),
        supabase.from('bikes').select('id, name, price, pickup_location, images').order('price')
      ]);

      if (hData) setHotels(hData);
      if (rData) setRafting(rData);
      if (bData) {
        const uniqueBikes = bData.filter((b, idx, self) => 
          idx === self.findIndex(t => t.name === b.name && Number(t.price) > 0)
        );
        setBikes(uniqueBikes);
      }
    } catch (err) {
      console.error('Error loading items for combo builder:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Item in Cart
  const toggleCartItem = (itemPayload) => {
    setCartItems(prev => {
      const exists = prev.some(i => i.id === itemPayload.id && i.category === itemPayload.category);
      if (exists) {
        return prev.filter(i => !(i.id === itemPayload.id && i.category === itemPayload.category));
      } else {
        return [...prev, itemPayload];
      }
    });
  };

  // Check if item is in cart
  const isItemInCart = (id, category) => {
    return cartItems.some(i => i.id === id && i.category === category);
  };

  // Active items count & discount percentage calculation
  const cartCount = cartItems.length;
  let discountPercent = 0;
  if (cartCount === 2) discountPercent = discountRules.tier2 || 5;
  else if (cartCount === 3) discountPercent = discountRules.tier3 || 10;
  else if (cartCount === 4) discountPercent = discountRules.tier4 || 15;
  else if (cartCount >= 5) discountPercent = discountRules.tier5 || 20;

  // Price calculations
  const rawSubtotalPerPerson = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const discountAmountPerPerson = Math.round((rawSubtotalPerPerson * discountPercent) / 100);
  const finalPricePerPerson = rawSubtotalPerPerson - discountAmountPerPerson;

  const grandTotal = finalPricePerPerson * persons;
  const totalSaved = discountAmountPerPerson * persons;

  const handleProceedBooking = () => {
    if (cartItems.length === 0) return;
    const payload = {
      title: `Custom Rishikesh Combo (${cartCount} Services)`,
      type: 'custom_combo',
      persons,
      travelDate,
      items: cartItems,
      discountPercent,
      rawTotal: rawSubtotalPerPerson * persons,
      totalSaved,
      totalPrice: grandTotal
    };

    if (onBookCustomCombo) {
      onBookCustomCombo(payload);
    }
  };

  const handleWhatsAppBooking = () => {
    let msg = `Hi TripGod! I built a Custom Bundle on your website:\n\n`;
    cartItems.forEach((item, i) => {
      msg += `${i + 1}. [${item.category}] ${item.name} — ₹${item.price}\n`;
    });
    msg += `\n📅 Travel Date: ${travelDate}\n👥 Guests: ${persons} Persons\n🔥 Combo Discount: ${discountPercent}% OFF (Saved ₹${totalSaved})\n💰 Total Amount: ₹${grandTotal.toLocaleString('en-IN')}`;

    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Combine items into single list for category filtering
  const allServicesList = [
    ...hotels.map(h => ({
      id: h.id,
      category: 'Hotel',
      name: h.name,
      price: Number(h.price),
      details: h.address || 'Tapovan, Rishikesh',
      image: (h.images && h.images[0]) || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=600',
      rating: h.rating || 4.5
    })),
    ...rafting.map(r => ({
      id: r.id,
      category: 'Rafting',
      name: r.name,
      price: Number(r.price),
      details: r.route || `${r.distance_km || 16} KM Stretch`,
      image: (r.images && r.images[0]) || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600',
      rating: 4.9
    })),
    ...bikes.map(b => ({
      id: b.id,
      category: 'Scooty',
      name: b.name,
      price: Number(b.price),
      details: `Pickup: ${b.pickup_location || 'Tapovan'}`,
      image: (b.images && b.images[0]) || '/classic-rent.png',
      rating: 4.8
    })),
    {
      id: 'camping-upgrade',
      category: 'Camping',
      name: 'Riverside Camping Night Upgrade',
      price: 999,
      details: 'Campfire, Evening Snacks & Buffet Dinner Included',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600',
      rating: 4.9
    }
  ];

  const filteredServices = activeCategory === 'all' 
    ? allServicesList 
    : allServicesList.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 overflow-y-auto font-sans animate-fadeIn">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-[#FF5F00]/10 border border-[#FF5F00]/25 text-[#FF5F00] text-xs font-black uppercase tracking-wider">
            TRIPGOD BUNDLE STORE
          </div>
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">
            Build Your Custom Rishikesh Package
          </span>
        </div>

        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        
        {/* Bombay Shaving Co Style Top Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5F00]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5F00] text-white text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              BUY MORE, SAVE MORE
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight">
              Add Any 2+ Services to Cart & <span className="text-[#FF5F00]">Unlock Up To 20% OFF</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              1. Add Hotels, Rafting & Scooty to cart below • 2. Auto-unlock 5%, 10%, 15% OFF • 3. Instant WhatsApp Location Vouchers!
            </p>
          </div>

          {/* Dynamic Unlock Progress Tracker */}
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#FF5F00]" />
                Cart Combo Tier: <strong className="text-[#FF5F00] text-sm">{discountPercent}% OFF APPLIED</strong>
              </span>

              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                {cartCount === 0 && "💡 Add 2 items to unlock 5% OFF!"}
                {cartCount === 1 && "💡 Add 1 more item to unlock 5% OFF!"}
                {cartCount === 2 && "🔥 Add 1 more item to unlock 10% OFF!"}
                {cartCount === 3 && "👑 Add 1 more item to unlock 15% OFF!"}
                {cartCount >= 4 && "🎉 MAX DISCOUNT TIER UNLOCKED!"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF5F00] via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (cartCount / 4) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-4 text-center text-[10px] font-bold text-slate-400">
              <span className={cartCount >= 1 ? "text-white font-black" : ""}>1 Item (0%)</span>
              <span className={cartCount >= 2 ? "text-[#FF5F00] font-black" : ""}>2 Items ({discountRules.tier2}% OFF)</span>
              <span className={cartCount >= 3 ? "text-[#FF5F00] font-black" : ""}>3 Items ({discountRules.tier3}% OFF)</span>
              <span className={cartCount >= 4 ? "text-emerald-400 font-black" : ""}>4+ Items ({discountRules.tier4}% OFF)</span>
            </div>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'hotel', label: '🏨 Hotels & Stays' },
            { id: 'rafting', label: '🚣 River Rafting' },
            { id: 'scooty', label: '🛵 Scooty Rentals' },
            { id: 'camping', label: '⛺ Camping & Extras' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                activeCategory === tab.id 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* E-Commerce Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map(item => {
            const inCart = isItemInCart(item.id, item.category);

            return (
              <div 
                key={`${item.category}-${item.id}`}
                className={`group bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.04)] ${
                  inCart ? 'border-[#FF5F00] ring-2 ring-[#FF5F00]/20 scale-[1.01]' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Image */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900/90 text-white backdrop-blur-xs">
                      {item.category}
                    </span>

                    <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-extrabold text-slate-900 flex items-center gap-1 shadow-xs">
                      ⭐ {item.rating}
                    </span>
                  </div>

                  {/* Card Details */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#FF5F00] transition line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-medium line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.details}
                    </p>
                    <div className="pt-2 flex items-baseline gap-1">
                      <span className="text-xs text-slate-400 font-medium">Rate:</span>
                      <span className="text-lg font-black text-slate-900 font-display">₹{item.price}</span>
                      <span className="text-[11px] text-slate-400">
                        {item.category === 'Hotel' ? '/night' : item.category === 'Scooty' ? '/day' : '/person'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ADD TO COMBO CART Button */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => toggleCartItem(item)}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      inCart 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                        : 'bg-[#FF5F00] hover:bg-[#FF3E00] text-white shadow-md shadow-[#FF5F00]/20'
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" /> ADDED TO COMBO CART
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 stroke-[3]" /> ADD TO COMBO CART
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Sticky Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-4 sm:p-5 backdrop-blur-md animate-slideUp">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Cart Summary */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="p-3 rounded-2xl bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">🛒 {cartCount} Services in Cart</span>
                  {discountPercent > 0 && (
                    <span className="text-[11px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-md">
                      🔥 {discountPercent}% OFF APPLIED
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 line-through">
                    ₹{(rawSubtotalPerPerson * persons).toLocaleString('en-IN')}
                  </span>
                  <span className="text-2xl font-black text-slate-900 font-display">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Saved ₹{totalSaved.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls & Checkout Button */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                <Users className="w-4 h-4 text-[#FF5F00]" />
                <select 
                  value={persons} 
                  onChange={(e) => setPersons(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                    <option key={n} value={n}>{n} Pax</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppBooking}
                className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition cursor-pointer"
                title="Inquire on WhatsApp"
              >
                💬 WhatsApp
              </button>

              <button
                type="button"
                onClick={handleProceedBooking}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-105 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#FF5F00]/30 transition flex items-center gap-2 border-none cursor-pointer"
              >
                <span>PROCEED TO BOOK BUNDLE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
