import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VendorPortal from './components/VendorPortal';

class VendorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("VendorApp ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-4 text-2xl font-black">
            !
          </div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">Vendor App Notice</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">An unexpected issue occurred while rendering the Vendor Dashboard.</p>
          <pre className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-red-400 font-mono overflow-auto max-w-full">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#FF4500] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 transition-all border-none cursor-pointer"
          >
            Refresh Vendor App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function VendorApp() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Fast professional splash screen transition (1.2 seconds)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <VendorErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#FF6B00] selection:text-white">
        <AnimatePresence mode="wait">
          {showSplash ? (
            <motion.div
              key="splash"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden select-none"
            >
              {/* Subtle background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'out' }}
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Logo Stack */}
                <div className="flex items-center justify-center select-none mb-3">
                  <span className="font-black text-4xl sm:text-5xl tracking-tighter text-white">TRIP</span>
                  <span className="font-black text-4xl sm:text-5xl tracking-tighter text-white bg-gradient-to-r from-[#FF6B00] to-[#FF4500] px-3 py-1 rounded-2xl ml-2 shadow-[0_4px_25px_rgba(255,107,0,0.5)]">GOD</span>
                </div>

                {/* Sub-badge */}
                <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF8C38] text-xs font-black uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
                  Vendor Partner App
                </div>

                <p className="mt-6 text-xs text-slate-400 font-medium tracking-wide">
                  Partner Operations & Inventory Management
                </p>

                {/* Loading spinner line */}
                <div className="mt-8 w-40 h-1 bg-slate-800 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-full h-full bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent"
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="portal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full min-h-screen"
            >
              <VendorPortal isStandaloneApp={true} onNavigateHome={() => window.location.reload()} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </VendorErrorBoundary>
  );
}
