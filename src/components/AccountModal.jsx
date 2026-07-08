import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, MapPin, Calendar, ShoppingBag, LogOut, CheckCircle, Save, Copy, Check } from 'lucide-react';

export default function AccountModal({ isOpen, onClose, userName, userEmail, onLogout }) {
  const [profile, setProfile] = useState({ name: userName, email: userEmail, phone: '', address: '' });
  const [bookings, setBookings] = useState([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (isOpen && userEmail) {
      // Load Profile
      const storedProfile = localStorage.getItem(`tripgod_profile_${userEmail}`);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfile(parsed);
        setAddressInput(parsed.address || '');
      } else {
        // Fallback search by phone only
        let phoneOnlyProfile = null;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('tripgod_profile_')) {
              const p = JSON.parse(localStorage.getItem(key));
              if (p && p.email === userEmail) {
                phoneOnlyProfile = p;
                break;
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
        if (phoneOnlyProfile) {
          setProfile(phoneOnlyProfile);
          setAddressInput(phoneOnlyProfile.address || '');
        } else {
          setProfile({ name: userName, email: userEmail, phone: '', address: '' });
          setAddressInput('');
        }
      }

      // Load Bookings
      const storedBookings = localStorage.getItem(`tripgod_bookings_${userEmail}`);
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      } else {
        // Fallback for bookings by phone if email is empty
        const storedProfile = localStorage.getItem(`tripgod_profile_${userEmail}`);
        let bookingsByPhone = [];
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (parsed.phone) {
            const phoneBookings = localStorage.getItem(`tripgod_bookings_${parsed.phone}`);
            if (phoneBookings) bookingsByPhone = JSON.parse(phoneBookings);
          }
        }
        setBookings(bookingsByPhone);
      }
    }
  }, [isOpen, userEmail, userName]);

  const handleSaveAddress = () => {
    const updatedProfile = { ...profile, address: addressInput };
    setProfile(updatedProfile);
    localStorage.setItem(`tripgod_profile_${userEmail}`, JSON.stringify(updatedProfile));
    
    // Also update global name if edited
    localStorage.setItem('tripgod_user_name', updatedProfile.name);
    
    setIsEditingAddress(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getSimpleBookingId = (id) => {
    if (!id) return '';
    if (id.startsWith('pay_')) {
      return id.substring(id.length - 8).toUpperCase();
    }
    return id.substring(0, 8).toUpperCase();
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden bg-white/95 border border-gray-200/60 rounded-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] font-sans text-black"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white text-black">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FF5F00]/10 rounded-xl text-[#FF5F00] shadow-2xs">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider font-display">My Account</h3>
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest -mt-0.5">Profile & Bookings</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer border-none text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* Profile Card */}
              <div className="p-5 border border-gray-200/70 rounded-2xl bg-slate-50/50 space-y-4 shadow-2xs text-left">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF5F00] to-[#FF3E00] flex items-center justify-center font-black text-white text-lg shadow-md shadow-[#FF5F00]/10 ring-4 ring-[#FF5F00]/10">
                    {profile.name ? profile.name.substring(0, 2).toUpperCase() : 'TG'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-black font-display tracking-tight leading-none mb-1.5">{profile.name}</h4>
                    <span className="px-2.5 py-0.5 text-[8px] uppercase font-black text-[#FF5F00] bg-[#FF5F00]/10 border border-[#FF5F00]/20 rounded-full tracking-wider">
                      TripGod Guest
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-gray-200/60 text-xs font-semibold text-gray-700">
                  {profile.email && (
                    <div className="flex items-center gap-2.5 bg-white px-3.5 py-2.5 border border-gray-100 rounded-xl shadow-3xs">
                      <Mail size={14} className="text-[#FF5F00] shrink-0" />
                      <span className="truncate text-[11px] text-neutral-800 font-medium">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2.5 bg-white px-3.5 py-2.5 border border-gray-100 rounded-xl shadow-3xs">
                      <Phone size={14} className="text-[#FF5F00] shrink-0" />
                      <span className="text-[11px] text-neutral-800 font-mono">+{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Address Section */}
                <div className="pt-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                      <MapPin size={11} className="text-gray-400" /> Billing / Delivery Address
                    </span>
                    {!isEditingAddress ? (
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="text-[9px] font-black text-[#FF5F00] hover:underline cursor-pointer border-none bg-transparent uppercase tracking-wider"
                      >
                        {profile.address ? 'Edit' : '+ Add Address'}
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveAddress}
                        className="text-[9px] font-black text-green-600 hover:underline cursor-pointer border-none bg-transparent flex items-center gap-0.5 uppercase tracking-wider"
                      >
                        <Save size={10} /> Save
                      </button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Tapovan, Rishikesh"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 text-xs rounded-xl focus:border-[#FF5F00] focus:ring-4 focus:ring-[#FF5F00]/10 outline-none text-black font-semibold placeholder-gray-400 font-sans"
                      />
                      <button
                        onClick={() => setIsEditingAddress(false)}
                        className="px-3 py-2 border border-gray-200 hover:bg-gray-100 text-xs font-bold rounded-xl cursor-pointer bg-white text-gray-500 font-sans"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className={`text-xs p-3 rounded-xl border border-gray-100 ${profile.address ? 'text-neutral-800 font-semibold bg-white shadow-3xs' : 'text-gray-400 italic bg-gray-50'}`}>
                      {profile.address || 'No address added yet. Click edit to save your location.'}
                    </p>
                  )}
                  {saveSuccess && (
                    <span className="text-[9px] text-green-600 font-black block">✓ Address updated successfully!</span>
                  )}
                </div>
              </div>

              {/* Bookings History */}
              <div className="space-y-4 text-left">
                <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-2">
                  <ShoppingBag size={14} className="text-[#FF5F00]" /> My Bookings History
                </h4>

                {bookings.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl bg-slate-50/30 space-y-2">
                    <p className="text-xs text-gray-500 font-bold">No bookings found under your profile.</p>
                    <p className="text-[9px] text-gray-400 font-semibold leading-relaxed">Bookings cleared online with a 10% advance will automatically appear in this history log.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking, idx) => (
                      <div key={idx} className="border border-gray-200/80 rounded-2xl bg-white shadow-3xs overflow-hidden hover:border-[#FF5F00]/30 transition-all duration-300">
                        {/* Booking Header */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-gray-100 gap-2 text-xs">
                          <div className="space-y-0.5">
                            <span className="block text-[8px] uppercase font-black text-gray-400 tracking-wider">Booking ID</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-neutral-800 font-mono text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded shadow-3xs" title={booking.id}>
                                {getSimpleBookingId(booking.id)}
                              </span>
                              <button
                                onClick={() => handleCopyId(booking.id)}
                                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-black border-none bg-transparent cursor-pointer transition-all"
                                title="Copy full ID"
                              >
                                {copiedId === booking.id ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-[8px] uppercase font-black text-gray-400 tracking-wider">Booked On</span>
                            <span className="text-neutral-800 text-[10px] font-extrabold">{booking.date}</span>
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="p-4 space-y-3.5">
                          {booking.activities.map((act, actIdx) => (
                            <div key={actIdx} className="flex items-start justify-between gap-3 text-xs border-b border-gray-100/50 pb-3 last:border-b-0 last:pb-0">
                              <div className="space-y-1">
                                <h5 className="font-extrabold text-neutral-900 leading-tight">{act.name}</h5>
                                {act.stretch && (
                                  <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[8px] font-bold rounded">
                                    {act.stretch}
                                  </span>
                                )}
                                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                  <Calendar size={10} className="text-[#FF5F00]" /> 
                                  <span className="text-neutral-700">{act.date}</span> 
                                  <span className="text-gray-300">|</span> 
                                  <span className="text-neutral-700">{act.slot}</span>
                                  <span className="text-gray-300">|</span> 
                                  <span className="text-[#FF5F00]">{act.guests} Guest(s)</span>
                                </p>
                              </div>
                              <span className="font-black text-neutral-800 font-sans text-xs">₹{act.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                          ))}

                          {/* Pricing summary */}
                          <div className="pt-3 border-t border-gray-100 flex flex-col gap-1.5 text-[9px] font-black uppercase text-gray-500">
                            <div className="flex justify-between items-center text-neutral-800">
                              <span>Total Price</span>
                              <span className="text-xs font-black text-black">₹{booking.totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-600 bg-green-50/50 border border-green-100/50 px-2.5 py-1 rounded-lg">
                              <span>10% Paid Advance</span>
                              <span className="font-black">₹{booking.advancePaid.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#FF5F00] bg-orange-50/50 border border-orange-100/50 px-2.5 py-1 rounded-lg">
                              <span>Pay at Venue (90%)</span>
                              <span className="font-black">₹{booking.remainingPaid.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Logout Footer */}
            <div className="p-5 bg-slate-50/80 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">TripGod Rishikesh</span>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs hover:shadow-2xs transition-all duration-200"
              >
                <LogOut size={13} /> Logout Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
