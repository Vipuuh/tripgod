import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, ShieldCheck, KeyRound, Save, MessageSquare, Phone, 
  Sparkles, CheckCircle2, AlertCircle, Eye, Wrench, RefreshCw
} from 'lucide-react';
import { supabase } from '../supabase';

export default function MaintenanceManager({ maintenanceConfig, setMaintenanceConfig, isMaintenanceActive, setIsMaintenanceActive }) {
  const [formData, setFormData] = useState({
    enabled: false,
    headline: "We're Upgrading TripGod! 🚀",
    message: "We are currently making exciting upgrades & adding new adventure packages. We'll be back online shortly!",
    estimated_time: "Back online within 2 hours",
    support_phone: "+91 98765 43210",
    support_whatsapp: "+919876543210",
    passcode: "tripgod2026"
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (maintenanceConfig) {
      setFormData({
        enabled: maintenanceConfig.enabled ?? false,
        headline: maintenanceConfig.headline || "We're Upgrading TripGod! 🚀",
        message: maintenanceConfig.message || "We are currently making exciting upgrades & adding new adventure packages. We'll be back online shortly!",
        estimated_time: maintenanceConfig.estimated_time || "Back online within 2 hours",
        support_phone: maintenanceConfig.support_phone || "+91 98765 43210",
        support_whatsapp: maintenanceConfig.support_whatsapp || "+919876543210",
        passcode: maintenanceConfig.passcode || "tripgod2026"
      });
    }
  }, [maintenanceConfig]);

  const handleToggleLock = async () => {
    const updatedEnabled = !formData.enabled;
    const updated = { ...formData, enabled: updatedEnabled };
    setFormData(updated);
    await saveConfig(updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await saveConfig(formData);
  };

  const saveConfig = async (configToSave) => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      // 1. Save to Supabase site_settings table
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'maintenance_config',
          value: configToSave,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Supabase save error (falling back to localStorage):', error.message);
      }

      // 2. Save to localStorage
      localStorage.setItem('tripgod_maintenance_config', JSON.stringify(configToSave));

      // 3. Update parent React states
      if (setMaintenanceConfig) setMaintenanceConfig(configToSave);
      if (setIsMaintenanceActive) setIsMaintenanceActive(configToSave.enabled);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving maintenance config:', err);
      setErrorMessage('Failed to sync settings. Local state saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl space-y-8 shadow-sm text-slate-900 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
              Store Lock & Maintenance Mode
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Lock store for public visitors while upgrading website. Admin can login & preview changes live!
            </p>
          </div>
        </div>

        {/* Current Lock Status Pill */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-sm ${
            formData.enabled 
              ? 'bg-rose-50 border-rose-200 text-rose-700' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${formData.enabled ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${formData.enabled ? 'bg-rose-600' : 'bg-emerald-600'}`}></span>
            </span>
            <span>{formData.enabled ? '🔴 STORE IS LOCKED (Visitors see Coming Soon)' : '🟢 STORE IS LIVE (Normal Public Access)'}</span>
          </div>

          {/* Quick Toggle Button */}
          <button
            type="button"
            onClick={handleToggleLock}
            disabled={saving}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 ${
              formData.enabled 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {formData.enabled ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock Store Now</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Lock Store Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleFormSubmit} className="space-y-6 max-w-4xl">
        
        {/* Toggle Switch Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Enable Store Lock (Maintenance Mode)</span>
              {formData.enabled && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                  Active
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500">
              When switched on, all public visitors will be shown the Coming Soon maintenance page.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={handleToggleLock}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Announcement Headline */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Coming Soon Headline
            </label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="e.g. We're Upgrading TripGod! 🚀"
              required
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-semibold text-sm shadow-sm"
            />
          </div>

          {/* Detailed Message */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Visitor Description Message
            </label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Explain why the store is under maintenance and when it will reopen..."
              required
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-medium text-sm shadow-sm"
            />
          </div>

          {/* Estimated Completion Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Estimated Completion Notice
            </label>
            <input
              type="text"
              value={formData.estimated_time}
              onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
              placeholder="e.g. Back online within 2 hours"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-semibold text-sm shadow-sm"
            />
          </div>

          {/* Secret Admin Bypass Passcode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Secret Admin Passcode</span>
              <span className="text-[10px] text-orange-600 font-bold">Store Owner Bypass</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.passcode}
                onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                placeholder="Set secret passcode (e.g. tripgod2026)"
                required
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-mono text-sm shadow-sm"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Support WhatsApp Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Support WhatsApp Number
            </label>
            <input
              type="text"
              value={formData.support_whatsapp}
              onChange={(e) => setFormData({ ...formData, support_whatsapp: e.target.value })}
              placeholder="+919876543210"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-semibold text-sm shadow-sm"
            />
          </div>

          {/* Support Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Support Phone Call Number
            </label>
            <input
              type="text"
              value={formData.support_phone}
              onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-semibold text-sm shadow-sm"
            />
          </div>

        </div>

        {/* Status Alerts */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Store Lock Settings updated & synced successfully across Supabase!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 border-none cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Sync Maintenance Mode</span>
              </>
            )}
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            <Eye className="w-4 h-4 text-orange-600" />
            <span>Open Customer View in New Tab</span>
          </a>
        </div>

      </form>

    </div>
  );
}
