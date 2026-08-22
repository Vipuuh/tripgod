import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Send, Paperclip, Image, FileText, Phone, CheckCheck, 
  Clock, Filter, User, MapPin, Sparkles, AlertCircle, RefreshCw, 
  ChevronLeft, Star, CheckCircle2, Shield, Calendar, CreditCard, 
  BellRing, X, ArrowUpRight, MessageSquare, Tag, Zap, ShoppingCart,
  UserPlus, Lock, Maximize2, Download, Eye, Play, Volume2, FileCheck, Layers
} from 'lucide-react';
import { supabase } from '../supabase';

// Quick Reply Preset Options
const QUICK_REPLIES = [
  {
    id: 'rafting_loc',
    title: '📍 Rafting Location',
    text: 'Hi! 🌊 Our Shivpuri Rafting Reporting Point location map: https://maps.app.goo.gl/81zn6x9SS9pDg6bF7. Please arrive 20 mins before your slot time!'
  },
  {
    id: 'upi_payment',
    title: '💳 UPI Payment',
    text: 'Hi! You can send the booking advance via GooglePay / PhonePe / Paytm UPI to: tripgod@upi . Please share the payment screenshot here for instant confirmation!'
  },
  {
    id: 'hotel_policy',
    title: '🏨 Hotel Check-in',
    text: 'Hi! 🏨 Standard Hotel Check-in time is 12:00 PM and Check-out is 11:00 AM. Early check-in is subject to room availability.'
  },
  {
    id: 'refund_policy',
    title: '📜 Refund Policy',
    text: 'Hi! We offer Free Cancellation up to 24 hours before your travel date with 100% instant advance refund to your account.'
  },
  {
    id: 'bungee_rules',
    title: '🪂 Bungee Guidelines',
    text: 'Hi! Bungee Jumping weight limit is 40 kg to 110 kg. Age limit: 12 to 45 years. Please carry valid Govt ID proof.'
  }
];

// WhatsApp Meta Approved Templates for 24h Window Expiry
const APPROVED_TEMPLATES = [
  {
    id: 'hello_world',
    name: 'hello_world',
    title: '👋 Hello World Greeting',
    language: 'en_US',
    description: 'Standard Meta greeting template to initiate customer conversation.',
    vars: []
  },
  {
    id: 'booking_confirmation',
    name: 'booking_confirmation_v1',
    title: '🎟️ Booking Confirmation Notification',
    language: 'en_US',
    description: 'Send booking confirmation voucher and details.',
    vars: ['Customer Name', 'Booking ID']
  },
  {
    id: 'reengagement_v1',
    name: 'reengagement_v1',
    title: '💬 Customer Support Re-engagement',
    language: 'en_US',
    description: 'Re-open support conversation after 24h window expiration.',
    vars: ['Customer Name']
  }
];

