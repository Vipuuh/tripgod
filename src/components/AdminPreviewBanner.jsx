import React from 'react';
import { Lock, Eye, Settings, Power, X } from 'lucide-react';

export default function AdminPreviewBanner({ setRoute, onTurnOffMaintenance, onExitPreview }) {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-xl border-b border-orange-500/40">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 font-bold tracking-wide">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <Lock className="w-3.5 h-3.5" />
          <span>MAINTENANCE MODE IS ACTIVE</span>
          <span className="hidden sm:inline-block bg-black/20 px-2 py-0.5 rounded-full text-[10px] font-normal text-orange-100">
            Customers see Coming Soon screen • You are in Admin Live Preview
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {setRoute && (
            <button
              onClick={() => setRoute('admin')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/30 hover:bg-black/40 text-white font-semibold transition-colors cursor-pointer border border-white/10"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>
          )}

          {onTurnOffMaintenance && (
            <button
              onClick={onTurnOffMaintenance}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Turn Off Maintenance</span>
            </button>
          )}

          {onExitPreview && (
            <button
              onClick={onExitPreview}
              title="Lock store & exit preview"
              className="p-1 rounded-lg hover:bg-black/20 text-orange-100 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
