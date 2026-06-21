import React from 'react';
import { RefreshCw, Calendar, AlertCircle, HelpCircle } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-16 font-sans">
      <div className="max-w-3xl mx-auto px-6 bg-white border-2 border-black rounded-2xl p-8 md:p-12 shadow-md">
        <div className="text-center space-y-3 mb-10">
          <RefreshCw size={48} className="text-[#FF6B00] mx-auto" />
          <h1 className="text-3xl font-black font-display text-black">CANCELLATION & REFUND POLICY</h1>
          <div className="w-16 h-1 bg-[#FF6B00] mx-auto" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Last Updated: May 2026</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed font-medium">
          <p>
            At <strong>TripGod</strong>, we understand that travel plans can change. Since we collect only a <strong>partial advance booking fee</strong> online to secure your activity slots, our refund policy applies directly to this advance deposit.
          </p>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <Calendar size={18} className="text-[#FF6B00]" /> 1. Cancellation Timelines & Refunds
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>24 Hours or More Prior:</strong> If you cancel your booking 24 hours or more before your scheduled activity date/time slot, you are eligible for a <strong>100% full refund</strong> of your advance booking fee.
              </li>
              <li>
                <strong>Within 24 Hours or No-Show:</strong> If you cancel within 24 hours of your scheduled activity slot, or in case you fail to arrive at the venue (no-show), the advance booking fee will be <strong>forfeited</strong> (non-refundable) to cover operator reservation expenses.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <AlertCircle size={18} className="text-[#FF6B00]" /> 2. Operator Cancellations (Force Majeure)
            </h2>
            <p>
              Adventure activities are heavily subject to weather conditions, river flow levels (for rafting), and local administration safety regulations. In case the local executing operator cancels the activity due to safety concerns, river levels, heavy rainfall, or local laws, a <strong>100% full refund</strong> of your advance booking fee will be processed immediately.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <RefreshCw size={18} className="text-[#FF6B00]" /> 3. How to Request a Refund
            </h2>
            <p>
              To request a cancellation and refund, please message our support desk on WhatsApp at <strong>+91 9837371137</strong> or email us at <strong>Tripgod.in@gmail.com</strong> with your booking details. 
            </p>
            <p>
              Once approved, refunds are processed back to the original payment source (credit/debit cards, UPI, or net banking) within <strong>5 to 7 working days</strong> according to bank clearing cycles.
            </p>
          </div>

          <div className="pt-6 border-t border-black/5 text-xs text-gray-500 text-center">
            For any queries or assistance, reach us instantly at <strong>Tripgod.in@gmail.com</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
