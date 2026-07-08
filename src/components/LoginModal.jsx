import React, { useState, useEffect, useRef } from 'react';
import { motion as motionImport, AnimatePresence as AnimatePresenceImport } from 'framer-motion';
import { X, Mail, User, Phone, ShieldCheck, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginInput, setLoginInput] = useState('');
  
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
      setLoginInput('');
      setGeneratedOtp('');
      setOtpInputs(['', '', '', '', '', '']);
      setCountdown(60);
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Generate 6-digit OTP and send via backend API
  const triggerOtpSend = async (targetEmail, targetPhone, targetName) => {
    setLoading(true);
    setError('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: targetEmail,
          phone: targetPhone,
          name: targetName,
          otp: code
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setGeneratedOtp(code);
        setCountdown(60);
        
        // Save details in states to track in verification step
        setEmail(targetEmail || '');
        setPhone(targetPhone || '');
        setName(targetName || '');
        
        setMode('otp');
        setOtpInputs(['', '', '', '', '', '']);
        
        // Auto focus first OTP input box after render
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 150);
      } else {
        console.error('OTP send error:', result.error || 'Failed to send');
        setError(`OTP send failed: ${result.error || 'Check backend configuration'}`);
      }
    } catch (err) {
      console.error('OTP sending failed:', err);
      setError(`Connection error: ${err.message || 'Check your internet connection'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const cleanInput = loginInput.trim();
    if (!cleanInput) {
      setError('Please enter your email or mobile number.');
      return;
    }

    const isPhone = /^\d{10}$/.test(cleanInput);
    const isEmail = cleanInput.includes('@');

    if (!isPhone && !isEmail) {
      setError('Please enter a valid email address or 10-digit mobile number.');
      return;
    }

    // Find saved profile info from localStorage
    let savedName = '';
    if (isPhone) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('tripgod_profile_')) {
            const profile = JSON.parse(localStorage.getItem(key));
            if (profile && profile.phone === cleanInput) {
              savedName = profile.name;
              break;
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
      if (!savedName) savedName = 'User';
      triggerOtpSend(null, cleanInput, savedName);
    } else {
      savedName = localStorage.getItem(`tripgod_profile_${cleanInput}`)
        ? JSON.parse(localStorage.getItem(`tripgod_profile_${cleanInput}`)).name
        : cleanInput.split('@')[0];
      triggerOtpSend(cleanInput, null, savedName);
    }
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
    
    // Verify phone via WhatsApp OTP directly
    triggerOtpSend(null, phone, name);
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
      const registeredUser = email 
        ? (localStorage.getItem(`tripgod_profile_${email}`)
            ? JSON.parse(localStorage.getItem(`tripgod_profile_${email}`))
            : { name: name || email.split('@')[0], email, phone })
        : { name: name || 'User', phone, email: '' };

      // Save phone-only registration profile if profile doesn't exist
      if (phone && !email) {
        let found = false;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('tripgod_profile_')) {
              const p = JSON.parse(localStorage.getItem(key));
              if (p && p.phone === phone) {
                found = true;
                break;
              }
            }
          }
          if (!found) {
            localStorage.setItem(`tripgod_profile_phone_${phone}`, JSON.stringify({ name, phone, email: '' }));
          }
        } catch (err) {
          console.error(err);
        }
      }

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
            className="relative w-full max-w-sm overflow-hidden bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-3xl shadow-2xl z-10 p-6 space-y-5 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FF6B00]/10 rounded-xl text-[#FF6B00] shadow-sm">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black font-display text-black uppercase tracking-tight">
                    {mode === 'otp' ? 'Verify Code' : 'TripGod Account'}
                  </h3>
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
                    {mode === 'otp' ? 'Check your email inbox' : 'Adventure awaits you'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-all duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3.5 text-xs bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl font-semibold">
                {error}
              </div>
            )}

            {/* Success Checkmark Animation */}
            {success ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-4 font-sans text-center">
                <motionImport
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center border-2 border-green-500 text-green-500 shadow-lg shadow-green-500/10"
                >
                  <CheckCircle size={40} className="stroke-[2.5]" />
                </motionImport>
                <div>
                  <h4 className="font-extrabold text-lg text-black">OTP Verified Successfully!</h4>
                  <p className="text-xs text-gray-500 mt-1">Setting up your session, please wait...</p>
                </div>
              </div>
            ) : (
              <>
                {/* 1. SEGMENTED TABS CONTROLLER (Only show in login/signup modes) */}
                {mode !== 'otp' && (
                  <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200/50">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError('');
                      }}
                      className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        mode === 'login'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-400 hover:text-black'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError('');
                      }}
                      className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        mode === 'signup'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-gray-400 hover:text-black'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                {/* 2. LOGIN MODE FORM */}
                {mode === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-5 font-sans text-left">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-display">
                        <User size={12} className="text-gray-500" /> Email or Mobile Number
                      </label>
                      <input
                        type="text"
                        required
                        value={loginInput}
                        onChange={(e) => {
                          setLoginInput(e.target.value);
                          setError('');
                        }}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 font-semibold text-sm transition-all duration-200 placeholder-gray-400 font-sans"
                        placeholder="name@email.com or 10-digit number"
                      />
                    </div>

                    <div className="flex gap-2.5 p-3.5 bg-gray-50 text-gray-500 rounded-xl text-[10px] leading-relaxed border border-gray-200/50 font-semibold">
                      <ShieldCheck size={16} className="text-black flex-shrink-0" />
                      <span>
                        Enter your registered email or 10-digit mobile number. We will send a 6-digit OTP code to verify and log you in (sent to Gmail or WhatsApp).
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 border-none cursor-pointer font-display disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending OTP...' : 'Send Verification OTP'} {!loading && <ArrowRight size={14} className="inline ml-1" />}
                    </button>
                  </form>
                )}

                {/* 3. SIGNUP MODE FORM */}
                {mode === 'signup' && (
                  <form onSubmit={handleSignupSubmit} className="space-y-4 font-sans text-left">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <User size={12} className="text-gray-500" /> Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError('');
                        }}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 font-semibold text-sm transition-all duration-200 placeholder-gray-400"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-500" /> Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 font-semibold text-sm transition-all duration-200 placeholder-gray-400"
                        placeholder="name@example.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Phone size={12} className="text-gray-500" /> Mobile Number
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
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-black focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 font-semibold text-sm transition-all duration-200 placeholder-gray-400"
                        placeholder="Enter 10-digit number"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 border-none cursor-pointer font-display disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending OTP...' : 'Create Account & Verify'} {!loading && <ArrowRight size={14} className="inline ml-1" />}
                    </button>
                  </form>
                )}

                {/* 4. OTP VERIFICATION FORM */}
                {mode === 'otp' && (
                  <div className="space-y-5 font-sans text-left">
                    <div className="text-center space-y-2 bg-gray-50 p-4 border border-gray-200/40 rounded-2xl">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        OTP verification code sent to
                      </p>
                      <p className="text-sm font-bold text-black font-mono select-all bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm inline-block">
                        {email || `+91 ${phone}`}
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
                          className="w-11 h-12 border border-gray-300 rounded-xl text-center font-black text-base text-black bg-white focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all duration-200"
                        />
                      ))}
                    </div>

                    {/* Countdown and Resend */}
                    <div className="text-center">
                      {countdown > 0 ? (
                        <span className="text-[11px] font-bold text-gray-400">
                          Resend OTP code in <strong className="text-black font-mono bg-gray-100 px-1.5 py-0.5 rounded">{countdown}s</strong>
                        </span>
                      ) : (
                        <button
                          disabled={loading}
                          onClick={() => triggerOtpSend(email || null, phone || null, name || 'User')}
                          className="text-[11px] font-black text-[#FF6B00] hover:underline disabled:opacity-50"
                        >
                          {loading ? 'Resending...' : (email ? "Didn't receive the email? Resend OTP" : "Didn't receive the WhatsApp? Resend OTP")}
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
                        className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-black bg-white text-black hover:bg-black hover:text-[#FF5F00] hover:border-black transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={verifyOtp}
                        className="flex-1 py-3 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all border-none cursor-pointer font-display"
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