export default function WhatsAppSupportInbox({ currentUser = { name: 'Vipu (Admin)' }, sessionToken = null, onSessionRevoked = null }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [linkedBookings, setLinkedBookings] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'cart_leads', 'starred', 'closed'
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals & Drawers
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);

  // Form Inputs
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(APPROVED_TEMPLATES[0]);
  const [templateVarValues, setTemplateVarValues] = useState({});

  // UI State
  const [isMobileViewActiveChat, setIsMobileViewActiveChat] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);

  // Audio notification chime
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  // 1. Fetch Chats & Validate Session on Mount
  useEffect(() => {
    fetchChats();

    // Check session status periodically if token is passed
    let sessionCheckTimer;
    if (sessionToken && onSessionRevoked) {
      sessionCheckTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/whatsapp-sessions?action=validate_session&session_token=${sessionToken}`);
          const data = await res.json();
          if (data.revoked) {
            clearInterval(sessionCheckTimer);
            onSessionRevoked();
          }
        } catch (e) {}
      }, 10000);
    }

    // Subscribe to Realtime Updates on whatsapp_chats
    const chatsChannel = supabase
      .channel('whatsapp_chats_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_chats' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
          }
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      if (sessionCheckTimer) clearInterval(sessionCheckTimer);
      supabase.removeChannel(chatsChannel);
    };
  }, [sessionToken]);

  // 2. Fetch Messages & Linked Bookings when Active Chat Changes
  useEffect(() => {
    if (activeChat?.id) {
      isInitialLoadRef.current = true;
      isAtBottomRef.current = true;
      fetchMessages(activeChat.id);
      fetchCustomerBookings(activeChat.phone_number);
      markChatAsRead(activeChat.id);

      // Realtime subscription for current chat messages
      const msgsChannel = supabase
        .channel(`chat_${activeChat.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `chat_id=eq.${activeChat.id}` },
          (payload) => {
            if (payload.new) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
              if (payload.new.direction === 'inbound' && soundEnabled) {
                playNotificationSound();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(msgsChannel);
      };
    }
  }, [activeChat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 120;
    isAtBottomRef.current = nearBottom;
  };

  const scrollToBottom = (force = false) => {
    if (force || isAtBottomRef.current || isInitialLoadRef.current) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: isInitialLoadRef.current ? 'auto' : 'smooth' });
          isInitialLoadRef.current = false;
        }
      }, 50);
    }
  };

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        setChats(data);
        setActiveChat((prevActive) => {
          if (prevActive) {
            const updated = data.find((c) => c.id === prevActive.id);
            return updated ? { ...prevActive, ...updated } : prevActive;
          }
          if (data.length > 0 && window.innerWidth >= 1024) {
            return data[0];
          }
          return null;
        });
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async (chatId) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchCustomerBookings = async (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const search10 = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .ilike('customer_phone', `%${search10}%`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLinkedBookings(data);
      }
    } catch (err) {
      console.error('Error fetching customer bookings:', err);
    }
  };

  const markChatAsRead = async (chatId) => {
    try {
      await supabase
        .from('whatsapp_chats')
        .update({ unread_count: 0 })
        .eq('id', chatId);

      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }
  };

  // Create New Conversation / Search Number
  const handleStartNewChat = async (e) => {
    e.preventDefault();
    if (!newChatPhone.trim()) return;

    const rawDigits = newChatPhone.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      alert('Please enter a valid WhatsApp phone number (minimum 10 digits).');
      return;
    }

    const cleanPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const customerName = newChatName.trim() || `Customer (+${cleanPhone})`;

    // Check if chat already exists
    let existing = chats.find((c) => c.phone_number === cleanPhone);

    if (existing) {
      setActiveChat(existing);
      setShowNewChatModal(false);
      setNewChatPhone('');
      setNewChatName('');
      setIsMobileViewActiveChat(true);
      return;
    }

    // Insert new chat record
    try {
      const windowExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .insert({
          phone_number: cleanPhone,
          customer_name: customerName,
          last_message: 'Chat initiated by support team',
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          status: 'open',
          window_expires_at: windowExpiresAt
        })
        .select()
        .single();

      if (!error && data) {
        setChats((prev) => [data, ...prev]);
        setActiveChat(data);
        setShowNewChatModal(false);
        setNewChatPhone('');
        setNewChatName('');
        setIsMobileViewActiveChat(true);
      } else {
        alert('Failed to create new chat: ' + (error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error creating chat: ' + err.message);
    }
  };

  // Calculate 24-hour Meta service window status
  const getWindowStatus = (expiresAtStr) => {
    if (!expiresAtStr) return { active: true, label: '🟢 24h Window Active' };
    const expiresAt = new Date(expiresAtStr).getTime();
    const now = Date.now();
    const diffMs = expiresAt - now;

    if (diffMs <= 0) {
      return { active: false, label: '⚠️ 24h Window Expired' };
    }
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { active: true, label: `🟢 ${hoursLeft}h ${minsLeft}m Window` };
  };

  // Send WhatsApp Reply (Free text or Media)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!activeChat || (!replyText.trim() && !selectedFile)) return;

    const windowStat = getWindowStatus(activeChat.window_expires_at);
    if (!windowStat.active) {
      alert('⚠️ The 24-hour Meta Customer Service Window has expired for this conversation. You must send an Approved Template Message to re-open the conversation.');
      setShowTemplateModal(true);
      return;
    }

    setSending(true);
    setUploadProgress(20);
    const messageToSend = replyText;
    setReplyText('');
    setShowQuickReplies(false);

    try {
      let mediaUrl = null;
      let mediaType = 'text';

      // If sending a media file (upload to temporary storage for zero long-term bloat)
      if (selectedFile) {
        setUploadProgress(40);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `wa_${Date.now()}.${fileExt}`;
        const filePath = `whatsapp_temp/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('media')
          .upload(filePath, selectedFile);

        setUploadProgress(70);

        if (!uploadErr && uploadData) {
          const { data: pubUrlData } = supabase.storage.from('media').getPublicUrl(filePath);
          mediaUrl = pubUrlData.publicUrl;

          if (selectedFile.type.startsWith('image/')) mediaType = 'image';
          else if (selectedFile.type.startsWith('video/')) mediaType = 'video';
          else if (selectedFile.type.startsWith('audio/')) mediaType = 'audio';
          else mediaType = 'document';
        }
      }

      setUploadProgress(85);

      // Call Vercel Serverless Function to dispatch message to Meta WhatsApp Cloud API
      const response = await fetch('/api/send-whatsapp-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: activeChat.id,
          recipient_phone: activeChat.phone_number,
          message_type: mediaUrl ? mediaType : 'text',
          text: messageToSend || mediaCaption,
          media_url: mediaUrl,
          media_filename: selectedFile?.name || 'Attachment.pdf',
          agent_name: currentUser.name || 'TripGod Support'
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        alert(`Failed to send WhatsApp message: ${resData.error || 'Unknown error'}`);
      } else {
        setSelectedFile(null);
        setMediaCaption('');
        setShowMediaModal(false);
        scrollToBottom(true);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Network error while sending message. Please check server log.');
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  // Dispatch Approved Meta Template Message
  const handleSendTemplateMessage = async (e) => {
    e.preventDefault();
    if (!activeChat || !selectedTemplate) return;

    setSending(true);
    try {
      const varsArray = selectedTemplate.vars.map((vKey) => templateVarValues[vKey] || 'Val');

      const response = await fetch('/api/send-whatsapp-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: activeChat.id,
          recipient_phone: activeChat.phone_number,
          message_type: 'template',
          template_name: selectedTemplate.name,
          template_language: selectedTemplate.language,
          template_variables: varsArray,
          agent_name: currentUser.name || 'TripGod Support'
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        alert(`Failed to dispatch Meta Template: ${resData.error || 'Unknown error'}`);
      } else {
        setShowTemplateModal(false);
        setTemplateVarValues({});
        scrollToBottom(true);
      }
    } catch (err) {
      alert('Error sending template message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSelectQuickReply = (presetText) => {
    setReplyText(presetText);
    setShowQuickReplies(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Size checks
      if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds maximum WhatsApp API limit of 50 MB.');
        return;
      }
      setSelectedFile(file);
      setShowMediaModal(true);
    }
  };

  const handleToggleStarChat = async (chat) => {
    const newStatus = chat.status === 'starred' ? 'open' : 'starred';
    await supabase.from('whatsapp_chats').update({ status: newStatus }).eq('id', chat.id);
    setChats(chats.map((c) => (c.id === chat.id ? { ...c, status: newStatus } : c)));
    if (activeChat?.id === chat.id) {
      setActiveChat({ ...activeChat, status: newStatus });
    }
  };

  // Filtered Chats
  const filteredChats = chats.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      c.customer_name?.toLowerCase().includes(query) ||
      c.phone_number?.includes(query) ||
      c.last_message?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeFilter === 'unread') return c.unread_count > 0;
    if (activeFilter === 'starred') return c.status === 'starred';
    if (activeFilter === 'cart_leads') return c.status === 'abandoned_cart' || c.metadata?.is_cart_lead;
    if (activeFilter === 'closed') return c.status === 'closed';

    return true;
  });

  const activeWindowStatus = activeChat ? getWindowStatus(activeChat.window_expires_at) : { active: true };

  return (
    <div className="flex flex-col h-[100dvh] lg:h-[calc(100vh-80px)] bg-slate-950 text-slate-100 font-sans rounded-none lg:rounded-3xl overflow-hidden border-0 lg:border border-slate-800 shadow-2xl">
      
      {/* Top Header Status Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Meta WhatsApp Cloud API Live
          </div>
          <span className="hidden sm:inline text-slate-400 font-medium">| Official Number: +91 94105 72857</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-bold text-xs shadow-md hover:scale-105 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all text-xs font-semibold ${
              soundEnabled ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            {soundEnabled ? 'Sound On' : 'Muted'}
          </button>
          
          <button 
            onClick={fetchChats}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
            title="Refresh Chats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container (Split Screen Layout) */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* LEFT COLUMN: Chat List & Search Filter */}
        <div className={`w-full lg:w-96 bg-slate-900/60 border-r border-slate-800 flex flex-col transition-all ${
          isMobileViewActiveChat ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Search & New Chat Trigger */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {[
                { id: 'all', label: 'All Chats' },
                { id: 'unread', label: 'Unread' },
                { id: 'cart_leads', label: '🛒 Cart Leads' },
                { id: 'starred', label: '⭐ Starred' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                    activeFilter === f.id
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin">
            {loadingChats ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading WhatsApp conversations...</div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No chats found matching filter.
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = activeChat?.id === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveChat(chat);
                      setIsMobileViewActiveChat(true);
                    }}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-800/40 relative ${
                      isActive ? 'bg-orange-500/10 border-l-4 border-orange-500' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-orange-400 font-black text-sm border border-slate-700">
                        {chat.customer_name ? chat.customer_name.substring(0, 2).toUpperCase() : 'WA'}
                      </div>
                      {chat.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold animate-bounce shadow-md">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>

                    {/* Chat Content Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-100 truncate">
                          {chat.customer_name || chat.phone_number}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mb-1">
                        {chat.last_message || 'Media message'}
                      </p>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono">
                          +{chat.phone_number}
                        </span>

                        {chat.status === 'abandoned_cart' && (
                          <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            🛒 Abandoned Cart
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Messages & Reply Bar */}
        {activeChat ? (
          <div className={`flex-1 flex flex-col bg-slate-950 transition-all ${
            isMobileViewActiveChat ? 'flex' : 'hidden lg:flex'
          }`}>
            
            {/* Chat Top Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setIsMobileViewActiveChat(false)}
                  className="lg:hidden p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-extrabold text-xs shadow-md">
                  {activeChat.customer_name ? activeChat.customer_name.substring(0, 2).toUpperCase() : 'CU'}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate flex items-center gap-2">
                    {activeChat.customer_name}
                    {activeChat.status === 'starred' && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="font-mono">+{activeChat.phone_number}</span>
                    <span>•</span>
                    <span className={`font-semibold ${activeWindowStatus.active ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activeWindowStatus.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                {!activeWindowStatus.active && (
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Send Template</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleStarChat(activeChat)}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                    activeChat.status === 'starred'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Star Conversation"
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Info & Linked Bookings Ribbon */}
            {linkedBookings.length > 0 && (
              <div className="px-4 py-2 bg-gradient-to-r from-orange-950/40 to-slate-900 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-orange-400 font-bold">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Linked Booking: {linkedBookings[0].service_type} ({linkedBookings[0].travel_date})</span>
                </div>
                <div className="text-slate-300 font-extrabold">
                  Paid: ₹{linkedBookings[0].amount_paid} | Balance: ₹{linkedBookings[0].remaining_amount}
                </div>
              </div>
            )}

            {/* Message Stream Area */}
            <div 
              ref={messageContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] scrollbar-thin"
            >
              {loadingMessages ? (
                <div className="text-center py-12 text-slate-500 text-xs">Loading message history...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No messages yet. Send a message to start conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isInbound = msg.direction === 'inbound';
                  const isLocation = msg.message_type === 'location' || msg.content?.includes('📍 Location:');

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-3xl text-xs shadow-lg space-y-1.5 ${
                        isInbound
                          ? 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-sm'
                          : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-sm'
                      }`}>
                        
                        {/* Sender Label */}
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-semibold">
                          <span>{msg.sender_name || (isInbound ? activeChat.customer_name : 'Support Agent')}</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Rich Media Display with Lightbox & Players */}
                        {msg.media_url ? (() => {
                          const displayMediaUrl = (msg.media_url.includes('facebook.com') || msg.media_url.includes('fbsbx.com'))
                            ? `/api/whatsapp-media-proxy?url=${encodeURIComponent(msg.media_url)}`
                            : msg.media_url;

                          const isImage = msg.message_type === 'image' || msg.media_mime_type?.startsWith('image/');
                          const isVideo = msg.message_type === 'video' || msg.media_mime_type?.startsWith('video/');
                          const isAudio = msg.message_type === 'audio' || msg.message_type === 'voice' || msg.media_mime_type?.startsWith('audio/');

                          return (
                            <div className="my-1 rounded-2xl overflow-hidden border border-black/20 max-w-sm bg-black/20">
                              {isImage ? (
                                <div 
                                  onClick={() => setLightboxImageUrl(displayMediaUrl)}
                                  className="relative group cursor-pointer overflow-hidden rounded-xl"
                                >
                                  <img
                                    src={displayMediaUrl}
                                    alt="Attachment"
                                    className="w-full max-h-60 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      if (!e.target.src.includes('/api/whatsapp-media-proxy')) {
                                        e.target.src = `/api/whatsapp-media-proxy?url=${encodeURIComponent(msg.media_url)}`;
                                      }
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                                    <Maximize2 className="w-4 h-4" /> Click to Expand
                                  </div>
                                </div>
                              ) : isVideo ? (
                                <video src={displayMediaUrl} controls className="w-full max-h-60 rounded-xl" />
                              ) : isAudio ? (
                                <div className="p-2 bg-black/30 rounded-xl flex items-center gap-2">
                                  <Volume2 className="w-5 h-5 text-orange-400 shrink-0" />
                                  <audio src={displayMediaUrl} controls className="w-full h-8" />
                                </div>
                              ) : (
                                <div className="p-3 bg-black/30 rounded-xl flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-5 h-5 text-orange-400 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-bold text-white truncate text-xs">PDF Document / Voucher</p>
                                      <p className="text-[10px] text-slate-400 font-mono">{msg.media_mime_type || 'application/pdf'}</p>
                                    </div>
                                  </div>
                                  <a
                                    href={displayMediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                    title="View / Download Document"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          // Fallback if media expired or archived
                          msg.message_type !== 'text' && msg.message_type !== 'template' && msg.message_type !== 'location' && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 text-slate-400 rounded-xl text-[11px] font-bold border border-slate-700">
                              <Layers className="w-3.5 h-3.5 text-amber-400" />
                              <span>📦 Attachment Archived / Media Handled</span>
                            </div>
                          )
                        )}

                        {/* Text Message Content */}
                        {isLocation ? (
                          <div className="space-y-1.5">
                            <p className="whitespace-pre-wrap leading-relaxed text-[12.5px] font-normal">{msg.content}</p>
                            {msg.content.includes('https://') && (
                              <a
                                href={msg.content.match(/https:\/\/[^\s)]+/)?.[0] || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all"
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                Open Map Location
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed text-[12.5px] font-normal">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Expired Service Window Alert Banner */}
            {!activeWindowStatus.active && (
              <div className="p-3 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between gap-3 text-amber-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>24-Hour Customer Service Window Expired. Free-text locked by Meta API rules.</span>
                </div>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 transition-all"
                >
                  Select Approved Template
                </button>
              </div>
            )}

            {/* Quick Replies Drawer */}
            <AnimatePresence>
              {showQuickReplies && activeWindowStatus.active && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 shrink-0">
                    ⚡ Quick Answers:
                  </span>
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr.id}
                      onClick={() => handleSelectQuickReply(qr.text)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-orange-500/20 hover:border-orange-500/40 border border-slate-700 text-slate-200 text-xs font-semibold rounded-2xl whitespace-nowrap transition-all shrink-0"
                    >
                      {qr.title}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
              <button
                type="button"
                disabled={!activeWindowStatus.active}
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className={`p-2.5 rounded-2xl border transition-all ${
                  showQuickReplies
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white disabled:opacity-40'
                }`}
                title="Open Quick Replies"
              >
                <Zap className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={!activeWindowStatus.active}
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-2xl transition-all disabled:opacity-40"
                title="Attach Image, PDF, Video or Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf,video/mp4,audio/*"
                className="hidden"
              />

              <input
                type="text"
                disabled={!activeWindowStatus.active}
                placeholder={activeWindowStatus.active ? "Type your WhatsApp message reply..." : "24h Window Expired — Use Approved Template above..."}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={sending || !activeWindowStatus.active || (!replyText.trim() && !selectedFile)}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {sending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-950 text-slate-500 text-xs">
            Select a conversation from the left or click "New Chat" to start live support.
          </div>
        )}
      </div>

      {/* NEW CHAT MODAL */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-orange-400" /> Start New WhatsApp Chat
                </h3>
                <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStartNewChat} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Customer WhatsApp Number</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300 font-mono font-bold">+91</span>
                    <input
                      type="text"
                      required
                      placeholder="9837371137"
                      value={newChatPhone}
                      onChange={(e) => setNewChatPhone(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-2xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-lg"
                  >
                    Open Conversation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APPROVED TEMPLATE SELECTION MODAL */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Meta Approved Template Messages
                </h3>
                <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400">Select Template</label>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {APPROVED_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedTemplate.id === tmpl.id
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <h4 className="font-extrabold text-xs">{tmpl.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tmpl.description}</p>
                    </div>
                  ))}
                </div>

                {/* Variables Inputs */}
                {selectedTemplate.vars.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-[10px] font-black uppercase text-slate-400">Fill Template Variables</label>
                    {selectedTemplate.vars.map((vKey) => (
                      <div key={vKey} className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold min-w-24 text-[11px]">{vKey}:</span>
                        <input
                          type="text"
                          placeholder={`Enter ${vKey}...`}
                          value={templateVarValues[vKey] || ''}
                          onChange={(e) => setTemplateVarValues({ ...templateVarValues, [vKey]: e.target.value })}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendTemplateMessage}
                  disabled={sending}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-2xl shadow-lg flex items-center gap-1.5"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Template Message'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEDIA UPLOAD PREVIEW MODAL */}
      <AnimatePresence>
        {showMediaModal && selectedFile && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white">Attach File to WhatsApp</h3>
                <button onClick={() => setShowMediaModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                <p className="font-bold text-orange-400 truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                </p>
              </div>

              <input
                type="text"
                placeholder="Add optional caption..."
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none"
              />

              {uploadProgress > 0 && (
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold rounded-2xl shadow-lg"
                >
                  {sending ? 'Uploading...' : 'Send File'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN LIGHTBOX IMAGE VIEWER */}
      <AnimatePresence>
        {lightboxImageUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="absolute top-4 right-4 p-3 bg-slate-800/80 text-white rounded-full hover:bg-slate-700 transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            >
              <img src={lightboxImageUrl} alt="Full view" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
              <a
                href={lightboxImageUrl}
                download="whatsapp_image.jpg"
                target="_blank"
                rel="noreferrer"
                className="mt-4 px-6 py-2 bg-orange-500 text-white font-bold text-xs rounded-full flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg"
              >
                <Download className="w-4 h-4" /> Download Original Image
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
