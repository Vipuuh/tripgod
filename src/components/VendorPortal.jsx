import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Phone, ShieldCheck, Power, RefreshCw, LogOut, CheckCircle2, XCircle, 
  DollarSign, Calendar, User, Clock, Package, Edit2, Save, Bike, Waves, Building2, MapPin
} from 'lucide-react';
import { supabase } from '../supabase';

export default function VendorPortal({ onNavigateHome }) {
  // Auth state
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingVendor, setPendingVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [currentVendor, setCurrentVendor] = useState(() => {
    const saved = localStorage.getItem('tripgod_vendor_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Portal view state
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'bookings'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Vendor Data
  const [vendorItems, setVendorItems] = useState([]);
  const [vendorBookings, setVendorBookings] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Step 1: Send OTP to Vendor Mobile
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    try {
      const cleanedPhone = phoneInput.trim();
      const inputNum = cleanedPhone.replace(/\D/g, '');

      if (!cleanedPhone || inputNum.length < 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }

      let matchedVendor = null;

      // 1. Check vendors table
      const { data: vendors } = await supabase.from('vendors').select('*');
      if (vendors && vendors.length > 0) {
        matchedVendor = vendors.find(v => {
          const vPhone = (v.phone || '').replace(/\D/g, '');
          const vWa = (v.whatsapp || '').replace(/\D/g, '');
          return vPhone.includes(inputNum) || vWa.includes(inputNum) || inputNum.includes(vPhone) || inputNum.includes(vWa);
        });
      }

      // 2. Fallback: Check hotels, bikes, rafting, tours tables for direct whatsapp_number match
      if (!matchedVendor) {
        const { data: directHotels } = await supabase.from('hotels').select('*');
        const matchedHotel = (directHotels || []).find(h => {
          const hWa = (h.whatsapp_number || '').replace(/\D/g, '');
          return hWa && (hWa.includes(inputNum) || inputNum.includes(hWa));
        });

        if (matchedHotel) {
          matchedVendor = {
            id: matchedHotel.vendor_id || matchedHotel.id,
            name: matchedHotel.name,
            category: 'Hotel',
            phone: cleanedPhone,
            whatsapp: cleanedPhone,
            status: 'Active',
            is_direct: true
          };
        }
      }

      if (!matchedVendor) {
        const { data: directBikes } = await supabase.from('bikes').select('*');
        const matchedBike = (directBikes || []).find(b => {
          const bWa = (b.whatsapp_number || '').replace(/\D/g, '');
          return bWa && (bWa.includes(inputNum) || inputNum.includes(bWa));
        });

        if (matchedBike) {
          matchedVendor = {
            id: matchedBike.vendor_id || matchedBike.id,
            name: matchedBike.name,
            category: 'Bike Rental',
            phone: cleanedPhone,
            whatsapp: cleanedPhone,
            status: 'Active',
            is_direct: true
          };
        }
      }

      if (!matchedVendor) {
        const { data: directRafting } = await supabase.from('rafting').select('*');
        const matchedRafting = (directRafting || []).find(r => {
          const rWa = (r.whatsapp_number || '').replace(/\D/g, '');
          return rWa && (rWa.includes(inputNum) || inputNum.includes(rWa));
        });

        if (matchedRafting) {
          matchedVendor = {
            id: matchedRafting.vendor_id || matchedRafting.id,
            name: matchedRafting.name,
            category: 'Rafting',
            phone: cleanedPhone,
            whatsapp: cleanedPhone,
            status: 'Active',
            is_direct: true
          };
        }
      }

      if (!matchedVendor) {
        throw new Error('Mobile number not registered. Please contact admin to onboard your shop or hotel.');
      }

      // Generate a 4-digit OTP
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);
      setPendingVendor(matchedVendor);
      setOtpSent(true);

      // Trigger WhatsApp OTP message
      const waUrl = `https://wa.me/91${inputNum}?text=${encodeURIComponent(`Your TripGod Partner Portal Security Login OTP is: ${newOtp}. Do not share this OTP with anyone.`)}`;
      window.open(waUrl, '_blank');

    } catch (err) {
      setAuthError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setAuthError('');

    if (!otpInput || otpInput.trim() !== generatedOtp) {
      setAuthError('Invalid OTP entered. Please check and try again.');
      return;
    }

    // OTP Verified Successfully
    setCurrentVendor(pendingVendor);
    localStorage.setItem('tripgod_vendor_session', JSON.stringify(pendingVendor));
    setOtpSent(false);
    setGeneratedOtp(null);
    setPendingVendor(null);
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentVendor(null);
    localStorage.removeItem('tripgod_vendor_session');
    setPhoneInput('');
    setOtpInput('');
    setOtpSent(false);
    setGeneratedOtp(null);
    setPendingVendor(null);
  };

  // Fetch Vendor Products & Bookings
  const fetchVendorData = async () => {
    if (!currentVendor) return;
    setIsDataLoading(true);

    try {
      const vId = currentVendor.id;
      const vPhone = (currentVendor.phone || '').replace(/\D/g, '');

      // Helper matcher for direct WhatsApp items
      const matchesPhone = (waNum) => {
        if (!waNum) return false;
        const cleanedWa = waNum.replace(/\D/g, '');
        return cleanedWa && (cleanedWa.includes(vPhone) || vPhone.includes(cleanedWa));
      };

      // 1. Fetch bikes
      const { data: bikes } = await supabase.from('bikes').select('*');
      const filteredBikes = (bikes || []).filter(b => b.vendor_id === vId || matchesPhone(b.whatsapp_number));

      // 2. Fetch rafting
      const { data: rafting } = await supabase.from('rafting').select('*');
      const filteredRafting = (rafting || []).filter(r => r.vendor_id === vId || matchesPhone(r.whatsapp_number));

      // 3. Fetch hotels
      const { data: hotels } = await supabase.from('hotels').select('*');
      const filteredHotels = (hotels || []).filter(h => h.vendor_id === vId || matchesPhone(h.whatsapp_number));

      // 4. Fetch tours
      const { data: tours } = await supabase.from('tours').select('*');
      const filteredTours = (tours || []).filter(t => t.vendor_id === vId || matchesPhone(t.contact_number) || matchesPhone(t.whatsapp_number));

      // Combine items with category tag
      const allItems = [
        ...filteredBikes.map(b => ({ ...b, category_type: 'bikes', label: 'Bike/Scooty' })),
        ...filteredRafting.map(r => ({ ...r, category_type: 'rafting', label: 'Rafting' })),
        ...filteredHotels.map(h => ({ ...h, category_type: 'hotels', label: 'Hotel' })),
        ...filteredTours.map(t => ({ ...t, category_type: 'tours', label: 'Tour' }))
      ];

      setVendorItems(allItems);

      // Fetch bookings for this vendor
      const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      const filteredBookings = (bookings || []).filter(b => b.vendor_id === vId || matchesPhone(b.customer_phone));

      setVendorBookings(filteredBookings.length > 0 ? filteredBookings : (bookings || []).filter(b => b.vendor_id === vId));

    } catch (err) {
      console.error('Error fetching vendor data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (currentVendor) {
      fetchVendorData();
    }
  }, [currentVendor]);

  // Master Vendor Status Toggle (Active / Inactive)
  const toggleMasterStatus = async () => {
    if (!currentVendor) return;
    const newStatus = currentVendor.status === 'Active' ? 'Inactive' : 'Active';
    const isOnline = newStatus === 'Active';

    try {
      const { error } = await supabase
        .from('vendors')
        .update({ status: newStatus, is_online: isOnline })
        .eq('id', currentVendor.id);

      if (error) throw error;

      const updated = { ...currentVendor, status: newStatus, is_online: isOnline };
      setCurrentVendor(updated);
      localStorage.setItem('tripgod_vendor_session', JSON.stringify(updated));
      setStatusMessage(`Shop status updated to ${newStatus}`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert('Failed to update shop status: ' + err.message);
    }
  };

  // Toggle Item Availability (Online / Offline)
  const toggleItemAvailability = async (item) => {
    const currentAvailability = item.is_available !== false;
    const newAvailability = !currentAvailability;

    try {
      const { error } = await supabase
        .from(item.category_type)
        .update({ is_available: newAvailability })
        .eq('id', item.id);

      if (error) throw error;

      setVendorItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newAvailability } : i));
      setStatusMessage(`${item.name} status updated to ${newAvailability ? 'Online' : 'Offline'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert('Failed to update item availability: ' + err.message);
    }
  };

  // Update Item Price
  const handleSavePrice = async (item) => {
    if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) {
      alert('Please enter a valid price amount.');
      return;
    }

    const priceNum = Number(newPrice);

    try {
      const { error } = await supabase
        .from(item.category_type)
        .update({ price: priceNum })
        .eq('id', item.id);

      if (error) throw error;

      setVendorItems(prev => prev.map(i => i.id === item.id ? { ...i, price: priceNum } : i));
      setEditingItemId(null);
      setNewPrice('');
      setStatusMessage(`Price for ${item.name} updated to ₹${priceNum}`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert('Failed to update price: ' + err.message);
    }
  };

  // Filtered items
  const filteredItems = vendorItems.filter(item => {
    if (categoryFilter === 'all') return true;
    return item.category_type === categoryFilter;
  });

  // Login View
  if (!currentVendor) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <ShieldCheck className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase font-display">
              TripGod Partner Portal
            </h1>
            <p className="text-slate-400 text-xs mt-2 font-medium">
              Vendor Login for Shop Status, Price Control & Live Bookings
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-semibold">
              {authError}
            </div>
          )}

          {!otpSent ? (
            /* Step 1: Mobile Number Input */
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white text-sm font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm uppercase tracking-wider rounded-2xl transition-all duration-200 shadow-lg shadow-orange-600/20 disabled:opacity-50"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP via Mobile / WhatsApp'}
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification Input */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-medium space-y-2">
                <div className="font-bold text-emerald-400 uppercase tracking-wider">OTP Sent to WhatsApp</div>
                <div>A 4-digit security code has been generated for +91 {phoneInput}.</div>
                <a
                  href={`https://wa.me/91${phoneInput.replace(/\D/g, '')}?text=${encodeURIComponent(`Your TripGod Partner Portal Security Login OTP is: ${generatedOtp}. Do not share this OTP with anyone.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors mt-1"
                >
                  Click Here to Open WhatsApp OTP
                </a>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Enter 4-Digit OTP Code
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={4}
                    required
                    autoFocus
                    placeholder="Enter 4-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white text-base tracking-widest font-black focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm uppercase tracking-wider rounded-2xl transition-all duration-200 shadow-lg shadow-orange-600/20"
              >
                Verify OTP & Login
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpInput('');
                    setAuthError('');
                  }}
                  className="text-xs text-slate-400 hover:text-orange-400 underline font-semibold transition-colors"
                >
                  Change Mobile Number / Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Back to Main Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">
              TripGod Partner Desk
            </span>
            <h1 className="text-xl font-black text-white uppercase tracking-tight font-display">
              {currentVendor.name}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Category: {currentVendor.category}</span>
              <span>•</span>
              <span>Phone: {currentVendor.phone}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Master Shop Status Toggle */}
            <button
              onClick={toggleMasterStatus}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                currentVendor.status === 'Active'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>Shop Status: {currentVendor.status === 'Active' ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Status Message Alert */}
        {statusMessage && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-2xl text-xs font-bold uppercase tracking-wider">
            {statusMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-4 px-4 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'inventory'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Inventory & Price Control ({vendorItems.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-4 px-4 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'bookings'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Bookings ({vendorBookings.length})
          </button>
        </div>

        {/* Tab 1: Inventory & Price Control */}
        {activeTab === 'inventory' && (
          <div>
            {/* Category Filter Pills */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {['all', 'bikes', 'rafting', 'hotels', 'tours'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchVendorData}
                disabled={isDataLoading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>

            {/* Inventory List Grid */}
            {isDataLoading ? (
              <div className="text-center py-12 text-slate-500 text-sm font-semibold">
                Loading inventory items...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-slate-400 text-sm">
                No inventory items found for this shop category.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => {
                  const isAvailable = item.is_available !== false;
                  const isEditing = editingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`bg-slate-900/90 border rounded-3xl p-5 shadow-xl transition-all ${
                        isAvailable ? 'border-slate-800' : 'border-red-900/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                            {item.label}
                          </span>
                          <h3 className="text-base font-bold text-white mt-2 leading-snug">
                            {item.name}
                          </h3>
                        </div>

                        {/* Item Status Toggle */}
                        <button
                          onClick={() => toggleItemAvailability(item)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-colors ${
                            isAvailable
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {isAvailable ? 'Online' : 'Offline'}
                        </button>
                      </div>

                      {/* Item Pricing Control */}
                      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Selling Price
                          </span>
                          {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder={item.price}
                                className="w-24 px-3 py-1.5 bg-slate-950 border border-orange-500/50 rounded-xl text-white text-sm font-bold focus:outline-none"
                              />
                              <button
                                onClick={() => handleSavePrice(item)}
                                className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-lg font-black text-white mt-0.5">
                              ₹{item.price}{' '}
                              {item.original_price && (
                                <span className="text-xs text-slate-500 line-through font-normal">
                                  ₹{item.original_price}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setNewPrice(item.price);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Price</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Bookings */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Incoming Customer Bookings
              </h2>
              <button
                onClick={fetchVendorData}
                disabled={isDataLoading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Bookings</span>
              </button>
            </div>

            {isDataLoading ? (
              <div className="text-center py-12 text-slate-500 text-sm font-semibold">
                Loading bookings...
              </div>
            ) : vendorBookings.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-slate-400 text-sm">
                No customer bookings found for your shop yet.
              </div>
            ) : (
              <div className="space-y-4">
                {vendorBookings.map(b => (
                  <div
                    key={b.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    {/* Left: Booked Item & Customer Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                          {b.service_type || 'Booking'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          Booking ID: {b.id.substring(0, 8)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight">
                          Item Booked: {b.item_name || b.service_type || 'TripGod Service'}
                        </h3>
                        {b.quantity && (
                          <p className="text-xs text-slate-300 font-semibold mt-1">
                            Quantity: {b.quantity}
                          </p>
                        )}
                      </div>

                      {/* Customer Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-2 text-slate-300">
                          <User className="w-4 h-4 text-orange-500" />
                          <span>Customer: <strong className="text-white">{b.customer_name}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone className="w-4 h-4 text-orange-500" />
                          <span>Phone: <a href={`tel:${b.customer_phone}`} className="text-orange-400 underline font-semibold">{b.customer_phone}</a></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span>Travel Date: <strong className="text-white">{b.travel_date || b.booking_date}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Payment Breakdown & Status */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 min-w-[260px] flex flex-col justify-between gap-4">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Advance Paid Online:</span>
                          <span className="text-emerald-400 font-bold text-sm">₹{b.amount_paid}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300 font-semibold pt-1 border-t border-slate-800">
                          <span>Collect Cash/UPI at Shop:</span>
                          <span className="text-orange-400 font-black text-base">₹{b.remaining_amount}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {b.status || 'Confirmed'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
