import React, { useState, useEffect } from 'react';
import { 
  Building2, Waves, Bike, Tent, Sparkles, CheckCircle2, 
  ArrowRight, ShieldCheck, Calendar, Users, Percent, Plus, Check, Trash2, Info
} from 'lucide-react';
import { supabase } from '../supabase';

export default function CustomPackageBuilder({ onBookCustomCombo }) {
  // Database State Lists
  const [hotelsList, setHotelsList] = useState([]);
  const [raftingList, setRaftingList] = useState([]);
  const [bikesList, setBikesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Selection States
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [selectedRaftingId, setSelectedRaftingId] = useState('');
  const [selectedBikeId, setSelectedBikeId] = useState('');
  const [selectedCamping, setSelectedCamping] = useState(false);

  // Booking Preferences
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [persons, setPersons] = useState(2);

  // Fetch real database records from Supabase
  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      const [
        { data: hData },
        { data: rData },
        { data: bData }
      ] = await Promise.all([
        supabase.from('hotels').select('id, name, price, address, images, rating').order('name'),
        supabase.from('rafting').select('id, name, price, route, distance_km, images').order('price'),
        supabase.from('bikes').select('id, name, price, pickup_location, images').order('price')
      ]);

      if (hData && hData.length > 0) {
        setHotelsList(hData);
        setSelectedHotelId(hData[0].id);
      }
      if (rData && rData.length > 0) {
        setRaftingList(rData);
        setSelectedRaftingId(rData[0].id);
      }
      if (bData && bData.length > 0) {
        // Filter duplicate bikes
        const uniqueBikes = bData.filter((b, idx, self) => 
          idx === self.findIndex(t => t.name === b.name && Number(t.price) > 0)
        );
        setBikesList(uniqueBikes);
        if (uniqueBikes.length > 0) setSelectedBikeId(uniqueBikes[0].id);
      }
    } catch (err) {
      console.error('Error loading custom builder options:', err);
    } finally {
      setLoading(false);
    }
  };

  // Selected Objects
  const selectedHotel = hotelsList.find(h => h.id === selectedHotelId);
  const selectedRafting = raftingList.find(r => r.id === selectedRaftingId);
  const selectedBike = bikesList.find(b => b.id === selectedBikeId);

  // Count active selections
  let activeItemsCount = 0;
  if (selectedHotelId) activeItemsCount++;
  if (selectedRaftingId) activeItemsCount++;
  if (selectedBikeId) activeItemsCount++;
  if (selectedCamping) activeItemsCount++;

  // Dynamic Discount Tier Calculation
  let discountPercent = 0;
  if (activeItemsCount === 2) discountPercent = 5;
  else if (activeItemsCount === 3) discountPercent = 10;
  else if (activeItemsCount >= 4) discountPercent = 15;

  // Base Prices Calculations
  const hotelPrice = selectedHotel ? Number(selectedHotel.price || 0) : 0;
  const raftingPrice = selectedRafting ? Number(selectedRafting.price || 0) : 0;
  const bikePrice = selectedBike ? Number(selectedBike.price || 0) : 0;
  const campingPrice = selectedCamping ? 999 : 0;

  const rawTotalPerPerson = hotelPrice + raftingPrice + bikePrice + campingPrice;
  const discountAmountPerPerson = Math.round((rawTotalPerPerson * discountPercent) / 100);
  const finalPricePerPerson = rawTotalPerPerson - discountAmountPerPerson;

  const grandTotal = finalPricePerPerson * persons;
  const totalSaved = discountAmountPerPerson * persons;

  const handleBookTrigger = () => {
    const selectedItemsArray = [];
    if (selectedHotel) selectedItemsArray.push({ type: 'Hotel', name: selectedHotel.name, price: hotelPrice });
    if (selectedRafting) selectedItemsArray.push({ type: 'Rafting', name: selectedRafting.name, price: raftingPrice });
    if (selectedBike) selectedItemsArray.push({ type: 'Scooty', name: selectedBike.name, price: bikePrice });
    if (selectedCamping) selectedItemsArray.push({ type: 'Camping', name: 'Riverside Camping Upgrade', price: 999 });

    const payload = {
      title: `Custom Rishikesh Combo (${activeItemsCount} Services)`,
      type: 'custom_combo',
      persons,
      travelDate,
      items: selectedItemsArray,
      discountPercent,
      rawTotal: rawTotalPerPerson * persons,
      totalSaved,
      totalPrice: grandTotal
    };

    if (onBookCustomCombo) {
      onBookCustomCombo(payload);
    }
  };

  const handleWhatsAppTrigger = () => {
    let summaryText = `Hi TripGod! I built a Custom Combo on your website:\n\n`;
    if (selectedHotel) summaryText += `🏨 Hotel: ${selectedHotel.name} (₹${hotelPrice})\n`;
    if (selectedRafting) summaryText += `🚣 Rafting: ${selectedRafting.name} (₹${raftingPrice})\n`;
    if (selectedBike) summaryText += `🛵 Bike: ${selectedBike.name} (₹${bikePrice})\n`;
    if (selectedCamping) summaryText += `⛺ Camping Upgrade (₹999)\n`;
    summaryText += `\n📅 Travel Date: ${travelDate}\n👥 Guests: ${persons} Persons\n🔥 Combo Discount: ${discountPercent}% OFF (Saved ₹${totalSaved})\n💰 Total Amount: ₹${grandTotal.toLocaleString('en-IN')}`;

    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(summaryText)}`, '_blank');
  };

  return (
    <section id="custom-builder-section" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      
      {/* Section Header (Clean Light Theme) */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5F00]/10 border border-[#FF5F00]/25 text-[#FF5F00] text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#FF5F00]" />
          BUILD YOUR OWN RISHIKESH BUNDLE
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 font-display tracking-tight leading-tight">
          Pick Your Vendor & <span className="text-[#FF5F00]">Unlock Up To 15% OFF</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Select your favorite Hotel, Rafting stretch & Scooty rental below. Every added service automatically increases your combo discount!
        </p>
      </div>

      {/* Dynamic Discount Unlock Progress Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.04)] mb-10 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-[#FF5F00]" />
            <span className="text-sm font-extrabold text-slate-900">
              Live Combo Discount Tier: <strong className="text-[#FF5F00] text-base font-display">{discountPercent}% OFF</strong>
            </span>
          </div>

          <div className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
            {activeItemsCount === 1 && "💡 Add 1 more item to unlock 5% Extra Discount!"}
            {activeItemsCount === 2 && "🔥 Add 1 more item to unlock 10% Extra Discount!"}
            {activeItemsCount === 3 && "👑 Add 1 more item to unlock MAX 15% Discount!"}
            {activeItemsCount >= 4 && "🎉 MAX 15% COMBO DISCOUNT UNLOCKED!"}
            {activeItemsCount === 0 && "Select items below to unlock discount"}
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div 
            className="h-full bg-gradient-to-r from-[#FF5F00] via-amber-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(activeItemsCount / 4) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-4 text-center text-[10px] sm:text-xs font-bold text-slate-500 pt-1">
          <span className={activeItemsCount >= 1 ? "text-slate-900 font-extrabold" : ""}>1 Item (0%)</span>
          <span className={activeItemsCount >= 2 ? "text-[#FF5F00] font-extrabold" : ""}>2 Items (5% OFF)</span>
          <span className={activeItemsCount >= 3 ? "text-[#FF5F00] font-extrabold" : ""}>3 Items (10% OFF)</span>
          <span className={activeItemsCount >= 4 ? "text-emerald-600 font-extrabold" : ""}>4 Items (15% OFF)</span>
        </div>
      </div>

      {/* Main Grid: Selection Columns + Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Selectors for Hotel, Rafting, Scooty & Extras */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: HOTEL STAY */}
          <div className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.04)] ${
            selectedHotelId ? 'border-emerald-500/60 ring-2 ring-emerald-500/10' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Step 1</span>
                  <h3 className="text-base font-bold text-slate-900">Select Hotel Stay</h3>
                </div>
              </div>

              {selectedHotelId && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                </span>
              )}
            </div>

            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#FF5F00] cursor-pointer"
            >
              <option value="">-- No Hotel (Skip) --</option>
              {hotelsList.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} — ₹{h.price}/night ({h.address || 'Rishikesh'})
                </option>
              ))}
            </select>

            {selectedHotel && (
              <div className="mt-3 flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                <img 
                  src={(selectedHotel.images && selectedHotel.images[0]) || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=300'} 
                  alt={selectedHotel.name}
                  className="w-16 h-12 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{selectedHotel.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{selectedHotel.address}</p>
                </div>
                <span className="text-sm font-extrabold text-slate-900">₹{selectedHotel.price}</span>
              </div>
            )}
          </div>

          {/* STEP 2: RIVER RAFTING */}
          <div className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.04)] ${
            selectedRaftingId ? 'border-cyan-500/60 ring-2 ring-cyan-500/10' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Step 2</span>
                  <h3 className="text-base font-bold text-slate-900">Select River Rafting Stretch</h3>
                </div>
              </div>

              {selectedRaftingId && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                </span>
              )}
            </div>

            <select
              value={selectedRaftingId}
              onChange={(e) => setSelectedRaftingId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#FF5F00] cursor-pointer"
            >
              <option value="">-- No Rafting (Skip) --</option>
              {raftingList.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} — ₹{r.price}/person ({r.route || `${r.distance_km || 16} KM`})
                </option>
              ))}
            </select>

            {selectedRafting && (
              <div className="mt-3 flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                <img 
                  src={(selectedRafting.images && selectedRafting.images[0]) || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=300'} 
                  alt={selectedRafting.name}
                  className="w-16 h-12 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{selectedRafting.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{selectedRafting.route}</p>
                </div>
                <span className="text-sm font-extrabold text-slate-900">₹{selectedRafting.price}</span>
              </div>
            )}
          </div>

          {/* STEP 3: SCOOTY / BIKE RENTAL */}
          <div className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.04)] ${
            selectedBikeId ? 'border-amber-500/60 ring-2 ring-amber-500/10' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Step 3</span>
                  <h3 className="text-base font-bold text-slate-900">Select Scooty / Bike Rental</h3>
                </div>
              </div>

              {selectedBikeId && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                </span>
              )}
            </div>

            <select
              value={selectedBikeId}
              onChange={(e) => setSelectedBikeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#FF5F00] cursor-pointer"
            >
              <option value="">-- No Scooty (Skip) --</option>
              {bikesList.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} — ₹{b.price}/day (Pickup: {b.pickup_location || 'Tapovan'})
                </option>
              ))}
            </select>

            {selectedBike && (
              <div className="mt-3 flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                <img 
                  src={(selectedBike.images && selectedBike.images[0]) || '/classic-rent.png'} 
                  alt={selectedBike.name}
                  className="w-16 h-12 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{selectedBike.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">Pickup: {selectedBike.pickup_location}</p>
                </div>
                <span className="text-sm font-extrabold text-slate-900">₹{selectedBike.price}</span>
              </div>
            )}
          </div>

          {/* STEP 4: EXTRA ADVENTURE (RIVERSIDE CAMPING UPGRADE) */}
          <div className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.04)] ${
            selectedCamping ? 'border-emerald-500/60 ring-2 ring-emerald-500/10' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                  <Tent className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Step 4 (Optional)</span>
                  <h3 className="text-base font-bold text-slate-900">Add Riverside Camping Night Upgrade</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Includes Campfire, Evening Snacks & Buffet Dinner (+₹999)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCamping(!selectedCamping)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  selectedCamping 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
              >
                {selectedCamping ? '✓ Added' : '+ Add ₹999'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Live Summary & Booking Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.06)] space-y-6 sticky top-28">
          
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5F00] bg-[#FF5F00]/10 px-3 py-1 rounded-full">
              Live Custom Calculation
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 font-display mt-2">
              Your Bundle Summary
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {activeItemsCount} Services Selected
            </p>
          </div>

          {/* Itemized List */}
          <div className="space-y-2 border-y border-slate-100 py-4 text-xs">
            {selectedHotel && (
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span>🏨 {selectedHotel.name}</span>
                <span className="font-bold text-slate-900">₹{hotelPrice}</span>
              </div>
            )}
            {selectedRafting && (
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span>🚣 {selectedRafting.name}</span>
                <span className="font-bold text-slate-900">₹{raftingPrice}</span>
              </div>
            )}
            {selectedBike && (
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span>🛵 {selectedBike.name}</span>
                <span className="font-bold text-slate-900">₹{bikePrice}</span>
              </div>
            )}
            {selectedCamping && (
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span>⛺ Riverside Camping Upgrade</span>
                <span className="font-bold text-slate-900">₹999</span>
              </div>
            )}

            {activeItemsCount === 0 && (
              <div className="text-center py-4 text-slate-400 text-xs italic">
                Select hotel, rafting, or scooty to calculate price
              </div>
            )}
          </div>

          {/* Date & Guest Inputs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <Calendar className="w-4 h-4 text-[#FF5F00]" />
              <input 
                type="date"
                value={travelDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setTravelDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <Users className="w-4 h-4 text-[#FF5F00]" />
              <span className="text-xs text-slate-500 font-bold">Guests:</span>
              <select
                value={persons}
                onChange={(e) => setPersons(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none w-full cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'Persons'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal ({persons} Pax):</span>
              <span className="line-through">₹{(rawTotalPerPerson * persons).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-xs font-extrabold text-[#FF5F00]">
              <span>Combo Discount ({discountPercent}% OFF):</span>
              <span>-₹{totalSaved.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-900">Total Payable:</span>
              <span className="text-2xl font-black text-slate-900 font-display">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleBookTrigger}
              disabled={activeItemsCount === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-[1.02] active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FF5F00]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>BOOK CUSTOM BUNDLE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleWhatsAppTrigger}
              className="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              💬 WhatsApp Custom Inquiry
            </button>
          </div>

        </div>

      </div>

    </section>
  );
}
