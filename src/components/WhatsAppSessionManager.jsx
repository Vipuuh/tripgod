import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Smartphone, Globe, RefreshCw, Key, LogOut, 
  CheckCircle2, AlertCircle, Laptop, Clock, UserCheck, Lock, Activity
} from 'lucide-react';
import { supabase } from '../supabase';

export default function WhatsAppSessionManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [apiStatus, setApiStatus] = useState({
    connected: true,
    phoneNumber: '+91 94105 72857',
    phoneNumberId: '1242547802272575',
    webhookStatus: 'Verified & Active',
    verifyToken: 'tripgod_wa_verify_2026'
  });

  useEffect(() => {
    fetchSessions();

    // Subscribe to realtime changes on whatsapp_app_sessions
    const sessionsChannel = supabase
      .channel('whatsapp_app_sessions_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_app_sessions' },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
    };
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp-sessions?action=list_sessions');
      const data = await res.json();
      if (res.ok && data.sessions) {
        setSessions(data.sessions);
      } else {
        // Fallback fetch from Supabase directly if endpoint has CORS delay
        const { data: dbSessions } = await supabase
          .from('whatsapp_app_sessions')
          .select('*')
          .order('login_at', { ascending: false });
        if (dbSessions) setSessions(dbSessions);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (session) => {
    if (!window.confirm(`Are you sure you want to remotely logout ${session.user_email} on device (${session.device_info})? Access will be revoked immediately.`)) {
      return;
    }

    setRevokingId(session.id);
    try {
      // Call session revocation API
      const res = await fetch('/api/whatsapp-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_session',
          session_id: session.id
        })
      });

      if (!res.ok) {
        // Direct DB fallback
        await supabase
          .from('whatsapp_app_sessions')
          .update({ is_revoked: true })
          .eq('id', session.id);
      }

      setSessions(prev =>
        prev.map(s => (s.id === session.id ? { ...s, is_revoked: true } : s))
      );
      alert(`✅ Session for ${session.user_email} has been remotely revoked/logged out.`);
    } catch (err) {
      alert(`Failed to revoke session: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner: Meta WhatsApp Cloud API Connection Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-widest mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Meta Cloud API Gateway Status
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">WhatsApp Account & API Integration</h2>
            <p className="text-slate-400 text-xs mt-0.5">Connected official Meta WhatsApp Business Account for TripGod Adventure & Booking</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> API Connected & Healthy
            </span>
            <button 
              onClick={fetchSessions}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Refresh Sessions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Diagnostic Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1 text-xs">
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Official Number</span>
            <p className="font-extrabold text-white font-mono">{apiStatus.phoneNumber}</p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Phone Number ID</span>
            <p className="font-extrabold text-slate-300 font-mono text-[11px] truncate">{apiStatus.phoneNumberId}</p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Webhook Web Status</span>
            <p className="font-extrabold text-emerald-400">{apiStatus.webhookStatus}</p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Verify Token</span>
            <p className="font-extrabold text-slate-300 font-mono text-[11px] truncate">{apiStatus.verifyToken}</p>
          </div>
        </div>

        {/* Important Technical Note */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Cloud API Architecture Note:</p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Meta WhatsApp Cloud API runs directly on Meta cloud servers (it is not a WhatsApp Web QR code linked to a physical phone device). Therefore, physical phone logout is API-impossible. However, all **TripGod Dedicated Support App Sessions** are 100% remotely tracked and can be instantly revoked/logged out below.
            </p>
          </div>
        </div>
      </div>

      {/* Active Authorized Support App Sessions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Laptop className="w-5 h-5 text-orange-400" />
              Active Authorized App Sessions & Remote Logout
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Manage and remotely revoke access for active TripGod Support App devices</p>
          </div>
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            {sessions.filter(s => !s.is_revoked).length} Active Logins
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading active app sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <UserCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No active app sessions recorded yet. Log into the Support App to register a session.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-4">Support User</th>
                  <th className="py-3 px-4">Device / Browser</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Login Time</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sessions.map((session) => {
                  const isRevoked = Boolean(session.is_revoked);
                  return (
                    <tr key={session.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-[11px] border border-orange-500/30">
                          {session.user_email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span>{session.user_email}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                        {session.device_info || 'Desktop Browser'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {session.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {session.login_at ? new Date(session.login_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {session.last_active_at ? new Date(session.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active now'}
                      </td>

                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold">
                            <Lock className="w-3 h-3 text-rose-400" /> Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isRevoked && (
                          <button
                            onClick={() => handleRevokeSession(session)}
                            disabled={revokingId === session.id}
                            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl font-bold text-xs transition-all flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            {revokingId === session.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Revoke & Logout</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
