import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, Calendar, Users, 
  Percent, Plus, Check, X, Star, MapPin, ChevronLeft, ExternalLink, Info, Map
} from 'lucide-react';
import { supabase } from '../supabase';

// Helper to convert full address into short 2-word landmark (e.g., "Tapovan, Rishikesh", "Ram Jhula", "Shivpuri")
const toShortAddress = (fullAddress, defaultLoc = 'Tapovan, Rishikesh') => {
  if (!fullAddress) return defaultLoc;
  const parts = fullAddress.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return defaultLoc;

  // Filter out redundant country/state words
  const cleanParts = parts.filter(p => !['india', 'uttarakhand', 'pin', '249192', '249201'].includes(p.toLowerCase()));
  if (cleanParts.length >= 2) {
    return `${cleanParts[cleanParts.length - 2]}, ${cleanParts[cleanParts.length - 1]}`;
  }
  return cleanParts[0] || defaultLoc;
};

// Preset Rafting Stretches
const RAFTING_STRETCHES = [
  { id: '12km', name: '12 KM Brahmpuri Rafting', km: 12, price: 599, route: 'Brahmpuri to NIM Beach (Rishikesh)' },
  { id: '16km', name: '16 KM Shivpuri Rafting', km: 16, price: 899, route: 'Shivpuri to NIM Beach (Most Popular)' },
  { id: '24km', name: '24 KM Marine Drive Rafting', km: 24, price: 1499, route: 'Marine Drive to Rishikesh (Extreme Rapids)' },
  { id: '32km', name: '32 KM Kaudiyala Extreme Rafting', km: 32, price: 2499, route: 'Kaudiyala to Rishikesh (Pro Rapid Grade IV)' }
];

