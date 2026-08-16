import React from 'react';
import { Shield, Lock, Eye, FileText, Mail, Phone, MapPin, Users, Building2 } from 'lucide-react';

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
            Last Updated: August 2026
          </p>
        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Introduction */}
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
          At <strong className="text-slate-900 font-black">TripGod</strong> (accessible from Tripgod.in), we respect your privacy and are committed to protecting your personal data. TripGod functions as a <strong className="text-slate-900 font-black">local travel booking and connect platform</strong> that facilitates reservations by connecting travelers directly with independent local vendors, including hotels, rafting & adventure operators, camping sites, scooty/bike rental providers, and local transport partners.
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
              When you make a booking or submit an inquiry on TripGod, we collect information necessary to facilitate your reservation and share trip details:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650 font-bold">
              <li>Full Name and Email Address</li>
              <li>Contact Number (WhatsApp) for instant ticket delivery & vendor coordination</li>
              <li>Booking Details (date, time slot, activity/stay choice, guest/vehicle count)</li>
              <li>Payment Transaction Details (processed securely through Razorpay)</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Eye size={20} className="text-[#FF5F00]" />
              2. How We Use Your Information
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              We use your information solely to deliver a smooth and transparent local travel experience:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650 font-bold">
              <li>To confirm your reservation and connect you with the specific local service provider.</li>
              <li>To send you the vendor's name, address, direct WhatsApp/phone contact, and meeting instructions.</li>
              <li>To process advance booking fees and handle cancellations or eligible refunds.</li>
              <li>To provide customer support and coordinate communication between you and the vendor.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Building2 size={20} className="text-[#FF5F00]" />
              3. Data Sharing with Independent Local Vendors
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              Because TripGod is a connect platform, we share relevant booking details (Name, Contact Number, and Booking Date/Slot) strictly with the independent local vendor (hotel, adventure operator, rental owner, or camp host) who will fulfill your service. 
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              TripGod does not sell, rent, or trade your personal information with third-party advertisers. 
            </p>
            <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-bold p-3 bg-white rounded-xl border border-slate-200/60 shadow-3xs">
              🔒 All online transactions are processed via bank-grade secure payment gateways (Razorpay). TripGod does not store credit/debit card numbers, CVVs, or net banking passwords on its servers.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <FileText size={20} className="text-[#FF5F00]" />
              4. User Consent
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              By using our website, booking services, or submitting inquiries, you hereby consent to our Privacy Policy and agree to the sharing of booking details with local service providers as outlined.
            </p>
          </div>

          {/* Section 5 — Liability & Platform Disclaimer */}
          <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Shield size={20} className="text-rose-500" />
              5. Local Connect Model & Liability Disclaimer
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
              TripGod acts <strong className="text-slate-900 font-black">strictly as an online facilitator and connecting platform</strong>. TripGod does not directly operate hotels, adventure activities (rafting, bungee, zipline, paragliding), camping grounds, scooty/bike rental fleets, or transport vehicles.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-650 font-bold">
              <li>The actual service is rendered directly by independent local vendors and service providers.</li>
              <li>To the extent permitted by applicable law, the independent local service provider is solely responsible for service operation, physical safety protocols, equipment condition, vehicle upkeep, hotel/camp premises, staff behavior, and compliance with local laws.</li>
              <li>TripGod shall not be held liable for any accident, physical injury, loss of property, theft, operational delay, vendor misconduct, or service deficiency occurring at the vendor venue.</li>
              <li>Customers directly interact with and receive service at the vendor's location using the details provided upon booking completion.</li>
            </ul>
            <p className="text-[11px] text-rose-700 font-extrabold bg-rose-100/80 border border-rose-200 px-4 py-2.5 rounded-xl">
              ⚠️ Completing a booking on TripGod signifies full acknowledgment and acceptance of this Privacy Policy and Platform Role Disclaimer.
            </p>
          </div>

        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Contact Strip */}
        <div className="p-6 bg-slate-950 text-white rounded-3xl space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-[#FF5F00] text-center font-display">
            Privacy & Data Queries
          </h4>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed font-medium">
            For any queries or formal requests regarding your data, reach us instantly at:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-semibold text-slate-200">
            <div className="flex flex-col items-center p-3.5 bg-white/5 border border-white/5 rounded-xl text-center gap-1.5">
              <Phone size={14} className="text-[#FF5F00]" />
              <span>+91 9410572857</span>
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

