import React from 'react';
import { Shield, Lock, Eye, FileText, Mail, Phone, MapPin } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-16 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-14 shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-slate-100 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#FF5F00]/10 border border-[#FF5F00]/25 rounded-2xl flex items-center justify-center text-[#FF5F00] mx-auto shadow-sm">
            <Shield size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900 tracking-tight uppercase">
            Privacy Policy
          </h1>
          <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full w-max mx-auto border border-slate-100">
            Last Updated: July 2026
          </p>
        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Introduction */}
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
          At <strong className="text-slate-900 font-black">TripGod</strong> (accessible from Tripgod.in), one of our main priorities is the privacy of our visitors. This Privacy Policy document details the types of information collected and recorded by TripGod and how we protect and use it.
        </p>

        {/* Sections */}
        <div className="space-y-8 pt-2">
          
          {/* Section 1 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Lock size={20} className="text-[#FF5F00]" />
              1. Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              When you book an adventure or register on our site, we collect personal information necessary to execute the booking. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650 font-bold">
              <li>Name and Email Address</li>
              <li>Contact Number (WhatsApp) for ticket delivery</li>
              <li>Booking Details (date, slot, activity, count of guests)</li>
              <li>Payment details (processed securely via our partner gateway Razorpay)</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Eye size={20} className="text-[#FF5F00]" />
              2. How We Use Your Information
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              We use the collected information to ensure a seamless and safe adventure yatra:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650 font-bold">
              <li>To book slots and coordinate with our certified local operators.</li>
              <li>To send booking tickets, confirmation details, and coordinates via WhatsApp/Email.</li>
              <li>To process transactions and coordinate refunds if applicable.</li>
              <li>To improve our customer service and communication.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <FileText size={20} className="text-[#FF5F00]" />
              3. Data Protection & Sharing
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              <strong>TripGod</strong> operates on a tie-up/marketplace model. We share only your necessary booking information (Name and Contact Number) with the specific local adventure operator executing your selected activity. We do not sell, rent, or trade your personal data with third-party advertisers.
            </p>
            <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-bold p-3 bg-white rounded-xl border border-slate-200/60 shadow-3xs">
              🔒 All online payments are securely processed through Razorpay. We do not store credit/debit card numbers or net banking credentials on our servers.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight">
              4. Consent
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              By using our website, you hereby consent to our Privacy Policy and agree to its terms.
            </p>
          </div>

        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Contact Strip */}
        <div className="p-6 bg-slate-950 text-white rounded-3xl space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-[#FF5F00] text-center font-display">
            Privacy & Security Queries
          </h4>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed font-medium">
            For any queries or formal requests regarding your data, reach us instantly at:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-semibold text-slate-200">
            <div className="flex flex-col items-center p-3.5 bg-white/5 border border-white/5 rounded-xl text-center gap-1.5">
              <Phone size={14} className="text-[#FF5F00]" />
              <span>+91 8630027341</span>
            </div>
            
            <a href="mailto:hello@tripgod.in" className="flex flex-col items-center p-3.5 bg-white/5 border border-white/5 hover:border-[#FF5F00]/35 rounded-xl text-center gap-1.5 transition-all text-white">
              <Mail size={14} className="text-[#FF5F00]" />
              <span>hello@tripgod.in</span>
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
