import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headset, PhoneCall, X, MessageCircle } from 'lucide-react';

export default function SupportFloatingWidget({ phone = '919410572857' }) {
  const [isOpen, setIsOpen] = useState(false);

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hi TripGod Team, I want to inquire about trip packages & bookings.')}`;
  const callUrl = `tel:+${cleanPhone}`;

  return (
    <div className="fixed bottom-20 right-5 sm:bottom-6 sm:right-6 z-40 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-3 flex flex-col items-end gap-2.5"
          >
            {/* Call Support Button */}
            <a
              href={callUrl}
              className="flex items-center gap-3 bg-neutral-900/95 hover:bg-black backdrop-blur-xl border border-white/15 text-white px-4 py-2.5 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.4)] transition-all group no-underline"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <PhoneCall size={16} />
              </div>
              <div className="flex flex-col text-left pr-1">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Instant Call</span>
                <span className="text-xs font-bold text-white">Call Support</span>
              </div>
            </a>

            {/* WhatsApp Support Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-neutral-900/95 hover:bg-black backdrop-blur-xl border border-white/15 text-white px-4 py-2.5 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.4)] transition-all group no-underline"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle size={18} />
              </div>
              <div className="flex flex-col text-left pr-1">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Instant Chat</span>
                <span className="text-xs font-bold text-white">WhatsApp Us</span>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(255,95,0,0.4)] transition-all duration-300 relative border-none cursor-pointer ${
          isOpen
            ? 'bg-neutral-800 text-white rotate-90'
            : 'bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white hover:scale-110'
        }`}
        aria-label="Toggle Customer Support Menu"
      >
        {/* Pulsing ring when closed */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#FF5F00]/40 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
            <span className="absolute -inset-1 rounded-full bg-[#FF5F00]/20 animate-pulse pointer-events-none" style={{ animationDuration: '2s' }} />
          </>
        )}

        {isOpen ? (
          <X size={24} />
        ) : (
          <Headset size={26} className="relative z-10 animate-bounce-subtle" />
        )}
      </button>
    </div>
  );
}
