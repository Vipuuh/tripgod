import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Sparkles, Wrench, ShieldCheck, KeyRound, MessageSquare, Phone, 
  LogIn, X, CheckCircle2, AlertCircle, ArrowRight, Eye
} from 'lucide-react';
import { supabase } from '../supabase';

export default function MaintenanceMode({ config, onAdminBypassSuccess }) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [loginTab, setLoginTab] = useState('passcode'); // 'passcode' | 'account'
  
  // Passcode state
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Admin Account state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [loading, setLoading] = useState(false);

  const headline = config?.headline || "We're Upgrading TripGod! 🚀";
  const message = config?.message || "We are currently making exciting upgrades & adding new adventure packages. We'll be back online shortly!";
  const estimatedTime = config?.estimated_time || "Estimated completion: Back online shortly";
  const supportPhone = config?.support_phone || "+91 98765 43210";
  const supportWhatsapp = config?.support_whatsapp || "+919876543210";
  const storedPasscode = config?.passcode || "tripgod2026";

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    setPasscodeError('');

    if (!passcode.trim()) {
      setPasscodeError('Please enter the bypass passcode.');
      return;
    }

    if (passcode.trim() === storedPasscode.trim()) {
      localStorage.setItem('tripgod_admin_bypass', 'true');
      setShowAdminModal(false);
      if (onAdminBypassSuccess) onAdminBypassSuccess();
    } else {
      setPasscodeError('Invalid passcode. Please check with the store owner.');
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) throw error;

      if (data?.session) {
        localStorage.setItem('tripgod_admin_bypass', 'true');
        setShowAdminModal(false);
        if (onAdminBypassSuccess) onAdminBypassSuccess();
      }
    } catch (err) {
      setAccountError(err.message || 'Login failed. Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Dynamic Background Glow & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Brand Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-white">
              Trip<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">God</span>
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">Adventures & Bookings</span>
          </div>
        </div>

        {/* Secret Admin Preview Trigger */}
        <button
          onClick={() => setShowAdminModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white transition-all shadow-sm group cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5 text-orange-400 group-hover:rotate-12 transition-transform" />
          <span>Admin Login</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
        
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-inner"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <Wrench className="w-3.5 h-3.5" />
          <span>Store Maintenance Underway</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-display font-black tracking-tight text-white mb-6 leading-tight"
        >
          {headline}
        </motion.h1>

        {/* Subtext message */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl leading-relaxed mb-8"
        >
          {message}
        </motion.p>

        {/* Estimated Back Online Card */}
        {estimatedTime && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-slate-900/90 border border-slate-700/80 rounded-full px-6 py-3.5 mb-10 inline-flex items-center gap-3 shadow-2xl backdrop-blur-md"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm md:text-base font-bold text-white tracking-wide">{estimatedTime}</span>
          </motion.div>
        )}

        {/* Urgent Support / Contact Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 w-full max-w-md"
        >
          {supportWhatsapp && (
            <a
              href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}?text=Hi%20TripGod%20Team,%20I%20have%20an%20urgent%20booking%20query`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>
          )}

          {supportPhone && (
            <a
              href={`tel:${supportPhone}`}
              className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <Phone className="w-4 h-4 text-orange-400" />
              <span>Call Team</span>
            </a>
          )}
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-slate-400 border-t border-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} TripGod Adventures. All rights reserved.</p>
        <button
          onClick={() => setShowAdminModal(true)}
          className="text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1.5 underline decoration-slate-800 underline-offset-4 cursor-pointer"
        >
          <Lock className="w-3 h-3" />
          <span>Store Owner Login & Live Preview</span>
        </button>
      </footer>

      {/* Admin Login / Passcode Bypass Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAdminModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Admin Live Preview Login</h3>
                  <p className="text-xs text-slate-400">Enter credentials or passcode to bypass lock screen</p>
                </div>
              </div>

              {/* Login Tabs */}
              <div className="flex rounded-2xl bg-slate-950 p-1 mb-6 border border-slate-800/80">
                <button
                  onClick={() => { setLoginTab('passcode'); setPasscodeError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    loginTab === 'passcode' 
                      ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Secret Passcode
                </button>
                <button
                  onClick={() => { setLoginTab('account'); setAccountError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    loginTab === 'account' 
                      ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin Account
                </button>
              </div>

              {/* Passcode Tab */}
              {loginTab === 'passcode' && (
                <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Store Bypass Passcode
                    </label>
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter secret passcode..."
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    />
                  </div>

                  {passcodeError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passcodeError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Unlock Live Website Preview</span>
                  </button>
                </form>
              )}

              {/* Admin Account Tab */}
              {loginTab === 'account' && (
                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@tripgod.com"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    />
                  </div>

                  {accountError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{accountError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Authenticating...</span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Login as Admin & Preview</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className="mt-4 text-[11px] text-slate-500 text-center">
                Default bypass passcode: <code className="text-orange-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded">tripgod2026</code> (Can be changed in Admin Dashboard)
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
