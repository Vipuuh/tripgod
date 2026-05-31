import React from 'react';
import { Scale, ShieldAlert, Heart, Info } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-16 font-sans">
      <div className="max-w-3xl mx-auto px-6 bg-white border-2 border-black rounded-2xl p-8 md:p-12 shadow-md">
        <div className="text-center space-y-3 mb-10">
          <Scale size={48} className="text-[#FF6B00] mx-auto" />
          <h1 className="text-3xl font-black font-display text-black">TERMS & CONDITIONS</h1>
          <div className="w-16 h-1 bg-[#FF6B00] mx-auto" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Last Updated: May 2026</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed font-medium">
          <div className="p-4 bg-orange-50 border border-[#FF6B00]/20 rounded-xl space-y-2">
            <h4 className="font-bold text-sm text-[#FF6B00] uppercase tracking-wide flex items-center gap-1.5">
              <ShieldAlert size={16} /> Marketplace & Liability Disclaimer
            </h4>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              <strong>TripGod</strong> (Tripgod.in) operates strictly as a booking agent/aggregator under a tie-up model. We do not own, manage, or operate any physical adventure gear, rafting boats, bungee platforms, zipline wires, paragliding setups, or camps. All activities are executed by independent, verified local operators.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <Info size={18} className="text-[#FF6B00]" /> 1. Booking & Advance Payment
            </h2>
            <p>
              To confirm slots for any activity, users are required to pay a <strong>10% booking advance fee</strong> online through our secure gateway (processed by Razorpay). The remaining 90% balance must be paid directly to the local executing operator at the venue before starting the activity.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#FF6B00]" /> 2. Liability Limitation
            </h2>
            <p>
              Since all activities are physically carried out under the supervision of local operators, <strong>TripGod shall not be held responsible or liable</strong> for any injury, incidence, accident, loss of life, delay, or damage to personal property occurring during the course of the adventure activity. 
            </p>
            <p>
              Customers booking through TripGod voluntarily agree to assume all risks associated with extreme adventure sports and must sign the operator's standard waiver forms at the venue before commencing.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <Heart size={18} className="text-[#FF6B00]" /> 3. Medical Fitness & Safety
            </h2>
            <p>
              It is the customer's responsibility to ensure that they are medically fit and comply with the age, weight, and health parameters detailed in the safety specifications of each activity (e.g., heart conditions, back injuries, pregnancy, weight limits). Local operators reserve the right to deny service if a customer does not meet the necessary criteria, and any refund in such scenarios is subject to the cancellation policy.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black">4. Code of Conduct</h2>
            <p>
              Users must follow the commands, rules, and guidelines provided by the safety guides and operators. Operating agencies reserve the right to cancel bookings on the spot without refund if a client is found under the influence of alcohol, drugs, or displays misbehavior.
            </p>
          </div>

          <div className="pt-6 border-t border-black/5 text-xs text-gray-500 text-center">
            For any queries or formal communication, please email us at <strong>Tripgod.in@gmail.com</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
