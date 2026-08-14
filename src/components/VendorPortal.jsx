import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Phone, ShieldCheck, Power, RefreshCw, LogOut, CheckCircle2, XCircle, 
  DollarSign, Calendar, User, Clock, Package, Edit2, Save, Bike, Waves, Building2, MapPin, Plus, Minus
} from 'lucide-react';
import { supabase } from '../supabase';

export default function VendorPortal({ onNavigateHome, isStandaloneApp = false }) {
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

  // PWA Installation handling
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(prev => !prev);
    }
  };

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
          return (vPhone && vPhone.length >= 7 && inputNum.includes(vPhone)) || 
                 (vWa && vWa.length >= 7 && inputNum.includes(vWa));
        });
      }

      // 2. Fallback: Check hotels, bikes, rafting, tours tables for direct phone match
      if (!matchedVendor) {
        const { data: directHotels } = await supabase.from('hotels').select('*');
        const matchedHotel = (directHotels || []).find(h => {
          const hWa = (h.whatsapp_number || '').replace(/\D/g, '');
          const hPh = (h.phone_number || '').replace(/\D/g, '');
          return (hWa && hWa.length >= 7 && inputNum.includes(hWa)) || 
                 (hPh && hPh.length >= 7 && inputNum.includes(hPh));
        });

        if (matchedHotel) {
          matchedVendor = {
            id: matchedHotel.id,
            direct_item_id: matchedHotel.id,
            vendor_id: matchedHotel.vendor_id,
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
          return bWa && bWa.length >= 7 && inputNum.includes(bWa);
        });

        if (matchedBike) {
          matchedVendor = {
            id: matchedBike.id,
            direct_item_id: matchedBike.id,
            vendor_id: matchedBike.vendor_id,
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
          return rWa && rWa.length >= 7 && inputNum.includes(rWa);
        });

        if (matchedRafting) {
          matchedVendor = {
            id: matchedRafting.id,
            direct_item_id: matchedRafting.id,
            vendor_id: matchedRafting.vendor_id,
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
        const { data: directTours } = await supabase.from('tours').select('*');
        const matchedTour = (directTours || []).find(t => {
          const tWa = (t.whatsapp_number || t.contact_number || '').replace(/\D/g, '');
          return tWa && tWa.length >= 7 && inputNum.includes(tWa);
        });

        if (matchedTour) {
          matchedVendor = {
            id: matchedTour.id,
            direct_item_id: matchedTour.id,
            vendor_id: matchedTour.vendor_id,
            name: matchedTour.title || matchedTour.name,
            category: 'Tour',
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

      // Call WhatsApp API (uses existing /api/send-otp endpoint)
      try {
        await sendWhatsAppOtp(cleanedPhone, newOtp, matchedVendor?.name);
      } catch (apiErr) {
        console.warn('WhatsApp API notice:', apiErr.message);
      }

    } catch (err) {
      setAuthError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Automated WhatsApp OTP Sender (uses existing /api/send-otp Meta WhatsApp API endpoint)
  const sendWhatsAppOtp = async (phone, otp, vendorName) => {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          name: vendorName || 'Partner',
          otp: otp
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        console.warn('Backend WhatsApp API note:', result.error || 'Failed to dispatch WhatsApp message');
      }
    } catch (err) {
      console.warn('WhatsApp API network call note:', err.message);
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
      const rawVendorId = currentVendor.vendor_id;
      const vPhone = (currentVendor.phone || '').replace(/\D/g, '');
      const isDirect = currentVendor.is_direct;

      // Helper matcher for direct WhatsApp numbers
      const matchesPhone = (waNum) => {
        if (!waNum) return false;
        const cleanedWa = waNum.replace(/\D/g, '');
        return cleanedWa && vPhone && (cleanedWa.includes(vPhone) || vPhone.includes(cleanedWa));
      };

      // 1. Fetch bikes
      const { data: bikes } = await supabase.from('bikes').select('*');
      const filteredBikes = (bikes || []).filter(b => {
        if (isDirect) {
          return b.id === vId || matchesPhone(b.whatsapp_number);
        }
        return b.vendor_id === vId || matchesPhone(b.whatsapp_number);
      });

      // 2. Fetch rafting
      const { data: rafting } = await supabase.from('rafting').select('*');
      const filteredRafting = (rafting || []).filter(r => {
        if (isDirect) {
          return r.id === vId || matchesPhone(r.whatsapp_number);
        }
        return r.vendor_id === vId || matchesPhone(r.whatsapp_number);
      });

      // 3. Fetch hotels
      const { data: hotels } = await supabase.from('hotels').select('*');
      const filteredHotels = (hotels || []).filter(h => {
        if (isDirect) {
          return h.id === vId || matchesPhone(h.whatsapp_number) || matchesPhone(h.phone_number);
        }
        return h.vendor_id === vId || matchesPhone(h.whatsapp_number) || matchesPhone(h.phone_number);
      });

      // 4. Fetch tours
      const { data: tours } = await supabase.from('tours').select('*');
      const filteredTours = (tours || []).filter(t => {
        if (isDirect) {
          return t.id === vId || matchesPhone(t.contact_number) || matchesPhone(t.whatsapp_number);
        }
        return t.vendor_id === vId || matchesPhone(t.contact_number) || matchesPhone(t.whatsapp_number);
      });

      // Combine items with category tag
      const allItems = [
        ...filteredBikes.map(b => ({ ...b, category_type: 'bikes', label: 'Bike/Scooty' })),
        ...filteredRafting.map(r => ({ ...r, category_type: 'rafting', label: 'Rafting' })),
        ...filteredHotels.map(h => ({ ...h, category_type: 'hotels', label: 'Hotel' })),
        ...filteredTours.map(t => ({ ...t, category_type: 'tours', label: 'Tour' }))
      ];

      setVendorItems(allItems);

      // Collect item IDs and Item Names owned by this vendor
      const itemIds = new Set(allItems.map(i => i.id));
      const itemNames = new Set(allItems.map(i => (i.name || i.title || '').toLowerCase().trim()));

      // Fetch bookings strictly for this vendor's items
      const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      
      const filteredBookings = (bookings || []).filter(b => {
        // 1. Service ID matches any item owned by this vendor
        if (b.service_id && itemIds.has(b.service_id)) return true;

        // 2. Vendor ID matches main vendor account (if not direct listing session)
        if (!isDirect && b.vendor_id && (b.vendor_id === vId || (rawVendorId && b.vendor_id === rawVendorId))) return true;

        // 3. Item Name in metadata matches owned item names
        const metaName = (b.metadata?.item_name || b.item_name || '').toLowerCase().trim();
        if (metaName && itemNames.has(metaName)) return true;

        return false;
      });

      setVendorBookings(filteredBookings);

    } catch (err) {
      console.error('Error fetching vendor data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (currentVendor) {
      fetchVendorData();
      // Auto background sync every 20s between app & website
      const interval = setInterval(() => {
        fetchVendorData();
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [currentVendor]);

  // Master Vendor Status Toggle (Active / Inactive)
  const toggleMasterStatus = async () => {
    if (!currentVendor) return;
    const newStatus = currentVendor.status === 'Active' ? 'Inactive' : 'Active';
    const isOnline = newStatus === 'Active';
    const isClosed = !isOnline;

    try {
      if (!currentVendor.is_direct) {
        await supabase
          .from('vendors')
          .update({ status: newStatus, is_online: isOnline })
          .eq('id', currentVendor.id);
      }

      // Update all items owned by this vendor in DB tables so website turns them ON / OFF
      for (const item of vendorItems) {
        await supabase
          .from(item.category_type)
          .update({ is_available: isOnline, is_closed: isClosed })
          .eq('id', item.id);
      }

      const updated = { ...currentVendor, status: newStatus, is_online: isOnline };
      setCurrentVendor(updated);
      localStorage.setItem('tripgod_vendor_session', JSON.stringify(updated));

      // Update local vendorItems state so green/red badges on items reflect immediately
      setVendorItems(prev => prev.map(i => ({ ...i, is_available: isOnline, is_closed: isClosed })));

      setStatusMessage(`Shop status updated to ${newStatus} (${isOnline ? 'ONLINE' : 'OFFLINE'}). Website listings updated.`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert('Failed to update shop status: ' + err.message);
    }
  };

  // Toggle Item Availability (Online / Offline)
  const toggleItemAvailability = async (item) => {
    const currentAvailability = item.is_available !== false && !item.is_closed;
    const newAvailability = !currentAvailability;
    const isClosed = !newAvailability;

    try {
      const { error } = await supabase
        .from(item.category_type)
        .update({ is_available: newAvailability, is_closed: isClosed })
        .eq('id', item.id);

      if (error) throw error;

      setVendorItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newAvailability, is_closed: isClosed } : i));
      setStatusMessage(`${item.name || item.title} status updated to ${newAvailability ? 'Online' : 'Offline'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert('Failed to update item availability: ' + err.message);
    }
  };

  // Update Item Net Price and Customer Selling Price based on LOCKED Admin Commission
  const handleSavePrice = async (item) => {
    if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) {
      alert('Please enter a valid price amount.');
      return;
    }

    const netPriceNum = Number(newPrice);
    
    // Check Admin Payment Mode & Commission Settings
    const paymentMode = item.payment_mode || 'fixed_advance';
    const fixedAdvance = item.fixed_advance_amount !== undefined && item.fixed_advance_amount !== null && item.fixed_advance_amount !== ''
      ? Number(item.fixed_advance_amount)
      : null;
    const commPct = item.commission_percentage !== undefined && item.commission_percentage !== null && item.commission_percentage !== ''
      ? Number(item.commission_percentage)
      : null;

    // Calculate Admin Commission / Profit Amount
    const existingCommAmount = item.commission_amount !== undefined && item.commission_amount !== null && item.commission_amount !== ''
      ? Number(item.commission_amount)
      : null;

    let commAmount = 0;
    if (existingCommAmount !== null) {
      commAmount = existingCommAmount;
    } else if (fixedAdvance !== null && fixedAdvance > 0) {
      commAmount = fixedAdvance;
    } else if (commPct !== null && commPct > 0) {
      commAmount = Math.round((netPriceNum * commPct) / 100);
    } else {
      commAmount = 0;
    }

    const customerSellingPrice = netPriceNum + commAmount;

    try {
      const { error } = await supabase
        .from(item.category_type)
        .update({ 
          net_price: netPriceNum, 
          commission_amount: commAmount,
          price: customerSellingPrice 
        })
        .eq('id', item.id);

      if (error) throw error;

      setVendorItems(prev => prev.map(i => i.id === item.id ? { ...i, net_price: netPriceNum, commission_amount: commAmount, price: customerSellingPrice } : i));
      setEditingItemId(null);
      setNewPrice('');
      setStatusMessage(`Base price updated to ₹${netPriceNum}. Website Selling Price: ₹${customerSellingPrice} (Vendor: ₹${netPriceNum} + Profit: ₹${commAmount})`);
      setTimeout(() => setStatusMessage(''), 5000);
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

            {/* Install App Quick Action Banner */}
            <div className="mt-4 p-3.5 bg-gradient-to-r from-[#FF6B00]/15 to-[#FF4500]/15 border border-[#FF6B00]/30 rounded-2xl text-left space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📲</span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Get TripGod Vendor App</h4>
                    <p className="text-[10px] text-slate-300 font-medium">Native APK file or 1-tap web app install</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[#FF6B00]/20">
                <a
                  href="/TripGod_Vendor.apk"
                  download="TripGod_Vendor.apk"
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-[1.02] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md text-center no-underline flex items-center justify-center gap-1.5"
                >
                  <span>⬇️ Download APK (5.3 MB)</span>
                </a>
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="py-2 px-3 bg-gradient-to-r from-[#FF6B00] to-[#FF4500] hover:scale-[1.02] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md border-none cursor-pointer shrink-0"
                >
                  PWA Install
                </button>
              </div>

              {showInstallGuide && (
                <div className="mt-3 pt-3 border-t border-[#FF6B00]/20 text-[11px] text-slate-300 space-y-1.5">
                  <div className="font-bold text-orange-400">How to install TripGod Vendor App:</div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-white">1.</span>
                    <span>Click <strong>3 Dots (⋮)</strong> in Chrome at top right.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-white">2.</span>
                    <span>Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-white">3.</span>
                    <span>The official TripGod Vendor app icon will be added to your app drawer!</span>
                  </div>
                </div>
              )}
            </div>
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
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    OTP Sent via WhatsApp
                  </span>
                </div>
                <div>A 4-digit security login OTP has been dispatched to <strong>+91 {phoneInput}</strong> via TripGod WhatsApp API.</div>
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
        {/* Prominent Shop Status Banner */}
        <div className={`mb-6 p-5 rounded-3xl border transition-all ${
          currentVendor.status === 'Active'
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-red-950/40 border-red-500/30 text-red-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                currentVendor.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <Power className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    currentVendor.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                  }`} />
                  <h2 className="text-base font-black uppercase tracking-wide">
                    ● {currentVendor.status === 'Active' ? 'ONLINE' : 'OFFLINE'}
                  </h2>
                </div>
                <p className="text-xs mt-1 opacity-90 font-medium">
                  {currentVendor.status === 'Active'
                    ? 'Your services are currently available for customers on the TripGod website & app.'
                    : 'Your services are currently unavailable for customers.'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleMasterStatus}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0 ${
                currentVendor.status === 'Active'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
              }`}
            >
              Switch to {currentVendor.status === 'Active' ? 'OFFLINE' : 'ONLINE'}
            </button>
          </div>
        </div>

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
                  const isAvailable = item.is_available !== false && !item.is_closed;
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
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setNewPrice(prev => Math.max(0, (Number(prev) || Number(item.net_price || item.price) || 0) - 50).toString())}
                                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold border-none cursor-pointer shrink-0"
                                  title="Decrease by ₹50"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  placeholder={item.net_price || item.price}
                                  className="w-24 px-3 py-1.5 bg-slate-950 border border-orange-500/50 rounded-xl text-white text-sm font-bold focus:outline-none text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNewPrice(prev => ((Number(prev) || Number(item.net_price || item.price) || 0) + 50).toString())}
                                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold border-none cursor-pointer shrink-0"
                                  title="Increase by ₹50"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSavePrice(item)}
                                  className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors border-none cursor-pointer shrink-0"
                                  title="Save Base Price"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors border-none cursor-pointer shrink-0"
                                  title="Cancel"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-[10px] text-orange-400 font-medium">
                                Base Price: ₹{newPrice || item.net_price || item.price}
                              </span>
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
