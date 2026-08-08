import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cookie, X } from 'lucide-react';

export default function CookieConsent({ onNavigatePrivacy }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tripgod_cookie_consent');
    if (!consent) {
      // Show banner after a slight 1.5s delay so user sees initial page load cleanly
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('tripgod_cookie_consent', 'granted');
    setIsVisible(false);
    // Fire Meta / Google tracking consent if configured
    if (window.fbq) {
      window.fbq('consent', 'grant');
    }
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('tripgod_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 font-sans"
        >
          <div className="bg-[#0B0C10]/95 backdrop-blur-xl border border-white/15 text-white p-5 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.6)] space-y-4 relative overflow-hidden">
            {/* Ambient orange glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#FF6B00]/20 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <h4 className="text-sm font-black font-display tracking-tight text-white uppercase">
                We Value Your Privacy
              </h4>
            </div>

            {/* Body */}
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              We use essential cookies to keep TripGod secure & enable instant bookings. With your permission, we also use analytics & marketing cookies (Meta Pixel & Google) to personalize your experience. Read our{' '}
              <button
                type="button"
                onClick={() => {
                  if (onNavigatePrivacy) onNavigatePrivacy();
                }}
                className="text-[#FF6B00] hover:underline font-bold bg-transparent border-none p-0 inline cursor-pointer"
              >
                Privacy Policy
              </button>.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="flex-1 py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-gray-300 font-bold text-xs transition-all cursor-pointer text-center"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-[1.02] text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(255,95,0,0.35)] transition-all cursor-pointer text-center border-none"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
