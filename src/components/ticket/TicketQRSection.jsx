import React from 'react';
import { Calendar, Clock, QrCode } from 'lucide-react';

export default function TicketQRSection({ 
  bookingId, 
  primaryDate, 
  primaryTime, 
  instructions = "Show QR code or Booking ID at venue desk" 
}) {
  const qrTargetUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/ticket/${bookingId}`
    : `https://tripgod.in/ticket/${bookingId}`;

  // Generate Google Chart API QR image for crisp, standard QR scanning
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrTargetUrl)}`;

  return (
    <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 p-1 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
          <img 
            src={qrImageUrl} 
            alt={`QR Code for ${bookingId}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to Lucide QrCode icon if offline or network failure
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <QrCode className="w-8 h-8 text-[#FF5F00] hidden" />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Fast Venue Check-in</h4>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5 max-w-[220px]">{instructions}</p>
        </div>
      </div>
      
      <div className="text-right flex flex-col items-end shrink-0">
        {primaryDate && (
          <>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
            <span className="text-xs font-black text-[#FF5F00] mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {primaryDate}
            </span>
          </>
        )}
        {primaryTime && (
          <span className="text-[11px] font-bold text-slate-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> {primaryTime}
          </span>
        )}
      </div>
    </div>
  );
}
