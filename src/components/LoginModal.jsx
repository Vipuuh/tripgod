import React, { useState, useEffect, useRef } from 'react';
import { motion as motionImport, AnimatePresence as AnimatePresenceImport } from 'framer-motion';
import { X, Mail, User, Phone, ShieldCheck, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP States
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle OTP countdown timer
  useEffect(() => {
    if (mode === 'otp' && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, countdown]);

  // Reset modal states when closed or opened
  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setName('');
      setEmail('');
      setPhone('');
      setGeneratedOtp('');
      setOtpInputs(['', '', '', '', '', '']);
      setCountdown(60);
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Generate 6-digit OTP and send via EmailJS
  const triggerOtpSend = async (targetEmail, targetName) => {
    setLoading(true);
    setError('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'service_heo4ylg',
          template_id: 'template_klczx1c',
          user_id: '4xZnfSBQiVmBt_PfZ',
          template_params: {
            to_name: targetName,
            to_email: targetEmail,
            email: targetEmail,
            otp_code: code,
          },
        }),
      });

      if (response.ok) {
        setGeneratedOtp(code);
        setCountdown(60);
        setMode('otp');
        setOtpInputs(['', '', '', '', '', '']);
        
        // Auto focus first OTP input box after render
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 150);
      } else {
        const errText = await response.text();
        console.error('EmailJS error:', errText);
        setError(`EmailJS Error: ${errText || 'Failed to send'}`);
      }
    } catch (err) {
      console.error('Email sending failed:', err);
      setError(`Connection error: ${err.message || 'Check your internet connection'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    
    // Simulate finding the registered user, default name to email prefix if not found
    const savedName = localStorage.getItem(`tripgod_profile_${email}`) 
      ? JSON.parse(localStorage.getItem(`tripgod_profile_${email}`)).name 
      : email.split('@')[0];

    triggerOtpSend(email, savedName);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Save profile details to localStorage (mock signup registration)
    localStorage.setItem(`tripgod_profile_${email}`, JSON.stringify({ name, email, phone }));
    
    triggerOtpSend(email, name);
  };

  const handleOtpInput = (val, idx) => {
    if (isNaN(val)) return;
    const newInputs = [...otpInputs];
    newInputs[idx] = val;
    setOtpInputs(newInputs);
    setError('');

    // Shift focus to next input
    if (val !== '' && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (otpInputs[idx] === '' && idx > 0) {
        const newInputs = [...otpInputs];
        newInputs[idx - 1] = '';
        setOtpInputs(newInputs);
        inputRefs.current[idx - 1]?.focus();
      } else {
        const newInputs = [...otpInputs];
        newInputs[idx] = '';
        setOtpInputs(newInputs);
      }
    }
  };

  const verifyOtp = () => {
    const enteredOtp = otpInputs.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the full 6-digit OTP.');
      return;
    }

    if (enteredOtp === generatedOtp) {
      setSuccess(true);
      setError('');

      // Perform actual login
      const registeredUser = localStorage.getItem(`tripgod_profile_${email}`)
        ? JSON.parse(localStorage.getItem(`tripgod_profile_${email}`))
        : { name: email.split('@')[0], email };

      setTimeout(() => {
        onLogin(registeredUser);
        onClose();
      }, 1500);
    } else {
      setError('Invalid OTP code. Please enter the correct code.');
    }
  };

  return (
    <AnimatePresenceImport>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Backdrop click */}
          <motionImport
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motionImport
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden bg-white border border-black/10 rounded-2xl shadow-2xl z-10 p-6 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#FF6B00]" />
                <h3 className="text-lg font-bold font-display text-black uppercase tracking-tight">
                  {mode === 'login' && 'Login to TripGod'}
                  {mode === 'signup' && 'Create TripGod Account'}
                  {mode === 'otp' && 'Verify Your Email'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r font-semibold">
                {error}
              </div>
            )}

            {/* Success Checkmark Animation */}
            {success ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 font-sans text-center">
                <motionImport
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border-2 border-green-500 text-green-500"
                >
                  <CheckCircle size={32} className="stroke-[2.5]" />
                </motionImport>
                <div>
                  <h4 className="font-bold text-base text-black">OTP Verified Successfully!</h4>
                  <p className="text-xs text-gray-500 mt-1">Logging you in, please wait...</p>
                </div>
              </div>
            ) : (
              <>
                {/* 1. LOGIN MODE FORM */}
                {mode === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans text-left">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Mail size={12} className="text-black" /> Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className="w-full px-4 py-3 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-semibold text-sm"
                        placeholder="name@example.com"
                      />
                    </div>

                    <div className="flex gap-2 p-3 bg-gray-50 text-gray-500 rounded-lg text-[10px] leading-relaxed border border-black/5 font-semibold">
                      <ShieldCheck size={16} className="text-black flex-shrink-0" />
                      <span>
                        Enter your registered email. We will send a 6-digit OTP code to verify and log you in.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all duration-300 border-none cursor-pointer font-display disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending OTP...' : 'Send Verification OTP'} {!loading && <ArrowRight size={14} className="inline ml-1" />}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setError('');
                        }}
                        className="text-xs font-black text-black hover:text-[#FF6B00] hover:underline"
                      >
                        Don't have an account? Sign Up Here
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. SIGNUP MODE FORM */}
                {mode === 'signup' && (
                  <form onSubmit={handleSignupSubmit} className="space-y-4 font-sans text-left">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <User size={12} className="text-black" /> Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError('');
                        }}
                        className="w-full px-4 py-3 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-semibold text-sm"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Mail size={12} className="text-black" /> Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className="w-full px-4 py-3 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-semibold text-sm"
                        placeholder="name@example.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Phone size={12} className="text-black" /> Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, ''));
                          setError('');
                        }}
                        className="w-full px-4 py-3 border-2 border-black rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-accent font-semibold text-sm"
                        placeholder="Enter 10-digit number"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all duration-300 border-none cursor-pointer font-display disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending OTP...' : 'Create Account & Verify'} {!loading && <ArrowRight size={14} className="inline ml-1" />}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                        }}
                        className="text-xs font-black text-black hover:text-[#FF6B00] hover:underline"
                      >
                        Already have an account? Log In
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. OTP VERIFICATION FORM */}
                {mode === 'otp' && (
                  <div className="space-y-5 font-sans text-left">
                    <div className="text-center space-y-1.5">
                      <p className="text-xs font-medium text-gray-600">
                        OTP verification code sent to:
                      </p>
                      <p className="text-xs font-bold text-black font-mono select-all bg-gray-50 px-2.5 py-1 rounded inline-block border border-black/5">
                        {email}
                      </p>
                    </div>

                    {/* 6-Digit input grid */}
                    <div className="flex justify-between gap-2 max-w-xs mx-auto my-3">
                      {otpInputs.map((val, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          value={val}
                          onChange={(e) => handleOtpInput(e.target.value, idx)}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          className="w-11 h-12 border-2 border-black rounded-xl text-center font-black text-base text-black bg-white focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15"
                        />
                      ))}
                    </div>

                    {/* Countdown and Resend */}
                    <div className="text-center">
                      {countdown > 0 ? (
                        <span className="text-[11px] font-semibold text-gray-400">
                          Resend OTP code in <strong className="text-black font-mono">{countdown}s</strong>
                        </span>
                      ) : (
                        <button
                          disabled={loading}
                          onClick={() => triggerOtpSend(email, name || email.split('@')[0])}
                          className="text-[11px] font-black text-[#FF6B00] hover:underline disabled:opacity-50"
                        >
                          {loading ? 'Resending...' : "Didn't receive the email? Resend OTP"}
                        </button>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setMode('login');
                          setError('');
                        }}
                        className="flex-1 py-3 border border-black/20 rounded-xl text-xs font-bold bg-white text-black hover:bg-black hover:text-[#FF5F00] hover:border-black transition-all hover:scale-[1.02]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={verifyOtp}
                        className="flex-1 py-3 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
                      >
                        Verify & Login
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motionImport>
        </div>
      )}
    </AnimatePresenceImport>
  );
}
