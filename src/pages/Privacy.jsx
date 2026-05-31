import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-16 font-sans">
      <div className="max-w-3xl mx-auto px-6 bg-white border-2 border-black rounded-2xl p-8 md:p-12 shadow-md">
        <div className="text-center space-y-3 mb-10">
          <Shield size={48} className="text-[#FF6B00] mx-auto" />
          <h1 className="text-3xl font-black font-display text-black">PRIVACY POLICY</h1>
          <div className="w-16 h-1 bg-[#FF6B00] mx-auto" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Last Updated: May 2026</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed font-medium">
          <p>
            At <strong>TripGod</strong> (accessible from Tripgod.in), one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by TripGod and how we use it.
          </p>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <Lock size={18} className="text-[#FF6B00]" /> 1. Information We Collect
            </h2>
            <p>
              When you book an adventure or register on our site, we collect personal information necessary to execute the booking. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name and Email Address</li>
              <li>Contact Number (WhatsApp)</li>
              <li>Booking Details (date, slot, activity, count of guests)</li>
              <li>Payment details (processed securely via our partner gateway Razorpay)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <Eye size={18} className="text-[#FF6B00]" /> 2. How We Use Your Information
            </h2>
            <p>
              We use the collected information in the following ways:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To book slots and coordinate with our certified local operators.</li>
              <li>To send booking tickets, confirmation details, and coordinates via WhatsApp/Email.</li>
              <li>To process transactions and coordinate refunds if applicable.</li>
              <li>To improve our customer service and communication.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black flex items-center gap-2">
              <FileText size={18} className="text-[#FF6B00]" /> 3. Data Protection & Sharing
            </h2>
            <p>
              <strong>TripGod</strong> operates on a tie-up/marketplace model. We share only your necessary booking information (Name and Contact Number) with the specific local adventure operator executing your selected activity. We do not sell, rent, or trade your personal data with third-party advertisers.
            </p>
            <p>
              All online payments are securely processed through Razorpay. We do not store credit/debit card numbers or net banking credentials on our servers.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-display text-black">4. Consent</h2>
            <p>
              By using our website, you hereby consent to our Privacy Policy and agree to its terms.
            </p>
          </div>

          <div className="pt-6 border-t border-black/5 text-xs text-gray-500 text-center">
            For any queries regarding our privacy practices, contact us at <strong>Tripgod.in@gmail.com</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
