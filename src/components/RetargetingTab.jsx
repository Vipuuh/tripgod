// src/components/RetargetingTab.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Search, Sparkles, MessageSquare, RefreshCw, Send, Users, User, Clock } from 'lucide-react';

export default function RetargetingTab() {
  const [activeSubTab, setActiveSubTab] = useState('carts'); // 'carts' | 'leads'
  const [searchQuery, setSearchQuery] = useState('');
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: cartsData, error: cartsError },
        { data: leadsData, error: leadsError }
      ] = await Promise.all([
        supabase.from('abandoned_carts').select('*').order('updated_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false })
      ]);

      if (cartsError) throw cartsError;
      if (leadsError) throw leadsError;

      if (cartsData) setAbandonedCarts(cartsData);
      if (leadsData) setLeads(leadsData);
    } catch (err) {
      console.error('Error fetching retargeting logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const trigger1ClickWhatsApp = async (cart) => {
    if (!cart.customer_phone) return;
    setSendingId(cart.id);
    try {
      const response = await fetch('/api/send-recovery-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cart.customer_phone,
          name: cart.customer_name,
          cartItems: cart.cart_items,
          cartId: cart.id
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`1-Click Recovery message sent to ${cart.customer_name} successfully!`);
        // Refresh to show updated logs
        fetchData();
      } else {
        alert(`Failed to send alert: ${result.error || 'Server error'}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  const getManualWhatsAppLink = (item, type = 'cart') => {
    const phoneRaw = type === 'cart' ? item.customer_phone : item.phone;
    if (!phoneRaw) return '#';
    const digits = phoneRaw.replace(/\D/g, '');
    const cleanPhone = digits.length === 10 ? `91${digits}` : digits;

    let message = '';
    if (type === 'cart') {
      const packageNames = item.cart_items.map(i => i.name || 'Adventure Item').join(', ');
      message = `Hi ${item.customer_name}! 👋\n\nYour next adventure with *TripGod* is almost ready! 🌍\n\n🗺️ *Your Selected Trip:* ${packageNames}\n\nComplete your booking now to secure your trip:\n👉 https://tripgod.in/cart?recover=${item.id}\n\nNeed any help? Just message us here! ✈️💙`;
    } else {
      message = `Hi ${item.name}! 👋\n\nThank you for registering on *TripGod*. 🌟\n\nAre you looking to book any adventure, camping, or hotel stay in Rishikesh? We'd love to help you plan the perfect experience!\n\nCheck out the details here:\n👉 https://tripgod.in\n\nReply to this message if you have any questions! ✈️`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Filters
  const filteredCarts = abandonedCarts.filter(c => {
    const searchString = `${c.customer_name} ${c.customer_phone} ${c.customer_email} ${c.status}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredLeads = leads.filter(l => {
    const searchString = `${l.name} ${l.phone} ${l.email}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header with Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] rounded-xl">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Abandoned</span>
            <span className="block text-2xl font-black text-white mt-1">
              {abandonedCarts.filter(c => c.status === 'abandoned').length} carts
            </span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Leads</span>
            <span className="block text-2xl font-black text-white mt-1">
              {leads.length} contacts
            </span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Database Sync</span>
            <span className="block text-xs font-bold text-slate-300 mt-1">Automatic & Real-time</span>
          </div>
          <button 
            onClick={fetchData}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl cursor-pointer transition-colors"
          >
            <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Controls & Tabs */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('carts')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border-none ${activeSubTab === 'carts' ? 'bg-[#FF5F00] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Abandoned Carts
          </button>
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border-none ${activeSubTab === 'leads' ? 'bg-[#FF5F00] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Registered Leads
          </button>
        </div>

        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeSubTab === 'carts' ? 'cart checkouts' : 'leads'}...`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* 3. Tab Body List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs flex justify-center items-center gap-3">
            <RefreshCw size={16} className="animate-spin text-accent" />
            <span>Fetching real-time records...</span>
          </div>
        ) : activeSubTab === 'carts' ? (
          filteredCarts.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No abandoned carts found in database logs.
            </div>
          ) : (
            filteredCarts.map(cart => (
              <div 
                key={cart.id} 
                className={`bg-slate-950 border rounded-2xl p-5 md:p-6 space-y-4 hover:border-slate-700 transition-colors ${cart.status === 'completed' ? 'border-emerald-500/10' : 'border-slate-800'}`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-slate-900 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-200">{cart.customer_name}</h4>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${cart.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {cart.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold mt-1">
                      <Clock size={10} />
                      <span>Updated: {getRelativeTime(cart.updated_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                    {cart.customer_phone && <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{cart.customer_phone}</span>}
                    {cart.customer_email && <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800 truncate max-w-[180px]">{cart.customer_email}</span>}
                  </div>
                </div>

                {/* Items Summary list */}
                <div className="space-y-2 bg-slate-900/40 p-4 border border-slate-900/60 rounded-xl">
                  <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Pending Selection items:</span>
                  {cart.cart_items && Array.isArray(cart.cart_items) ? (
                    cart.cart_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-300 font-medium">
                        <span>
                          {idx + 1}. <strong className="text-white">{item.name || item.title || 'Adventure Item'}</strong> 
                          {item.guests ? ` (${item.guests} Unit${item.guests > 1 ? 's' : ''})` : ''} 
                          {item.slot ? ` - Slot: ${item.slot}` : ''}
                        </span>
                        <span className="text-slate-400 font-bold">{item.date ? `Date: ${item.date}` : ''}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No items logs available.</span>
                  )}
                </div>

                {/* Buttons block */}
                {cart.status === 'abandoned' && (
                  <div className="pt-2 border-t border-slate-900 flex justify-end gap-3">
                    {/* Official Meta 1-Click WhatsApp send */}
                    <button
                      onClick={() => trigger1ClickWhatsApp(cart)}
                      disabled={sendingId === cart.id}
                      className="py-2.5 px-4 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={12} className={sendingId === cart.id ? 'animate-pulse' : ''} />
                      <span>{sendingId === cart.id ? 'Sending...' : '1-Click WhatsApp Alert'}</span>
                    </button>

                    {/* Manual WhatsApp link */}
                    <a
                      href={getManualWhatsAppLink(cart, 'cart')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-4 bg-emerald-950/45 hover:bg-emerald-900/60 border border-emerald-900/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 no-underline"
                    >
                      <MessageSquare size={12} />
                      <span>Manual WhatsApp Chat</span>
                    </a>
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          filteredLeads.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No registered leads found in database.
            </div>
          ) : (
            filteredLeads.map(lead => (
              <div 
                key={lead.id} 
                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-accent border border-slate-800">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-200">{lead.name}</h4>
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold mt-1">
                        <Clock size={10} />
                        <span>Registered: {getRelativeTime(lead.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                    {lead.phone && <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{lead.phone}</span>}
                    {lead.email && <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{lead.email}</span>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-900 flex justify-end gap-3">
                  <a
                    href={getManualWhatsAppLink(lead, 'lead')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-emerald-950/45 hover:bg-emerald-900/60 border border-emerald-900/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 no-underline"
                  >
                    <MessageSquare size={12} />
                    <span>WhatsApp Hello</span>
                  </a>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
