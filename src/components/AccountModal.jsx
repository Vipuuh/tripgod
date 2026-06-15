import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, MapPin, Calendar, ShoppingBag, LogOut, CheckCircle, Save } from 'lucide-react';

export default function AccountModal({ isOpen, onClose, userName, userEmail, onLogout }) {
  const [profile, setProfile] = useState({ name: userName, email: userEmail, phone: '', address: '' });
  const [bookings, setBookings] = useState([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && userEmail) {
      // Load Profile
      const storedProfile = localStorage.getItem(`tripgod_profile_${userEmail}`);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfile(parsed);
        setAddressInput(parsed.address || '');
      } else {
        setProfile({ name: userName, email: userEmail, phone: '', address: '' });
        setAddressInput('');
      }

      // Load Bookings
      const storedBookings = localStorage.getItem(`tripgod_bookings_${userEmail}`);
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      } else {
        setBookings([]);
      }
    }
  }, [isOpen, userEmail, userName]);

  const handleSaveAddress = () => {
    const updatedProfile = { ...profile, address: addressInput };
    setProfile(updatedProfile);
    localStorage.setItem(`tripgod_profile_${userEmail}`, JSON.stringify(updatedProfile));
    
    // Also update global names if needed
    localStorage.setItem('tripgod_user_name', updatedProfile.name);
    
    setIsEditingAddress(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
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
            className="relative w-full max-w-lg overflow-hidden bg-white/90 border border-white/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-10 flex flex-col max-h-[85vh] backdrop-blur-2xl text-black font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/5 bg-white/45 text-black backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FF5F00]/10 rounded-lg text-[#FF5F00]">
                  <User size={18} />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wider font-display">My Account Details</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-black/5 rounded-full transition-colors cursor-pointer border-none text-black/60 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* Profile Card */}
              <div className="p-4 border border-black/10 rounded-2xl bg-white/50 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] flex items-center justify-center font-bold text-white text-base shadow-sm">
                    {profile.name ? profile.name.substring(0, 2).toUpperCase() : 'TG'}
                  </div>
                  <div>
                    <h4 className="font-bold text-base leading-tight">{profile.name}</h4>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">TripGod Guest</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-black/5 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[#FF5F00] shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[#FF5F00] shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Address Section */}
                <div className="pt-3 border-t border-black/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" /> Delivery / Billing Address
                    </span>
                    {!isEditingAddress ? (
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="text-[10px] font-bold text-[#FF5F00] hover:underline cursor-pointer border-none bg-transparent"
                      >
                        {profile.address ? 'Edit Address' : '+ Add Address'}
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveAddress}
                        className="text-[10px] font-bold text-green-600 hover:underline cursor-pointer border-none bg-transparent flex items-center gap-0.5"
                      >
                        <Save size={10} /> Save
                      </button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter your address (e.g. Tapovan, Rishikesh)"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white/70 border border-black/15 text-xs rounded-xl focus:border-[#FF5F00] focus:ring-1 focus:ring-[#FF5F00]/10 outline-none text-black"
                      />
                      <button
                        onClick={() => setIsEditingAddress(false)}
                        className="px-2.5 py-1.5 border border-black/10 hover:bg-black/5 text-xs font-bold rounded-xl cursor-pointer bg-white text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 italic bg-black/5 p-2.5 rounded-xl">
                      {profile.address || 'No address added yet. Click edit to save your location details.'}
                    </p>
                  )}
                  {saveSuccess && (
                    <span className="text-[10px] text-green-600 font-bold block">✓ Address updated successfully!</span>
                  )}
                </div>
              </div>

              {/* Bookings History */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wider text-black flex items-center gap-1.5">
                  <ShoppingBag size={16} className="text-[#FF5F00]" /> My Bookings History
                </h4>

                {bookings.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-black/15 rounded-2xl bg-white/40 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">No active bookings found under your email.</p>
                    <p className="text-[10px] text-gray-400">All bookings cleared online with a 10% advance will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {bookings.map((booking, idx) => (
                      <div key={idx} className="border border-black/10 rounded-2xl bg-white/50 overflow-hidden shadow-xs">
                        {/* Booking Header */}
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between p-3.5 bg-black/5 border-b border-black/5 gap-2 text-xs font-semibold">
                          <div className="space-y-0.5">
                            <span className="block text-[9px] uppercase font-bold text-gray-500">Booking ID</span>
                            <span className="font-mono text-black text-[10px] break-all">{booking.id}</span>
                          </div>
                          <div className="text-left xs:text-right shrink-0">
                            <span className="block text-[9px] uppercase font-bold text-gray-500">Date</span>
                            <span className="text-black text-[10px] font-bold">{booking.date}</span>
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="p-3.5 space-y-3">
                          {booking.activities.map((act, actIdx) => (
                            <div key={actIdx} className="flex items-start justify-between gap-3 text-xs">
                              <div>
                                <h5 className="font-bold text-black">{act.name}</h5>
                                {act.stretch && <p className="text-[10px] text-gray-500">{act.stretch}</p>}
                                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
                                  <Calendar size={10} /> {act.date} | {act.slot} | {act.guests} Guest(s)
                                </p>
                              </div>
                              <span className="font-bold text-black shrink-0">₹{act.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                          ))}

                          {/* Pricing details */}
                          <div className="pt-2.5 border-t border-black/5 flex flex-wrap gap-x-4 gap-y-1 justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                            <div>Total: <span className="text-xs font-black text-black">₹{booking.totalPrice.toLocaleString('en-IN')}</span></div>
                            <div className="text-green-600 flex items-center gap-0.5">
                              <CheckCircle size={11} className="fill-green-600 text-white" />
                              10% Paid Advance: ₹{booking.advancePaid.toLocaleString('en-IN')}
                            </div>
                            <div className="text-orange-600">Pay at venue (90%): ₹{booking.remainingPaid.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Logout Footer */}
            <div className="p-5 bg-white/40 border-t border-black/5 flex justify-between items-center backdrop-blur-md">
              <span className="text-[10px] text-gray-500 font-bold uppercase">TripGod Rishikesh</span>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <LogOut size={14} /> Logout Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
