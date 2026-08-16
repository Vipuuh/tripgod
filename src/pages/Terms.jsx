import React from 'react';
import { Scale, ShieldAlert, Heart, Info, Mail, Phone, MapPin, UserCheck, ShieldCheck } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-16 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-14 shadow-[0_10px_50px_rgba(0,0,0,0.03)] border border-slate-100 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#FF5F00]/10 border border-[#FF5F00]/25 rounded-2xl flex items-center justify-center text-[#FF5F00] mx-auto shadow-sm">
            <Scale size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900 tracking-tight uppercase">
            Terms & Conditions
          </h1>
          <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full w-max mx-auto border border-slate-100">
            Last Updated: August 2026
          </p>
        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Disclaimer Banner */}
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5 text-left shadow-3xs">
          <h4 className="font-extrabold text-sm text-[#FF5F00] uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert size={18} /> Platform Role & Liability Notice
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
            <strong>TripGod</strong> (Tripgod.in) operates strictly as a <strong>local travel booking and connect platform</strong>. We facilitate reservations by connecting customers with independent local service providers (hotels, adventure operators, camping sites, scooty/bike rental vendors, and local transport partners). TripGod does not directly own, manage, or operate physical hotels, rafting boats, bungee platforms, ziplines, rental vehicles, or camping grounds.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 pt-2">
          
          {/* Section 1 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Info size={20} className="text-[#FF5F00]" />
              1. Local Booking & Post-Booking Flow
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              When a customer completes a booking on TripGod:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650 font-bold">
              <li>TripGod collects an advance booking fee online (processed securely via Razorpay) to confirm the reservation.</li>
              <li>Post-booking, TripGod provides the customer with complete vendor details, including vendor name, exact venue address, direct phone/WhatsApp contact, and meeting/reporting instructions.</li>
              <li>The customer directly visits the respective vendor's location to avail the booked service or collect the rental vehicle/room.</li>
              <li>Any remaining balance payable for the service must be settled directly with the local vendor at the venue, as per the agreed booking terms.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <ShieldAlert size={20} className="text-[#FF5F00]" />
              2. Independent Vendor Responsibility & Liability Limitation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              Because all physical services are operated directly by independent local service providers:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-650 font-bold">
              <li><strong>Vendor Responsibility</strong>: To the extent permitted by applicable law, the independent local vendor is solely responsible for service execution, physical safety protocols, safety equipment quality, vehicle mechanical condition, hotel/camp premises, vendor staff behavior, and compliance with local municipal/regulatory standards.</li>
              <li><strong>Limitation of Liability</strong>: TripGod, its founders, employees, and agents shall not be held liable for any personal accident, injury, illness, loss of life, damage/theft of property, operational delays, vendor misconduct, or service deficiencies occurring during the course of any stay, activity, or rental.</li>
              <li><strong>Assumption of Risk</strong>: Customers engaging in adventure activities (e.g., rafting, bungee, zipline) or operating rental bikes/scooties voluntarily assume all inherent risks associated with extreme sports and road travel, and agree to sign the vendor's standard waiver/registration forms at the venue.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Heart size={20} className="text-[#FF5F00]" />
              3. Safety Compliance, Health & Rules
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              Customers must adhere strictly to all safety guidelines and eligibility criteria established by local service providers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650 font-bold">
              <li><strong>Health Eligibility</strong>: Customers must ensure medical fitness (age, weight, cardiac/spine conditions, pregnancy restrictions) for high-intensity adventure sports.</li>
              <li><strong>Rental Compliance</strong>: For scooty/bike rentals, customers must possess a valid driving license, wear helmets, and strictly follow motor vehicle laws.</li>
              <li><strong>Vendor Authority</strong>: Local operators reserve the right to deny service without refund if a client is under the influence of alcohol or drugs, displays unruly behavior, or fails to satisfy safety requirements.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <UserCheck size={20} className="text-[#FF5F00]" />
              4. Code of Conduct & Dispute Resolution
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              TripGod acts as a facilitator and will make reasonable efforts to assist customers in communication and grievance resolution with local vendors. However, primary service delivery obligations rest with the respective independent vendor.
            </p>
          </div>

        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Contact Strip */}
        <div className="p-6 bg-slate-950 text-white rounded-3xl space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-[#FF5F00] text-center font-display">
            Terms & Compliance Support
          </h4>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed font-medium">
            For any queries or formal communication regarding our terms, reach us instantly at:
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

