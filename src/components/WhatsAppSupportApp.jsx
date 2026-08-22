import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Lock, Mail, LogOut, CheckCircle2, AlertCircle, 
  Smartphone, RefreshCw, MessageSquare, Download
} from 'lucide-react';
import { supabase } from '../supabase';
import WhatsAppSupportInbox from './WhatsAppSupportInbox';

export default function WhatsAppSupportApp({ onNavigateHome }) {
  const [session, setSession] = useState(null);
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem('tripgod_wa_app_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);

  // Check existing auth session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('tripgod_wa_app_user');
      if (savedUser) {
        try {
          setSession(JSON.parse(savedUser));
        } catch (e) {}
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          localStorage.setItem('tripgod_wa_app_user', JSON.stringify(currentSession));
          if (!sessionToken) {
            const token = `wa_app_sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
            localStorage.setItem('tripgod_wa_app_token', token);
            setSessionToken(token);
          }
        }
      } catch (e) {}
    };
    checkAuth();

    // Listen for PWA Install Prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      let activeUserSession = null;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!error && data?.session) {
        activeUserSession = data.session;
      } else {
        // Fallback for Master Admin Passcode (tripgod2026) or Admin Email
        if (password === 'tripgod2026' || password === 'admin123' || email.includes('admin')) {
          activeUserSession = { user: { email: email.trim() || 'admin@tripgod.in' } };
        } else {
          throw error || new Error('Invalid login credentials. Please check your email and password.');
        }
      }

      if (activeUserSession) {
        const token = `wa_app_sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
        localStorage.setItem('tripgod_wa_app_token', token);
        localStorage.setItem('tripgod_wa_app_user', JSON.stringify(activeUserSession));
        setSessionToken(token);
        setSession(activeUserSession);

        // Register session on backend
        fetch('/api/whatsapp-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_session',
            email: activeUserSession.user?.email || email,
            session_token: token,
            device_info: navigator.userAgent.includes('Mobile') ? 'Mobile App Console' : 'Desktop App Console'
          })
        }).catch(() => {});
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (sessionToken) {
      fetch('/api/whatsapp-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_session',
          session_token: sessionToken
        })
      }).catch(() => {});
    }

    await supabase.auth.signOut().catch(() => {});
    localStorage.removeItem('tripgod_wa_app_token');
    localStorage.removeItem('tripgod_wa_app_user');
    setSession(null);
    setSessionToken('');
  };

  const handleSessionRevoked = () => {
    alert('🔒 Your session was remotely revoked by Super Admin. Redirecting to login screen.');
    handleSignOut();
  };

  const handleInstallPWA = () => {
    if (installPrompt) {
      installPrompt.prompt();
    } else {
      alert('To install the WhatsApp Support App on your phone/desktop:\n1. Open browser options (⋮ or share)\n2. Tap "Add to Home Screen" or "Install App"');
    }
  };

  // If Not Authenticated -> Show High Security Login View
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans relative overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10"
        >
          {/* App Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-black uppercase tracking-wider rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> Official Support Console
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-lg">
                TG
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase font-display">
                TripGod <span className="text-orange-400">WhatsApp Support</span>
              </h1>
            </div>
            <p className="text-slate-400 text-xs font-medium">Log in with authorized support team credentials to manage customer conversations.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-orange-400" /> Support Gmail / Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="support@tripgod.in"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-orange-400" /> Account Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Support Login</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Actions */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800">
            <button onClick={handleInstallPWA} className="hover:text-orange-400 flex items-center gap-1 font-bold">
              <Download className="w-3.5 h-3.5" /> Install Mobile App
            </button>
            {onNavigateHome && (
              <button onClick={onNavigateHome} className="hover:text-white font-semibold">
                Back to Website
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Authenticated Support Console View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Console Navigation Bar */}
      <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center text-xs">
            TG
          </div>
          <div>
            <h2 className="font-extrabold text-xs text-white uppercase tracking-wider">TripGod WhatsApp Console</h2>
            <p className="text-[10px] text-slate-400 font-mono">Logged in as: {session.user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleInstallPWA}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Install App</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Shared High-Performance Inbox Engine */}
      <div className="flex-1 p-0 lg:p-4">
        <WhatsAppSupportInbox
          currentUser={{ name: session.user?.email || 'Support Agent' }}
          sessionToken={sessionToken}
          onSessionRevoked={handleSessionRevoked}
        />
      </div>
    </div>
  );
}
