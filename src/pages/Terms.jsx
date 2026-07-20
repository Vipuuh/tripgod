import React from 'react';
import { Scale, ShieldAlert, Heart, Info, Mail, Phone, MapPin } from 'lucide-react';

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
            Last Updated: July 2026
          </p>
        </div>

        <div className="w-full h-[1px] bg-slate-100" />

        {/* Disclaimer Warning */}
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5 text-left shadow-3xs">
          <h4 className="font-extrabold text-sm text-[#FF5F00] uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert size={18} /> Marketplace & Liability Disclaimer
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
            <strong>TripGod</strong> (Tripgod.in) operates strictly as a booking agent/aggregator under a tie-up model. We do not own, manage, or operate any physical adventure gear, rafting boats, zipline wires, paragliding setups, or camps. All activities are executed by independent, certified local operators.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 pt-2">
          
          {/* Section 1 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Info size={20} className="text-[#FF5F00]" />
              1. Booking & Advance Payment
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              To confirm slots for any activity, users are required to pay a <strong>partial booking advance fee</strong> online through our secure gateway (processed by Razorpay). The remaining balance must be paid directly to the local executing operator at the venue before starting the activity.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <ShieldAlert size={20} className="text-[#FF5F00]" />
              2. Liability Limitation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              Since all activities are physically carried out under the supervision of local operators, <strong>TripGod shall not be held responsible or liable</strong> for any injury, incidence, accident, loss of life, delay, or damage to personal property occurring during the course of the adventure activity. 
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              Customers booking through TripGod voluntarily agree to assume all risks associated with extreme adventure sports and must sign the operator's standard waiver forms at the venue before commencing.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Heart size={20} className="text-[#FF5F00]" />
              3. Medical Fitness & Safety
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              It is the customer's responsibility to ensure that they are medically fit and comply with the age, weight, and health parameters detailed in the safety specifications of each activity (e.g., heart conditions, back injuries, pregnancy, weight limits). Local operators reserve the right to deny service if a customer does not meet the necessary criteria, and any refund in such scenarios is subject to the cancellation policy.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
            <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight">
              4. Code of Conduct
            </h2>
            <p className="text-xs sm:text-sm text-slate-605 leading-relaxed font-semibold">
              Users must follow the commands, rules, and guidelines provided by the safety guides and operators. Operating agencies reserve the right to cancel bookings on the spot without refund if a client is found under the influence of alcohol, drugs, or displays misbehavior.
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