export default function CustomComboPage({ onClose, onBookCustomCombo }) {
  // Database State Lists
  const [hotels, setHotels] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState('all');

  // Selected Rafting Stretch State for Rafting Card
  const [selectedRaftingStretch, setSelectedRaftingStretch] = useState(RAFTING_STRETCHES[1]); // Default 16KM

  // Service Details Modal/Drawer State
  const [activeDetailItem, setActiveDetailItem] = useState(null);

  // Dynamic Discount Tier Rules (Editable via Admin or Default)
  const [discountRules, setDiscountRules] = useState(() => {
    try {
      const saved = localStorage.getItem('tripgod_combo_discount_rules');
      return saved ? JSON.parse(saved) : { tier2: 5, tier3: 10, tier4: 15, tier5: 20 };
    } catch {
      return { tier2: 5, tier3: 10, tier4: 15, tier5: 20 };
    }
  });

  // Selected Cart Items Array
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
        { data: bData }
      ] = await Promise.all([
        supabase.from('hotels').select('id, name, price, address, images, rating, landmarks, description').order('name'),
        supabase.from('bikes').select('id, name, price, pickup_location, images, description').order('price')
      ]);

      if (hData) setHotels(hData);
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

  const isItemInCart = (id, category) => {
    return cartItems.some(i => i.id === id && i.category === category);
  };

  // Cart calculations
  const cartCount = cartItems.length;
  let discountPercent = 0;
  if (cartCount === 2) discountPercent = discountRules.tier2 || 5;
  else if (cartCount === 3) discountPercent = discountRules.tier3 || 10;
  else if (cartCount === 4) discountPercent = discountRules.tier4 || 15;
  else if (cartCount >= 5) discountPercent = discountRules.tier5 || 20;

  const rawSubtotalPerPerson = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const discountAmountPerPerson = Math.round((rawSubtotalPerPerson * discountPercent) / 100);
  const finalPricePerPerson = rawSubtotalPerPerson - discountAmountPerPerson;

  const grandTotal = finalPricePerPerson * persons;
  const totalSaved = discountAmountPerPerson * persons;
  const advance10Percent = Math.round(grandTotal * 0.1);

  const handleProceedBooking = () => {
    if (cartItems.length === 0) return;
    const payload = {
      id: `custom-combo-${Date.now()}`,
      title: `Custom Rishikesh Combo (${cartCount} Services)`,
      name: `Custom Rishikesh Combo (${cartCount} Services)`,
      type: 'custom_combo',
      category: 'combo',
      price: finalPricePerPerson,
      totalPrice: grandTotal,
      advance_amount: advance10Percent,
      persons,
      guests: persons,
      travelDate,
      items: cartItems,
      discountPercent,
      rawTotal: rawSubtotalPerPerson * persons,
      totalSaved
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
      details: toShortAddress(h.address, 'Tapovan, Rishikesh'),
      fullAddress: h.address || 'Tapovan, Rishikesh',
      image: (h.images && h.images[0]) || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=600',
      allImages: h.images || ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=600'],
      rating: h.rating || 4.5,
      description: h.description || 'Comfortable hotel stay with modern amenities, mountain view, hot water & Wi-Fi.'
    })),
    // Dynamic Rafting Card
    {
      id: `rafting-${selectedRaftingStretch.id}`,
      category: 'Rafting',
      name: selectedRaftingStretch.name,
      price: selectedRaftingStretch.price,
      details: selectedRaftingStretch.route,
      fullAddress: 'Shivpuri / Brahmpuri Rafting Point, Rishikesh',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600',
      allImages: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600'],
      rating: 4.9,
      isRaftingStretchSelector: true,
      description: 'Includes certified river guide, safety life jackets, helmet, cliff jumping & safety kayak support.'
    },
    ...bikes.map(b => ({
      id: b.id,
      category: 'Scooty',
      name: b.name,
      price: Number(b.price),
      details: `Pickup: ${toShortAddress(b.pickup_location, 'Tapovan')}`,
      fullAddress: b.pickup_location || 'Tapovan, Rishikesh',
      image: (b.images && b.images[0]) || '/classic-rent.png',
      allImages: b.images || ['/classic-rent.png'],
      rating: 4.8,
      description: b.description || 'Includes 1 Helmet, Unlimited KM riding in Rishikesh, clean document verification & pickup at Tapovan.'
    })),
    {
      id: 'camping-upgrade',
      category: 'Camping',
      name: 'Riverside Camping Night Upgrade',
      price: 999,
      details: 'Shivpuri River Bank',
      fullAddress: 'Shivpuri Riverside Campsite, Rishikesh',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600',
      allImages: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600'],
      rating: 4.9,
      description: 'Includes Campfire, Evening Snacks, Live Music, Buffet Dinner, Breakfast & Swimming Pool Access.'
    }
  ];

  const filteredServices = activeCategory === 'all' 
    ? allServicesList 
    : allServicesList.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 overflow-y-auto font-sans animate-fadeIn">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-0.5 rounded-full bg-[#FF5F00] text-white text-[10px] font-black uppercase tracking-wider">
            TRIPGOD STORE
          </div>
          <span className="text-xs text-slate-600 font-bold hidden sm:inline">
            Build Your Custom Rishikesh Combo
          </span>
        </div>

        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36">
        
        {/* Sleek Compact Top Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-6 border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5F00]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF5F00] text-white text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              BUY MORE, SAVE MORE
            </div>
            <h1 className="text-xl sm:text-3xl font-black font-display tracking-tight leading-tight">
              Add 2+ Services to Cart & <span className="text-[#FF5F00]">Unlock Up To 20% OFF</span>
            </h1>
            <p className="text-xs text-slate-300 font-medium line-clamp-1">
              Select Hotels, Rafting & Scooty below • Auto-unlock 5%, 10%, 15% OFF • Instant WhatsApp Location Vouchers!
            </p>
          </div>

          {/* Compact Unlock Progress Tracker */}
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-1 text-[11px]">
                <Percent className="w-3.5 h-3.5 text-[#FF5F00]" />
                Cart Tier: <strong className="text-[#FF5F00]">{discountPercent}% OFF APPLIED</strong>
              </span>

              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                {cartCount === 0 && "💡 Add 2 items for 5% OFF!"}
                {cartCount === 1 && "💡 Add 1 more item for 5% OFF!"}
                {cartCount === 2 && "🔥 Add 1 more item for 10% OFF!"}
                {cartCount === 3 && "👑 Add 1 more item for 15% OFF!"}
                {cartCount >= 4 && "🎉 MAX DISCOUNT UNLOCKED!"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF5F00] via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (cartCount / 4) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-4 text-center text-[9px] font-bold text-slate-400 pt-0.5">
              <span className={cartCount >= 1 ? "text-white font-black" : ""}>1 (0%)</span>
              <span className={cartCount >= 2 ? "text-[#FF5F00] font-black" : ""}>2 ({discountRules.tier2}% OFF)</span>
              <span className={cartCount >= 3 ? "text-[#FF5F00] font-black" : ""}>3 ({discountRules.tier3}% OFF)</span>
              <span className={cartCount >= 4 ? "text-emerald-400 font-black" : ""}>4+ ({discountRules.tier4}% OFF)</span>
            </div>
          </div>
        </div>

        {/* Premium Hotel-Style Quick Filter Pills (No Emojis) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar mb-5">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'hotel', label: 'Hotels & Stays' },
            { id: 'rafting', label: 'River Rafting' },
            { id: 'scooty', label: 'Scooty Rentals' },
            { id: 'camping', label: 'Camping & Extras' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer border ${
                activeCategory === tab.id 
                  ? 'bg-[#FF5F00] text-white border-[#FF5F00] shadow-md shadow-orange-500/20' 
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-xs'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2-COLUMN CARDS GRID (Bombay Shaving Co Style: 2 Cards Side-by-Side on Mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredServices.map(item => {
            const inCart = isItemInCart(item.id, item.category);

            return (
              <div 
                key={`${item.category}-${item.id}`}
                className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-[0_2px_15px_rgba(0,0,0,0.03)] ${
                  inCart ? 'border-[#FF5F00] ring-2 ring-[#FF5F00]/20 scale-[1.01]' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Card Top Details (Click Opens Detail Drawer) */}
                <div 
                  onClick={() => setActiveDetailItem(item)}
                  className="cursor-pointer flex-1"
                >
                  {/* Card Image */}
                  <div className="relative h-32 sm:h-40 w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900/90 text-white backdrop-blur-xs">
                      {item.category}
                    </span>

                    <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-extrabold text-slate-900 flex items-center gap-0.5 shadow-xs">
                      ⭐ {item.rating}
                    </span>
                  </div>

                  {/* Card Text Content */}
                  <div className="p-2.5 sm:p-3 space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#FF5F00] transition line-clamp-1 leading-tight">
                      {item.name}
                    </h3>
                    
                    <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-0.5 font-medium line-clamp-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {item.details}
                    </p>

                    {/* Special Rafting Stretch Selector on Card */}
                    {item.isRaftingStretchSelector && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1"
                      >
                        <select
                          value={selectedRaftingStretch.id}
                          onChange={(e) => {
                            const found = RAFTING_STRETCHES.find(s => s.id === e.target.value);
                            if (found) setSelectedRaftingStretch(found);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-900 outline-none cursor-pointer"
                        >
                          {RAFTING_STRETCHES.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.km} KM ({s.name.split(' ')[2]}) — ₹{s.price}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="pt-1 flex items-baseline gap-1">
                      <span className="text-[10px] text-slate-400 font-medium">From:</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 font-display">₹{item.price}</span>
                      <span className="text-[9px] text-slate-400">
                        {item.category === 'Hotel' ? '/night' : item.category === 'Scooty' ? '/day' : '/person'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ADD TO COMBO CART Button */}
                <div className="p-2 sm:p-2.5 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCartItem(item);
                    }}
                    className={`w-full py-2 sm:py-2.5 rounded-xl font-extrabold text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                      inCart 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                        : 'bg-[#FF5F00] hover:bg-[#FF3E00] text-white shadow-md shadow-orange-500/20'
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> <span className="truncate">ADDED</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[3]" /> <span className="truncate">ADD TO CART</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SERVICE DETAILS DRAWER / MODAL */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl relative">
            
            {/* Header & Back Button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button 
                onClick={() => setActiveDetailItem(null)}
                className="flex items-center gap-1 text-xs font-bold text-[#FF5F00] hover:underline cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Store
              </button>

              <button 
                onClick={() => setActiveDetailItem(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo & Badge */}
            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-100">
              <img 
                src={activeDetailItem.image} 
                alt={activeDetailItem.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 text-xs font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-lg">
                {activeDetailItem.category}
              </span>
            </div>

            {/* Title & Short Landmark Address */}
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">
                {activeDetailItem.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF5F00]" />
                {activeDetailItem.fullAddress}
              </p>
            </div>

            {/* Description & Inclusions */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-[#FF5F00]">Service Overview</h4>
              <p className="text-slate-600 leading-relaxed font-medium">
                {activeDetailItem.description}
              </p>
            </div>

            {/* Price & Add to Cart Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Rate</span>
                <span className="text-xl font-black text-slate-900 font-display">₹{activeDetailItem.price}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleCartItem(activeDetailItem);
                  setActiveDetailItem(null);
                }}
                className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  isItemInCart(activeDetailItem.id, activeDetailItem.category)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FF5F00] text-white shadow-md shadow-orange-500/20'
                }`}
              >
                {isItemInCart(activeDetailItem.id, activeDetailItem.category) ? '✓ In Cart' : '+ Add to Cart'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-3.5 sm:p-5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Cart Pricing Summary */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 rounded-xl bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700">🛒 {cartCount} Services</span>
                  {discountPercent > 0 && (
                    <span className="text-[10px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-md">
                      🔥 {discountPercent}% OFF APPLIED
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 line-through">
                    ₹{(rawSubtotalPerPerson * persons).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                    Saved ₹{totalSaved.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls & Checkout Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-2 rounded-xl border border-slate-200">
                <Users className="w-3.5 h-3.5 text-[#FF5F00]" />
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
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition cursor-pointer"
                title="Inquire on WhatsApp"
              >
                💬
              </button>

              <button
                type="button"
                onClick={handleProceedBooking}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-105 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#FF5F00]/20 transition flex items-center justify-center gap-1.5 border-none cursor-pointer"
              >
                <span>PROCEED TO BOOK</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
