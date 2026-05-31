import React, { useState, useEffect, useRef } from 'react';
import { motion as motionImport, AnimatePresence as AnimatePresenceImport } from 'framer-motion';
import { X, Mail, User, Phone, ShieldCheck, ShieldAlert, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP States
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
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
      setShowToast(false);
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  // Generate 6-digit OTP
  const triggerOtpSend = (targetEmail, targetName) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setCountdown(60);
    setMode('otp');
    setOtpInputs(['', '', '', '', '', '']);
    setError('');

    // Trigger SMTP Toast Simulation
    setToastMessage(code);
    setShowToast(true);

    // Auto focus first OTP input box after render
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
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
      setShowToast(false);

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

          {/* Simulated SMTP Toast Notification */}
          <AnimatePresenceImport>
            {showToast && (
              <motionImport
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-6 right-6 z-[9999] max-w-sm w-80 bg-black text-white border-2 border-[#FF6B00] rounded-2xl p-4 shadow-[0_15px_30px_rgba(255,107,0,0.2)] flex gap-4 text-left font-sans"
              >
                <div className="text-3xl animate-bounce">📬</div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-[#FF6B00] uppercase bg-[#FF6B00]/10 px-2 py-0.5 rounded border border-[#FF6B00]/20">
                      SMTP SERVER
                    </span>
                    <button 
                      onClick={() => setShowToast(false)} 
                      className="text-white/40 hover:text-white text-xs font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                  <h4 className="font-bold text-xs text-white">Gmail Verification Service</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Sent to: <strong className="text-white font-mono">{email}</strong>
                  </p>
                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Your OTP is:</span>
                    <span className="font-mono text-[#FF6B00] font-black text-base tracking-widest select-all animate-pulse">
                      {toastMessage}
                    </span>
                  </div>
                  <span className="text-[8px] text-[#FF6B00] font-semibold block pt-1">
                    💡 Click or double-click to select and copy the code.
                  </span>
                </div>
              </motionImport>
            )}
          </AnimatePresenceImport>

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
                      className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all duration-300 border-none cursor-pointer font-display"
                    >
                      Send Verification OTP <ArrowRight size={14} className="inline ml-1" />
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
                      className="w-full py-3.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all duration-300 border-none cursor-pointer font-display"
                    >
                      Create Account & Verify <ArrowRight size={14} className="inline ml-1" />
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
                        We have simulated sending an OTP to:
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
                          onClick={() => triggerOtpSend(email, name || email.split('@')[0])}
                          className="text-[11px] font-black text-[#FF6B00] hover:underline"
                        >
                          Didn't receive the email? Resend OTP
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
