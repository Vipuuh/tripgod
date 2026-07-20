import React from 'react';
import { RefreshCw, Calendar, AlertCircle, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-16 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-14 shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-slate-100 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#FF5F00]/10 border border-[#FF5F00]/25 rounded-2xl flex items-center justify-center text-[#FF5F00] mx-auto shadow-sm">
            <RefreshCw size={28} className="animate-spin-slow" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900 tracking-tight uppercase">
            Cancellation & Refund Policy
          </h1>
          <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full w-max mx-auto border border-slate-100">
            Last Updated: July 2026
          </p>
        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Introduction */}
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
          At <strong className="text-slate-900 font-black">TripGod</strong>, we understand that travel plans can change. Since we collect only a <strong className="text-[#FF5F00]">partial advance booking fee</strong> online to secure your activity slots, our cancellation and refund guidelines are designed to protect both our travelers and our certified local operators.
        </p>

        {/* Policies Grid */}
        <div className="grid grid-cols-1 gap-8 pt-2">
          
          {/* Section 1 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Calendar size={20} className="text-[#FF5F00]" />
              1. Cancellation Timelines & Refunds
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              <div className="p-4 bg-white rounded-xl border border-slate-200/60 shadow-3xs flex gap-3.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                <div>
                  <span className="block text-slate-900 font-black uppercase text-[10px] tracking-wider mb-1">
                    24 Hours or More Prior
                  </span>
                  If you cancel your booking 24 hours or more before your scheduled activity date/time slot, you are eligible for a <strong className="text-emerald-600">100% full refund</strong> of your advance booking fee.
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200/60 shadow-3xs flex gap-3.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0 mt-1.5" />
                <div>
                  <span className="block text-slate-900 font-black uppercase text-[10px] tracking-wider mb-1">
                    Within 24 Hours or No-Show
                  </span>
                  If you cancel within 24 hours of your scheduled activity slot, or in case you fail to arrive at the venue (no-show), the advance booking fee will be <strong className="text-rose-600">forfeited</strong> (non-refundable) to cover operator reservation expenses.
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <AlertCircle size={20} className="text-[#FF5F00]" />
              2. Operator Cancellations (Force Majeure)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              Adventure activities are heavily subject to weather conditions, river flow levels (for rafting), and local administration safety regulations. In case the local executing operator cancels the activity due to safety concerns, river levels, heavy rainfall, or local government laws, a <strong className="text-emerald-600">100% full refund</strong> of your advance booking fee will be processed immediately.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <ShieldCheck size={20} className="text-[#FF5F00]" />
              3. Refund Processing Details
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              To request a cancellation and refund, please message our support desk on WhatsApp or email us with your booking details. 
            </p>
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-900 flex items-start gap-3">
              <AlertCircle size={16} className="text-[#FF5F00] shrink-0 mt-0.5" />
              <span>
                Once approved, refunds are processed back to the original payment source (credit/debit cards, UPI, or net banking) within <strong className="text-slate-900 font-extrabold">5 to 7 working days</strong> according to bank clearing cycles.
              </span>
            </div>
          </div>

        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Contact/Support Strip for Audit Compliance */}
        <div className="p-6 bg-slate-950 text-white rounded-3xl space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-[#FF5F00] text-center font-display">
            Support & Grievances Desk
          </h4>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed font-medium">
            For any queries or immediate assistance regarding cancellations or refunds, please reach out to us:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-semibold text-slate-200">
            <div className="flex flex-col items-center p-3.5 bg-white/5 border border-white/5 rounded-xl text-center gap-1.5">
              <Phone size={14} className="text-[#FF5F00]" />
              <span>+91 8630027341</span>
            </div>
            
            <a href="mailto:hi@tripgod.in" className="flex flex-col items-center p-3.5 bg-white/5 border border-white/5 hover:border-[#FF5F00]/35 rounded-xl text-center gap-1.5 transition-all text-white">
              <Mail size={18} className="text-[#FF5F00]" />
              <span>hi@tripgod.in</span>
            </a>

            <div className="flex flex-col items-center p-3.5 bg-white/5 border border-white/5 rounded-xl text-center gap-1.5">
              <MapPin size={14} className="text-[#FF5F00]" />
              <span className="text-[10px] leading-tight">Rishikesh, Uttarakhand, India</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
