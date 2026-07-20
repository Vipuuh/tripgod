import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, ShoppingBag, Building2, Waves, Bike, MapPin, Users, Image, 
  Trash2, Edit, Plus, LogOut, Search, Filter, ShieldCheck, ChevronRight,
  TrendingUp, CircleDollarSign, Check, X, PlusCircle, Sparkles, MapPinned,
  LayoutDashboard, GripVertical, Star
} from 'lucide-react';
import { supabase } from '../supabase';
import RetargetingTab from './RetargetingTab';
import ReviewsSection from './ReviewsSection';

const getSimpleBookingId = (id) => {
  if (!id) return 'TG-000000';
  if (id.includes('-') || id.length >= 32) {
    const cleanHex = id.replace(/-/g, '').substring(0, 8);
    const num = parseInt(cleanHex, 16);
    if (!isNaN(num)) {
      return `TG-${String(num).slice(-6)}`;
    }
  }
  const cleanStr = id.replace(/[^a-zA-Z0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < cleanStr.length; i++) {
    hash = (hash << 5) - hash + cleanStr.charCodeAt(i);
    hash = hash & hash;
  }
  return `TG-${String(Math.abs(hash)).slice(-6)}`;
};

const STANDARD_ADVENTURE_NAMES = {
  rafting: [
    "12 KM Rafting",
    "16 KM Rafting",
    "24 KM Rafting",
    "36 KM Rafting"
  ],
  swing: [
    "GIANT SWING RISHIKESH",
    "GIANT SWING COUPLE RISHIKESH"
  ],
  paragliding: [
    "PARAGLIDING IN RISHIKESH",
    "PARAGLIDING 15-20 MINS TANDEM"
  ],
  zipline: [
    "ZIPLINE OVER GANGA RISHIKESH",
    "GANGA ZIPLINE SOLO"
  ],
  camping: [
    "RIVERSIDE CAMPING RISHIKESH",
    "SWISS LUXURY CAMPING SHIVPURI"
  ],
  bungee: [
    "BUNGEE JUMPING 83M RISHIKESH",
    "BUNGEE JUMPING 101M RISHIKESH",
    "BUNGEE JUMPING 104M RISHIKESH",
    "BUNGEE JUMPING 117M RISHIKESH"
  ]
};

export default function AdminDashboard({ setRoute }) {
  // Authentication States
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('analytics');
  const [adventureTypeFilter, setAdventureTypeFilter] = useState('all');

  // Database Resource States
  const [cities, setCities] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [raftingList, setRaftingList] = useState([]);
  const [bikesList, setBikesList] = useState([]);
  const [toursList, setToursList] = useState([]);
  const [mediaList, setMediaList] = useState([]);

  // Data Fetching State
  const [loading, setLoading] = useState(true);

  // Form / Editor States
  const [editingItem, setEditingItem] = useState(null); // { type, data }
  const [showFormModal, setShowFormModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Multi-upload/Library state
  const [mediaUploading, setMediaUploading] = useState(false);

  // City and Vendor Form Temporary States
  const [newCityName, setNewCityName] = useState('');
  const [newCitySlug, setNewCitySlug] = useState('');
  const [newVendor, setNewVendor] = useState({
    name: '', category: 'Hotel', phone: '', whatsapp: '', address: '', commission_percentage: 10, status: 'Active',
    shop_image: '', star_rating: 4.5, landmark: '',
    since: 2020, bookings_count: 50, google_maps_link: '', meeting_instructions: '',
    reporting_time: '', parking_details: '', badges: '', short_highlight: ''
  });

  // Filter States for Bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingServiceFilter, setBookingServiceFilter] = useState('all');

  // Check Auth Session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAdmin(true);
        setAdminEmail(session.user.email);
        fetchAllData();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Fetch all resources from Supabase
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        { data: citiesData },
        { data: vendorsData },
        { data: bookingsData },
        { data: hotelsData },
        { data: raftingData },
        { data: bikesData },
        { data: toursData }
      ] = await Promise.all([
        supabase.from('cities').select('*').order('name'),
        supabase.from('vendors').select('*').order('name'),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('hotels').select('*').order('name'),
        supabase.from('rafting').select('*').order('name'),
        supabase.from('bikes').select('*').order('name'),
        supabase.from('tours').select('*').order('name')
      ]);

      if (citiesData) setCities(citiesData);
      if (vendorsData) setVendors(vendorsData);
      if (bookingsData) setBookings(bookingsData);
      if (hotelsData) setHotels(hotelsData);
      if (raftingData) setRaftingList(raftingData);
      if (bikesData) setBikesList(bikesData);
      if (toursData) setToursList(toursData);

      // Fetch images from media bucket
      fetchMediaFiles();
    } catch (err) {
      console.error('Error fetching database data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from('media').list('listings', {
        limit: 100,
        sortBy: { column: 'name', order: 'desc' }
      });
      if (error) throw error;
      if (data) {
        const urls = data.map(file => {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(`listings/${file.name}`);
          return { name: file.name, url: publicUrl };
        });
        setMediaList(urls);
      }
    } catch (err) {
      console.error('Error listing media bucket files:', err);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all fields.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      if (error) throw error;
      if (data.session) {
        setIsAdmin(true);
        setAdminEmail(data.session.user.email);
        fetchAllData();
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminEmail('');
    setRoute('home');
  };

  // Upload file to bucket
  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setMediaUploading(true);

    try {
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const randName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
        const filePath = `listings/${randName}`;

        const { error } = await supabase.storage.from('media').upload(filePath, file);
        if (error) throw error;
      }
      fetchMediaFiles();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setMediaUploading(false);
    }
  };

  // Delete media file
  const handleMediaDelete = async (fileName) => {
    if (!window.confirm('Delete this image from storage?')) return;
    try {
      const { error } = await supabase.storage.from('media').remove([`listings/${fileName}`]);
      if (error) throw error;
      fetchMediaFiles();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Add City Handler
  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCityName || !newCitySlug) return;
    try {
      const { error } = await supabase.from('cities').insert({
        name: newCityName,
        slug: newCitySlug.toLowerCase().replace(/\s+/g, '-')
      });
      if (error) throw error;
      setNewCityName('');
      setNewCitySlug('');
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Resource Handler
  const handleDeleteResource = async (table, id) => {
    if (!window.confirm(`Are you sure you want to delete this listing?`)) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Rafting/Activity Stretch Handler (Deletes all operator rows for a stretch/activity)
  const handleDeleteActivityModel = async (groupedItem) => {
    const confirmMsg = `Are you sure you want to delete "${groupedItem.name}" and all its ${groupedItem.operators.length} operators?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const idsToDelete = groupedItem.operators.map(op => op.id);
      const { error } = await supabase.from('rafting').delete().in('id', idsToDelete);
      if (error) throw error;
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Tour Model Handler (Deletes all operator rows for a tour)
  const handleDeleteTourModel = async (groupedItem) => {
    const confirmMsg = `Are you sure you want to delete the tour package "${groupedItem.name}" and all its ${groupedItem.operators.length} operators?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const idsToDelete = groupedItem.operators.map(op => op.id);
      const { error } = await supabase.from('tours').delete().in('id', idsToDelete);
      if (error) throw error;
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Bike Model Handler (Deletes all vendor listings for a bike name/model)
  const handleDeleteBikeModel = async (groupedItem) => {
    const confirmMsg = `Are you sure you want to delete "${groupedItem.name}" and all its ${groupedItem.operators.length} vendors?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const idsToDelete = groupedItem.operators.map(op => op.id);
      const { error } = await supabase.from('bikes').delete().in('id', idsToDelete);
      if (error) throw error;
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add/Edit Vendor Handler
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      const vendorData = {
        ...newVendor,
        since: newVendor.since ? Number(newVendor.since) : 2020,
        bookings_count: newVendor.bookings_count ? Number(newVendor.bookings_count) : 50,
        badges: typeof newVendor.badges === 'string'
          ? newVendor.badges.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(newVendor.badges) ? newVendor.badges : [])
      };

      if (editingItem && editingItem.type === 'vendor') {
        const { error } = await supabase.from('vendors').update(vendorData).eq('id', editingItem.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vendors').insert(vendorData);
        if (error) throw error;
      }
      setNewVendor({
        name: '', category: 'Hotel', phone: '', whatsapp: '', address: '', commission_percentage: 10, status: 'Active',
        shop_image: '', star_rating: 4.5, landmark: '',
        since: 2020, bookings_count: 50, google_maps_link: '', meeting_instructions: '',
        reporting_time: '', parking_details: '', badges: '', short_highlight: ''
      });
      setEditingItem(null);
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
      if (error) throw error;
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // =========================================================================
  // RENDER: LOGIN SCREEN
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] bg-[#0B0C10] flex items-center justify-center px-6 py-16 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)] space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 text-xs font-black uppercase tracking-widest rounded-full">
              <ShieldCheck size={12} /> SECURE GATEWAY
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase font-display">
              TRIPGOD <span className="text-accent">ADMIN</span>
            </h1>
            <p className="text-gray-400 text-xs font-medium">Authorized control panel access only.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Email Address</label>
              <input 
                type="email" 
                required 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F00] focus:ring-1 focus:ring-[#FF5F00]"
                placeholder="admin@tripgod.in"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Password</label>
              <input 
                type="password" 
                required 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF5F00] focus:ring-1 focus:ring-[#FF5F00]"
                placeholder="••••••••••••"
              />
            </div>

            {loginError && (
              <p className="text-red-500 text-[11px] font-bold text-center pt-1">{loginError}</p>
            )}

            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full py-4 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_8px_20px_rgba(255,95,0,0.25)] hover:scale-[1.01] hover:-translate-y-0.5 transition-all border-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: LOADING STATE
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-[80vh] bg-[#0B0C10] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-t-[#FF5F00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <span className="text-xs uppercase font-black tracking-widest text-[#FF5F00]">Loading Dashboard...</span>
      </div>
    );
  }

  // =========================================================================
  // ANALYTICS CALCULATIONS
  // =========================================================================
  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((acc, curr) => acc + Number(curr.amount_paid) + Number(curr.remaining_amount), 0);
  const totalCommissions = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((acc, curr) => acc + Number(curr.commission_earned), 0);
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const activeVendorsCount = vendors.filter(v => v.status === 'Active').length;

  // bookings grouped by vendor
  const vendorBookingsSum = vendors.map(v => {
    const vBookings = bookings.filter(b => b.vendor_id === v.id && b.status !== 'cancelled');
    const rev = vBookings.reduce((sum, b) => sum + Number(b.amount_paid) + Number(b.remaining_amount), 0);
    const comm = vBookings.reduce((sum, b) => sum + Number(b.commission_earned), 0);
    return { name: v.name, count: vBookings.length, revenue: rev, commission: comm };
  }).sort((a,b) => b.revenue - a.revenue);

  // bookings grouped by city
  const cityBookingsSum = cities.map(c => {
    const cBookings = bookings.filter(b => b.city_id === c.id && b.status !== 'cancelled');
    const rev = cBookings.reduce((sum, b) => sum + Number(b.amount_paid) + Number(b.remaining_amount), 0);
    return { name: c.name, count: cBookings.length, revenue: rev };
  }).sort((a,b) => b.revenue - a.revenue);


  // =========================================================================
  // BOOKINGS FILTERS APPLICATION
  // =========================================================================
  const filteredBookings = bookings.filter(b => {
    const searchString = `${b.customer_name} ${b.customer_phone} ${b.customer_email} ${b.id} ${getSimpleBookingId(b.id)}`.toLowerCase();
    const matchesSearch = searchString.includes(bookingSearch.toLowerCase());
    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    const matchesService = bookingServiceFilter === 'all' || b.service_type === bookingServiceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  return (
    <div className="min-h-[90vh] bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo / Header */}
          <div className="flex items-center gap-2">
            <span className="font-black text-xl text-white">TRIP</span>
            <span className="font-black text-xl text-accent bg-white/10 px-2 py-0.5 rounded border border-white/20">ADMIN</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'analytics', label: 'Analytics', icon: Activity },
              { id: 'bookings', label: 'Bookings', icon: ShoppingBag },
              { id: 'hotels', label: 'Hotels', icon: Building2 },
              { id: 'adventures', label: 'Adventure Packages', icon: Waves },
              { id: 'bikes', label: 'Bike Rentals', icon: Bike },
              { id: 'tours', label: 'Tour Packages', icon: MapPinned },
              { id: 'cities', label: 'Cities List', icon: MapPin },
              { id: 'vendors', label: 'Vendors DB', icon: Users },
              { id: 'retargeting', label: 'Retargeting (Carts)', icon: Sparkles },
              { id: 'reviews', label: 'Customer Reviews DB', icon: Star },
              { id: 'media', label: 'Media Library', icon: Image },
              { id: 'reels', label: 'Customer Reels', icon: Star },
              { id: 'homepage', label: 'Manage Homepage', icon: LayoutDashboard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors text-left border-none cursor-pointer ${activeTab === tab.id ? 'bg-[#FF5F00] text-white shadow-lg shadow-[#FF5F00]/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              >
                <tab.icon size={16} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Admin info & logout */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-accent border border-slate-700">
              A
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Logged in</span>
              <span className="block text-xs font-bold truncate text-slate-300">{adminEmail}</span>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full py-3 bg-red-950/45 hover:bg-red-900/60 border border-red-900/30 text-red-400 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-[90vh]">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">Control Panel</span>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase font-display mt-1">
                {activeTab === 'adventures' ? 'Adventure Packages' : `${activeTab} Management`}
              </h1>
            </div>

            {/* Sub-actions based on tab */}
            <div className="flex items-center gap-3">
              {activeTab === 'adventures' && (
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Type:</span>
                  <select
                    value={adventureTypeFilter}
                    onChange={(e) => setAdventureTypeFilter(e.target.value)}
                    className="bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Adventures</option>
                    <option value="rafting">Rafting</option>
                    <option value="bungee">Bungee Jumping</option>
                    <option value="swing">Giant Swing</option>
                    <option value="paragliding">Paragliding</option>
                    <option value="zipline">Ganga Zipline</option>
                    <option value="camping">Camping</option>
                  </select>
                </div>
              )}

              {['hotels', 'adventures', 'bikes', 'tours'].includes(activeTab) && (
                <button
                  onClick={() => {
                    setEditingItem({ type: activeTab, data: null });
                    setShowFormModal(true);
                  }}
                  className="py-3 px-5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-102 transition-all border-none cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={16} /> <span>Add Listing</span>
                </button>
              )}
            </div>
          </div>

          {/* =================================================================
              TAB CONTENT: ANALYTICS
              ================================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Counter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <CircleDollarSign size={24} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Revenue</span>
                    <span className="block text-2xl font-black text-white mt-1">₹{totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
                  <div className="p-3.5 bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] rounded-xl">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Commission Earned</span>
                    <span className="block text-2xl font-black text-white mt-1">₹{totalCommissions.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Bookings</span>
                    <span className="block text-2xl font-black text-white mt-1">{pendingBookingsCount}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
                  <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Vendors</span>
                    <span className="block text-2xl font-black text-white mt-1">{activeVendorsCount}</span>
                  </div>
                </div>
              </div>

              {/* Grid Tables (Vendors and Cities summary) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vendor bookings */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-accent" /> Vendor Revenue Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-black uppercase text-[10px]">
                          <th className="py-3 px-2">Vendor</th>
                          <th className="py-3 px-2 text-center">Bookings</th>
                          <th className="py-3 px-2 text-right">Revenue</th>
                          <th className="py-3 px-2 text-right">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorBookingsSum.map((v, i) => (
                          <tr key={i} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                            <td className="py-3 px-2 font-bold text-slate-300">{v.name}</td>
                            <td className="py-3 px-2 text-center font-bold text-slate-400">{v.count}</td>
                            <td className="py-3 px-2 text-right font-black text-slate-300">₹{v.revenue.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-2 text-right font-black text-accent">₹{v.commission.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* City Bookings */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={16} className="text-accent" /> City Revenue Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-black uppercase text-[10px]">
                          <th className="py-3 px-2">City</th>
                          <th className="py-3 px-2 text-center">Bookings</th>
                          <th className="py-3 px-2 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cityBookingsSum.map((c, i) => (
                          <tr key={i} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                            <td className="py-3 px-2 font-bold text-slate-300">{c.name}</td>
                            <td className="py-3 px-2 text-center font-bold text-slate-400">{c.count}</td>
                            <td className="py-3 px-2 text-right font-black text-slate-300">₹{c.revenue.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB CONTENT: BOOKINGS
              ================================================================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {/* Filters Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search by customer name, phone, email, or Booking ID..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <div className="flex-1 md:w-40 relative">
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex-1 md:w-40 relative">
                    <select
                      value={bookingServiceFilter}
                      onChange={(e) => setBookingServiceFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-xs focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="all">All Services</option>
                      <option value="Hotel">Hotels</option>
                      <option value="Rafting">Rafting</option>
                      <option value="Bike Rental">Bike Rental</option>
                      <option value="Tour">Tours</option>
                      <option value="Camping">Camping</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                    No bookings found matching filters.
                  </div>
                ) : (
                  filteredBookings.map(b => {
                    const vendor = vendors.find(v => v.id === b.vendor_id);
                    const city = cities.find(c => c.id === b.city_id);

                    return (
                      <div key={b.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm hover:border-slate-700 transition-colors">
                        {/* Upper row */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-slate-900 pb-3">
                          <div>
                            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Booking ID: {getSimpleBookingId(b.id)}</span>
                            <h4 className="font-black text-sm text-slate-200 mt-0.5">{b.customer_name}</h4>
                          </div>

                          <div className="flex gap-2">
                            <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border ${b.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : b.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                              {b.status}
                            </span>
                            <span className="px-3 py-1 bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase rounded-full">
                              {b.service_type}
                            </span>
                          </div>
                        </div>

                        {/* Mid Grid columns */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="block text-[9px] font-black text-slate-500 uppercase">Contact Info</span>
                            <span className="block font-bold text-slate-300 mt-0.5">{b.customer_phone}</span>
                            <span className="block font-bold text-slate-400 mt-0.5 truncate">{b.customer_email}</span>
                          </div>

                          <div>
                            <span className="block text-[9px] font-black text-slate-500 uppercase">Dates</span>
                            <span className="block font-bold text-slate-300 mt-0.5">Travel: {new Date(b.travel_date).toLocaleDateString('en-IN')}</span>
                            <span className="block font-bold text-slate-500 mt-0.5">Booked: {new Date(b.booking_date).toLocaleDateString('en-IN')}</span>
                          </div>

                          <div>
                            <span className="block text-[9px] font-black text-slate-500 uppercase">Vendor & City</span>
                            <span className="block font-bold text-slate-300 mt-0.5">{vendor?.name || 'Unknown Vendor'}</span>
                            <span className="block font-bold text-slate-400 mt-0.5">{city?.name || 'Unknown City'}</span>
                          </div>

                          <div>
                            <span className="block text-[9px] font-black text-slate-500 uppercase">Amounts</span>
                            <span className="block font-black text-emerald-400 mt-0.5">Paid Advance: ₹{b.amount_paid}</span>
                            <span className="block font-black text-amber-400 mt-0.5">Collect Offline: ₹{b.remaining_amount}</span>
                            <span className="block font-black text-accent mt-0.5">Commission (Earned): ₹{b.commission_earned}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        {b.status === 'pending' && (
                          <div className="pt-2 border-t border-slate-900 flex justify-end gap-2.5">
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                              className="py-1.5 px-3 bg-emerald-950/45 hover:bg-emerald-900/60 border border-emerald-900/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                              className="py-1.5 px-3 bg-red-950/45 hover:bg-red-900/60 border border-red-900/30 text-red-400 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'retargeting' && (
            <RetargetingTab />
          )}

          {['hotels', 'adventures', 'bikes', 'tours'].includes(activeTab) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Render items based on activeTab */}
              {(() => {
                const list = 
                  activeTab === 'hotels' ? hotels :
                  activeTab === 'adventures' ? (() => {
                    let filtered = raftingList;
                    if (adventureTypeFilter !== 'all') {
                      filtered = raftingList.filter(item => (item.activity_type || 'rafting') === adventureTypeFilter);
                    }
                    return groupActivitiesByName(filtered);
                  })() :
                  activeTab === 'bikes' ? groupBikesByName(bikesList) :
                  activeTab === 'tours' ? groupToursByName(toursList) : [];

                if (list.length === 0) {
                  return (
                    <div className="col-span-full bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                      No listings found. Click "Add Listing" to create one.
                    </div>
                  );
                }

                return list.map(item => {
                  const city = cities.find(c => c.id === item.city_id);
                  const vendor = vendors.find(v => v.id === item.vendor_id);
                  const thumbnail = item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=600';

                  return (
                    <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                      <div>
                        {/* Thumbnail image */}
                        <div className="h-44 bg-slate-900 relative">
                          <img src={thumbnail} alt={item.name} className="w-full h-full object-cover" />
                          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-xs text-accent text-xs font-black py-0.5 px-2.5 rounded border border-accent/25">
                            {['adventures', 'bikes', 'tours'].includes(activeTab) ? `From ₹${item.price}` : (item.price === 0 ? 'Free' : `₹${item.price}`)}
                          </div>
                        </div>

                        {/* Text info */}
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-base text-white font-display truncate leading-snug pr-4">{item.name}</h4>
                            {activeTab === 'adventures' && (
                              <span className="inline-block text-[9px] bg-slate-900 border border-slate-800 text-[#FF5F00] font-black px-2 py-0.5 rounded uppercase shrink-0">
                                {item.activity_type || 'rafting'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="inline-flex items-center gap-1 text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded">
                              <MapPin size={10} /> {city?.name || 'No City'}
                            </span>
                            {['adventures', 'bikes', 'tours'].includes(activeTab) ? (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-slate-900 border border-slate-800 text-[#FF5F00] font-bold px-2 py-0.5 rounded">
                                <Users size={10} /> {item.operators?.length || 0} Vendors
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-slate-900 border border-slate-800 text-[#FF5F00] font-bold px-2 py-0.5 rounded">
                                <Users size={10} /> {vendor?.name || 'No Vendor'}
                              </span>
                            )}
                          </div>
                          
                          {['adventures', 'bikes', 'tours'].includes(activeTab) && item.operators && (
                            <div className="text-[9px] text-slate-500 font-medium pt-1 max-h-16 overflow-y-auto no-scrollbar">
                              <span className="font-bold text-slate-400">Crews/Vendors: </span>
                              {item.operators.map((op, idx) => {
                                const v = vendors.find(ven => ven.id === op.vendor_id);
                                return (
                                  <span key={op.id}>
                                    {v?.name || 'Local'} (₹{op.price})
                                    {idx < item.operators.length - 1 ? ', ' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-3 pt-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="p-4 border-t border-slate-900 flex justify-end gap-2.5">
                        <button
                          onClick={() => {
                            setEditingItem({ type: activeTab, data: item });
                            setShowFormModal(true);
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                        >
                          <Edit size={14} />
                        </button>
                        {activeTab === 'adventures' ? (
                          <button
                            onClick={() => handleDeleteActivityModel(item)}
                            className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : activeTab === 'bikes' ? (
                          <button
                            onClick={() => handleDeleteBikeModel(item)}
                            className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : activeTab === 'tours' ? (
                          <button
                            onClick={() => handleDeleteTourModel(item)}
                            className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteResource(activeTab, item.id)}
                            className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* =================================================================
              TAB CONTENT: CITIES
              ================================================================= */}
          {activeTab === 'cities' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Left Column: Add City form */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle size={16} className="text-accent" /> Add New City
                </h3>
                <form onSubmit={handleAddCity} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">City Name</label>
                    <input
                      type="text"
                      required
                      value={newCityName}
                      onChange={(e) => {
                        setNewCityName(e.target.value);
                        setNewCitySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                      }}
                      placeholder="e.g. Haridwar"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">URL Slug</label>
                    <input
                      type="text"
                      required
                      value={newCitySlug}
                      onChange={(e) => setNewCitySlug(e.target.value)}
                      placeholder="e.g. haridwar"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-none cursor-pointer"
                  >
                    Create City
                  </button>
                </form>
              </div>

              {/* Right Column: List of existing cities */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:col-span-2 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={16} className="text-accent" /> Configured Cities
                </h3>
                <div className="divide-y divide-slate-900">
                  {cities.map(c => (
                    <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200">{c.name}</span>
                        <span className="block text-[10px] text-slate-500 font-medium mt-0.5">Slug: {c.slug}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteResource('cities', c.id)}
                        className="p-1.5 bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB CONTENT: VENDORS
              ================================================================= */}
          {activeTab === 'vendors' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Vendor Form (Add / Edit) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  {editingItem && editingItem.type === 'vendor' ? <Edit size={16} className="text-accent" /> : <PlusCircle size={16} className="text-accent" />}
                  {editingItem && editingItem.type === 'vendor' ? 'Edit Vendor Profile' : 'Onboard New Vendor'}
                </h3>
                <form onSubmit={handleSaveVendor} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Company / Vendor Name</label>
                    <input
                      type="text"
                      required
                      value={newVendor.name}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Shivpuri Rafting Co."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Service Category</label>
                      <select
                        value={newVendor.category}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="Hotel">Hotel</option>
                        <option value="Rafting">Rafting</option>
                        <option value="Bungee">Bungee Jumping</option>
                        <option value="Giant Swing">Giant Swing</option>
                        <option value="Paragliding">Paragliding</option>
                        <option value="Zipline">Ganga Zipline</option>
                        <option value="Bike Rental">Bike Rental</option>
                        <option value="Tour">Tour Package</option>
                        <option value="Camping">Camping</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Commission (%)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={newVendor.commission_percentage}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, commission_percentage: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Mobile Number</label>
                      <input
                        type="text"
                        required
                        value={newVendor.phone}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. 8630027341"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">WhatsApp Number</label>
                      <input
                        type="text"
                        required
                        value={newVendor.whatsapp}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="e.g. 8630027341"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Vendor Address</label>
                    <textarea
                      required
                      rows="2"
                      value={newVendor.address}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g. Badrinath Rd, Shivpuri, Rishikesh"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Shop Photo</label>
                    {newVendor.shop_image && (
                      <img src={newVendor.shop_image} alt="Shop" className="w-20 h-20 rounded-xl object-cover border border-slate-800 mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const ext = file.name.split('.').pop();
                        const randName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
                        const filePath = `vendors/${randName}`;
                        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
                        if (uploadError) { alert('Upload failed: ' + uploadError.message); return; }
                        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
                        setNewVendor(prev => ({ ...prev, shop_image: urlData.publicUrl }));
                      }}
                      className="text-slate-300 text-xs w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#FF5F00]/10 file:text-[#FF5F00] hover:file:bg-[#FF5F00]/20 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Star Rating (1.0 - 5.0)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={newVendor.star_rating}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, star_rating: parseFloat(e.target.value) || 4.5 }))}
                        placeholder="4.5"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Landmark / Location</label>
                      <input
                        type="text"
                        value={newVendor.landmark}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, landmark: e.target.value }))}
                        placeholder="e.g. Tapovan, Near Laxman Jhula"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Since (Year)</label>
                      <input
                        type="number"
                        value={newVendor.since}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, since: parseInt(e.target.value) || 2020 }))}
                        placeholder="e.g. 2018"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Bookings Count</label>
                      <input
                        type="number"
                        value={newVendor.bookings_count}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, bookings_count: parseInt(e.target.value) || 50 }))}
                        placeholder="e.g. 150"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Google Maps Link</label>
                    <input
                      type="text"
                      value={newVendor.google_maps_link}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, google_maps_link: e.target.value }))}
                      placeholder="https://google.com/maps/..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Badges (Comma separated)</label>
                      <input
                        type="text"
                        value={newVendor.badges}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, badges: e.target.value }))}
                        placeholder="e.g. Verified Operator, Best Price"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Short Highlight</label>
                      <input
                        type="text"
                        value={newVendor.short_highlight}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, short_highlight: e.target.value }))}
                        placeholder="e.g. Certified guides, DSLR free"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Reporting Time</label>
                      <input
                        type="text"
                        value={newVendor.reporting_time}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, reporting_time: e.target.value }))}
                        placeholder="e.g. 09:00 AM - 08:00 PM"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Parking Details</label>
                      <input
                        type="text"
                        value={newVendor.parking_details}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, parking_details: e.target.value }))}
                        placeholder="e.g. Customer parking available"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Meeting Instructions</label>
                    <textarea
                      rows="2"
                      value={newVendor.meeting_instructions}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, meeting_instructions: e.target.value }))}
                      placeholder="Please report at the office with DL..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-accent resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Status</label>
                    <select
                      value={newVendor.status}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-none cursor-pointer"
                    >
                      {editingItem && editingItem.type === 'vendor' ? 'Save Changes' : 'Onboard Vendor'}
                    </button>
                    
                    {editingItem && editingItem.type === 'vendor' && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewVendor({
                            name: '', category: 'Hotel', phone: '', whatsapp: '', address: '', commission_percentage: 10, status: 'Active',
                            shop_image: '', star_rating: 4.5, landmark: '',
                            since: 2020, bookings_count: 50, google_maps_link: '', meeting_instructions: '',
                            reporting_time: '', parking_details: '', badges: '', short_highlight: ''
                          });
                          setEditingItem(null);
                        }}
                        className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-black text-xs uppercase rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Vendors List Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={16} className="text-accent" /> Registered Vendors Database
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-black uppercase text-[10px]">
                        <th className="py-3 px-2">Photo</th>
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Category</th>
                        <th className="py-3 px-2">Landmark</th>
                        <th className="py-3 px-2">Contact</th>
                        <th className="py-3 px-2 text-center">Rating</th>
                        <th className="py-3 px-2 text-center">Comm. %</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map(v => (
                        <tr key={v.id} className="border-b border-slate-900 hover:bg-slate-900/30">
                          <td className="py-3 px-2">
                            {v.shop_image ? (
                              <img src={v.shop_image} alt={v.name} className="w-8 h-8 rounded-lg object-cover border border-slate-800" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-black text-[9px] uppercase">No Img</div>
                            )}
                          </td>
                          <td className="py-3 px-2 font-bold text-slate-200">{v.name}</td>
                          <td className="py-3 px-2 font-bold text-slate-400">{v.category}</td>
                          <td className="py-3 px-2 font-medium text-slate-400 max-w-[120px] truncate" title={v.landmark || v.address}>
                            {v.landmark || <span className="text-slate-600">None</span>}
                          </td>
                          <td className="py-3 px-2 font-medium text-slate-400">
                            <span className="block">{v.phone}</span>
                            <span className="block text-[10px] text-slate-500">WA: {v.whatsapp}</span>
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-amber-500">
                            ⭐ {v.star_rating !== null && v.star_rating !== undefined ? Number(v.star_rating).toFixed(1) : '4.5'}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-slate-300">{v.commission_percentage}%</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${v.status === 'Active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingItem({ type: 'vendor', data: v });
                                  setNewVendor({
                                    ...v,
                                    shop_image: v.shop_image || '',
                                    star_rating: v.star_rating !== null && v.star_rating !== undefined ? v.star_rating : 4.5,
                                    landmark: v.landmark || '',
                                    since: v.since || 2020,
                                    bookings_count: v.bookings_count || 50,
                                    google_maps_link: v.google_maps_link || '',
                                    meeting_instructions: v.meeting_instructions || '',
                                    reporting_time: v.reporting_time || '',
                                    parking_details: v.parking_details || '',
                                    badges: Array.isArray(v.badges) ? v.badges.join(', ') : (v.badges || ''),
                                    short_highlight: v.short_highlight || ''
                                  });
                                }}
                                className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
                              >
                                <Edit size={10} />
                              </button>
                              <button
                                onClick={() => handleDeleteResource('vendors', v.id)}
                                className="p-1 bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 rounded"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB CONTENT: MEDIA LIBRARY
              ================================================================= */}
          {activeTab === 'media' && (
            <div className="space-y-8">
              {/* Uploader Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <div className="max-w-xs mx-auto border border-dashed border-slate-700 hover:border-accent rounded-2xl p-6 relative group transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMediaUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <PlusCircle className="w-8 h-8 text-slate-500 group-hover:text-accent mx-auto transition-colors" />
                    <span className="block text-xs font-bold text-slate-300">Drag & Drop or Click to Upload</span>
                    <span className="block text-[10px] text-slate-500">Supports PNG, JPG, JPEG</span>
                  </div>
                </div>

                {mediaUploading && (
                  <p className="text-xs font-black uppercase text-[#FF5F00] animate-pulse">Uploading files to bucket...</p>
                )}
              </div>

              {/* Grid of files */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {mediaList.map((file, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between group shadow-sm">
                    <div className="h-28 bg-slate-900 relative">
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleMediaDelete(file.name)}
                        className="absolute top-2 right-2 p-1 bg-red-950 border border-red-900 text-red-400 rounded hover:scale-105 transition-transform hidden group-hover:block cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>

                    <div className="p-2 border-t border-slate-900">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(file.url);
                          alert('Copied link successfully!');
                        }}
                        className="w-full py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[9px] font-black uppercase rounded cursor-pointer transition-colors"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MANAGE HOMEPAGE TAB */}
          {activeTab === 'homepage' && (
            <HomepageManager hotels={hotels} toursList={toursList} bikesList={bikesList} />
          )}

          {/* CUSTOMER REELS TAB */}
          {activeTab === 'reels' && (
            <ReelsManager />
          )}

          {/* CUSTOMER REVIEWS MODERATION TAB */}
          {activeTab === 'reviews' && (
            <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black font-display text-slate-900 uppercase">Customer Reviews Moderation</h3>
                  <p className="text-xs text-slate-500 font-medium">Delete fake, inappropriate, or spam customer reviews directly from database</p>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  Admin Control Active
                </span>
              </div>
              <ReviewsSection isAdmin={true} />
            </div>
          )}

        </div>
      </main>

      {/* =========================================================================
          MODAL FORM: ADD / EDIT LISTING (Hotels, Rafting, Bikes, Tours)
          ========================================================================= */}
      <AnimatePresence>
        {showFormModal && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-white uppercase font-display tracking-tight">
                  {editingItem.data ? 'Edit' : 'Create'} {editingItem.type.toUpperCase()} Listing
                </h3>
                <button
                  onClick={() => {
                    setShowFormModal(false);
                    setEditingItem(null);
                  }}
                  className="p-1.5 hover:bg-slate-900 border border-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Dynamic form selector */}
              <ListingForm
                type={editingItem.type}
                data={editingItem.data}
                cities={cities}
                vendors={vendors}
                onClose={() => {
                  setShowFormModal(false);
                  setEditingItem(null);
                  fetchAllData();
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: REELS MANAGER
// =============================================================================
function ReelsManager() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    activity_type: '',
    rating: 5,
    location: 'Rishikesh',
    video_url: '',
    thumbnail_url: '',
    sort_order: 0,
    is_featured: false,
    is_active: true
  });

  const fetchReels = async () => {
    setLoading(true);
    const { data } = await supabase.from('customer_reels').select('*').order('sort_order', { ascending: true });
    if (data) setReels(data);
    setLoading(false);
  };

  useEffect(() => { fetchReels(); }, []);

  const resetForm = () => {
    setForm({ customer_name: '', activity_type: '', rating: 5, location: 'Rishikesh', video_url: '', thumbnail_url: '', sort_order: 0, is_featured: false, is_active: true });
    setEditingReel(null);
    setShowForm(false);
  };

  const handleEdit = (reel) => {
    setEditingReel(reel);
    setForm({ ...reel });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleSave = async () => {
    if (!form.customer_name || !form.video_url) {
      alert('Customer Name aur Video URL required hain!');
      return;
    }
    setSaving(true);
    try {
      if (editingReel) {
        await supabase.from('customer_reels').update(form).eq('id', editingReel.id);
      } else {
        await supabase.from('customer_reels').insert([form]);
      }
      await fetchReels();
      resetForm();
    } catch (err) {
      alert('Error saving reel: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Is reel ko delete karna chahte ho?')) return;
    await supabase.from('customer_reels').delete().eq('id', id);
    await fetchReels();
  };

  const toggleActive = async (reel) => {
    await supabase.from('customer_reels').update({ is_active: !reel.is_active }).eq('id', reel.id);
    await fetchReels();
  };

  const activityOptions = ['Rafting', 'Camping', 'Bungee', 'Paragliding', 'Giant Swing', 'Zipline', 'Hotel Stay', 'Bike Rent', 'Tour Package', 'Kayaking', 'Other'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Customer Review Reels</h2>
          <p className="text-xs text-slate-400 mt-0.5">Home page pe automatically dikhega jab 1+ active reel ho</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF5F00] text-white rounded-xl font-bold text-xs uppercase border-none cursor-pointer hover:bg-[#e55500] transition-colors"
        >
          <Plus size={14} /> Add Reel
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            {editingReel ? 'Edit Reel' : 'New Reel Add Karo'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Customer Name *</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Rahul Sharma" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF5F00]" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Activity Type</label>
              <select value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF5F00]">
                <option value="">Select Activity</option>
                {activityOptions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Video URL * (YouTube ya Direct Link)</label>
              <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtu.be/... ya direct .mp4 URL" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF5F00]" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Thumbnail URL (Optional)</label>
              <input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF5F00]" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Rishikesh" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF5F00]" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Rating (1-5)</label>
              <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF5F00]">
                {[5, 4.5, 4, 3.5, 3].map(r => <option key={r} value={r}>{r} ⭐</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sort Order (chota = pehle)</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF5F00]" />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-[#FF5F00] w-4 h-4" />
                <span className="text-white text-xs font-bold">Active (Show on site)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-[#FF5F00] w-4 h-4" />
                <span className="text-white text-xs font-bold">Featured</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#FF5F00] text-white rounded-xl font-black text-xs uppercase border-none cursor-pointer hover:bg-[#e55500] disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : (editingReel ? 'Update Reel' : 'Save Reel')}
            </button>
            <button onClick={resetForm} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-black text-xs uppercase border-none cursor-pointer hover:bg-slate-600 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Reels List */}
      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading reels...</div>
      ) : reels.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center space-y-2">
          <p className="text-slate-400 text-sm font-bold">Abhi koi reel nahi hai</p>
          <p className="text-slate-500 text-xs">Add Reel button se YouTube link ya video URL add karo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reels.map(reel => (
            <div key={reel.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold text-sm">{reel.customer_name}</span>
                  {reel.activity_type && <span className="text-[10px] bg-[#FF5F00]/20 text-[#FF5F00] border border-[#FF5F00]/30 px-2 py-0.5 rounded-full font-bold">{reel.activity_type}</span>}
                  {reel.is_featured && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">⭐ Featured</span>}
                </div>
                <p className="text-slate-400 text-xs mt-1 truncate">{reel.video_url}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-slate-500 text-[10px]">📍 {reel.location}</span>
                  <span className="text-slate-500 text-[10px]">⭐ {reel.rating}</span>
                  <span className="text-slate-500 text-[10px]">Order: {reel.sort_order}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(reel)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-none cursor-pointer transition-colors ${reel.is_active ? 'bg-emerald-500/20 text-emerald-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'}`}>
                  {reel.is_active ? '✅ Active' : '⏸ Inactive'}
                </button>
                <button onClick={() => handleEdit(reel)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border-none cursor-pointer transition-colors">
                  <Edit size={13} />
                </button>
                <button onClick={() => handleDelete(reel.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border-none cursor-pointer transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: HOMEPAGE MANAGER
// =============================================================================
function HomepageManager({ hotels, toursList, bikesList }) {

  const [sections, setSections] = useState({
    hotels: [],
    tours: [],
    bikes: []
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState({ hotels: '', tours: '', bikes: '' });

  // Fetch existing homepage_sections from Supabase on mount
  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      try {
        const { data: rows, error } = await supabase
          .from('homepage_sections')
          .select('*')
          .order('display_order', { ascending: true });
        if (error) throw error;

        const grouped = { hotels: [], tours: [], bikes: [] };
        (rows || []).forEach(row => {
          if (grouped[row.section]) {
            grouped[row.section].push(row.item_id);
          }
        });
        setSections(grouped);
      } catch (err) {
        console.error('Failed to fetch homepage sections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  const toggleItem = (sectionKey, itemId) => {
    setSections(prev => {
      const current = prev[sectionKey];
      const exists = current.includes(itemId);
      return {
        ...prev,
        [sectionKey]: exists ? current.filter(id => id !== itemId) : [...current, itemId]
      };
    });
    setSaved(false);
  };

  const moveItem = (sectionKey, fromIdx, toIdx) => {
    setSections(prev => {
      const arr = [...prev[sectionKey]];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return { ...prev, [sectionKey]: arr };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing rows and re-insert
      const { error: deleteError } = await supabase
        .from('homepage_sections')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
      if (deleteError) throw deleteError;

      const toInsert = [];
      Object.entries(sections).forEach(([sectionKey, ids]) => {
        ids.forEach((itemId, idx) => {
          toInsert.push({
            section: sectionKey,
            item_id: itemId,
            item_type: sectionKey,
            display_order: idx
          });
        });
      });

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('homepage_sections')
          .insert(toInsert);
        if (insertError) throw insertError;
      }

      setSaved(true);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const sectionConfig = [
    {
      key: 'hotels',
      label: 'Featured Hotels',
      icon: Building2,
      items: hotels || [],
      getLabel: (item) => item.name,
      getPrice: (item) => `₹${item.price || 0}/night`,
      getImg: (item) => item.images?.[0] || null
    },
    {
      key: 'tours',
      label: 'Featured Tours',
      icon: MapPinned,
      items: (() => {
        const seen = new Set();
        return (toursList || []).filter(t => {
          if (seen.has(t.name)) return false;
          seen.add(t.name);
          return true;
        });
      })(),
      getLabel: (item) => item.name,
      getPrice: (item) => `₹${item.price || 0}/person`,
      getImg: (item) => item.images?.[0] || null
    },
    {
      key: 'bikes',
      label: 'Featured Bikes',
      icon: Bike,
      items: (() => {
        const seen = new Set();
        return (bikesList || []).filter(b => {
          if (seen.has(b.name)) return false;
          seen.add(b.name);
          return true;
        });
      })(),
      getLabel: (item) => item.name,
      getPrice: (item) => `₹${item.price || 0}/day`,
      getImg: (item) => item.images?.[0] || null
    }
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm font-bold">
      Loading homepage settings...
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Manage Homepage</h2>
          <p className="text-slate-400 text-xs mt-1">Select and order the items that appear on the homepage. Changes are saved to Supabase.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] transition-all disabled:opacity-60 border-none cursor-pointer"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save All Sections'}
        </button>
      </div>

      {sectionConfig.map(({ key, label, icon: Icon, items, getLabel, getPrice, getImg }) => {
        const selectedIds = sections[key];
        const searchTerm = searchTerms[key].toLowerCase();
        const filteredItems = items.filter(item => getLabel(item).toLowerCase().includes(searchTerm));

        return (
          <div key={key} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
            {/* Section Header */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 bg-[#FF5F00]/10 border border-[#FF5F00]/20 rounded-lg flex items-center justify-center">
                <Icon size={14} className="text-[#FF5F00]" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white uppercase tracking-wide">{label}</h3>
                <p className="text-[10px] text-slate-500 font-semibold">{selectedIds.length} selected · will appear on homepage in this order</p>
              </div>
            </div>

            {/* Selected Items — ordered preview */}
            {selectedIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Display Order (drag to reorder)</p>
                <div className="space-y-1.5">
                  {selectedIds.map((id, idx) => {
                    const item = items.find(i => i.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 group">
                        <GripVertical size={14} className="text-slate-600 shrink-0" />
                        <span className="text-[10px] font-black text-[#FF5F00] w-4 shrink-0">{idx + 1}</span>
                        {getImg(item) && (
                          <img src={getImg(item)} alt={getLabel(item)} className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-white flex-1 truncate">{getLabel(item)}</span>
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">{getPrice(item)}</span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => moveItem(key, idx, Math.max(0, idx - 1))}
                            disabled={idx === 0}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-white text-[10px] font-black border border-slate-800 rounded cursor-pointer disabled:opacity-30"
                          >↑</button>
                          <button
                            onClick={() => moveItem(key, idx, Math.min(selectedIds.length - 1, idx + 1))}
                            disabled={idx === selectedIds.length - 1}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-white text-[10px] font-black border border-slate-800 rounded cursor-pointer disabled:opacity-30"
                          >↓</button>
                          <button
                            onClick={() => toggleItem(key, id)}
                            className="px-1.5 py-0.5 text-red-400 hover:text-red-300 text-[10px] font-black border border-red-900/40 rounded cursor-pointer"
                          >✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search & Item list */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                <Search size={13} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder={`Search ${label}...`}
                  value={searchTerms[key]}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 border-none focus:outline-none"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {filteredItems.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-6">No items found</p>
                )}
                {filteredItems.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(key, item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF5F00]/10 border-[#FF5F00]/30 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {getImg(item) && (
                        <img src={getImg(item)} alt={getLabel(item)} className="w-7 h-7 rounded-lg object-cover border border-slate-800 shrink-0" />
                      )}
                      <span className="flex-1 text-xs font-bold truncate">{getLabel(item)}</span>
                      <span className="text-[10px] text-slate-500 font-bold shrink-0">{getPrice(item)}</span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#FF5F00] border-[#FF5F00]' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: LISTINGFORM (Dynamic listing generator CRUD)
// =============================================================================
function ListingForm({ type, data, cities, vendors, onClose }) {
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [activitiesOperators, setActivitiesOperators] = useState({});
  const [bikesOperators, setBikesOperators] = useState({});
  const [toursOperators, setToursOperators] = useState({});
  const [uploadingImageIndices, setUploadingImageIndices] = useState({});

  // Initialize adventures/activities operators state (covers rafting, swing, paragliding, zipline, camping)
  useEffect(() => {
    if (['rafting', 'adventures', 'swing', 'paragliding', 'zipline', 'camping'].includes(type)) {
      const initialOps = {};
      
      // Initialize all vendors
      vendors.forEach(v => {
        initialOps[v.id] = {
          enabled: false,
          price: '',
          original_price: '',
          commission_percentage: '',
          whatsapp_number: v.whatsapp || '',
          operator_logo: '',
          years_of_experience: '',
          is_govt_approved: false,
          safety_rating: 4.5,
          full_payment_upi_discount: 0,
          payment_mode: 'commission_advance',
          fixed_advance_amount: '',
          id: null
        };
      });

      // If editing, populate from existing operators
      if (data && data.operators) {
        data.operators.forEach(op => {
          initialOps[op.vendor_id] = {
            enabled: true,
            price: op.price || '',
            original_price: op.original_price !== null && op.original_price !== undefined ? op.original_price : '',
            commission_percentage: op.commission_percentage !== null && op.commission_percentage !== undefined ? op.commission_percentage : '',
            whatsapp_number: op.whatsapp_number || op.vendors?.whatsapp || '',
            operator_logo: op.operator_logo || '',
            years_of_experience: op.years_of_experience !== null && op.years_of_experience !== undefined ? op.years_of_experience : '',
            is_govt_approved: !!op.is_govt_approved,
            safety_rating: op.safety_rating !== null && op.safety_rating !== undefined ? op.safety_rating : 4.5,
            full_payment_upi_discount: op.full_payment_upi_discount !== null && op.full_payment_upi_discount !== undefined ? op.full_payment_upi_discount : 0,
            payment_mode: op.payment_mode || 'commission_advance',
            fixed_advance_amount: op.fixed_advance_amount !== null && op.fixed_advance_amount !== undefined ? op.fixed_advance_amount : '',
            id: op.id
          };
        });
      }
      
      setActivitiesOperators(initialOps);
    }
  }, [type, data, vendors]);

  // Initialize tours operators state
  useEffect(() => {
    if (type === 'tours') {
      const initialOps = {};
      
      // Initialize all vendors
      vendors.forEach(v => {
        initialOps[v.id] = {
          enabled: false,
          price: '',
          original_price: '',
          commission_percentage: '',
          whatsapp_number: v.whatsapp || '',
          payment_mode: 'commission_advance',
          fixed_advance_amount: '',
          id: null
        };
      });

      // If editing, populate from existing operators
      if (data && data.operators) {
        data.operators.forEach(op => {
          initialOps[op.vendor_id] = {
            enabled: true,
            price: op.price || '',
            original_price: op.original_price !== null && op.original_price !== undefined ? op.original_price : '',
            commission_percentage: op.commission_percentage !== null && op.commission_percentage !== undefined ? op.commission_percentage : '',
            whatsapp_number: op.whatsapp_number || op.vendors?.whatsapp || '',
            payment_mode: op.payment_mode || 'commission_advance',
            fixed_advance_amount: op.fixed_advance_amount !== null && op.fixed_advance_amount !== undefined ? op.fixed_advance_amount : '',
            id: op.id
          };
        });
      }
      
      setToursOperators(initialOps);
    }
  }, [type, data, vendors]);

  // Initialize bikes operators state
  useEffect(() => {
    if (type === 'bikes') {
      const initialOps = {};
      
      // Initialize all vendors
      vendors.forEach(v => {
        initialOps[v.id] = {
          enabled: false,
          price: '',
          deposit: 0,
          pickup_location: v.address || 'Rishikesh',
          commission_percentage: '',
          payment_mode: 'commission_advance',
          fixed_advance_amount: '',
          id: null
        };
      });

      // If editing, populate from existing operators
      if (data && data.operators) {
        data.operators.forEach(op => {
          initialOps[op.vendor_id] = {
            enabled: true,
            price: op.price || '',
            deposit: op.deposit !== undefined ? op.deposit : 0,
            pickup_location: op.pickup_location || op.vendors?.address || 'Rishikesh',
            commission_percentage: op.commission_percentage !== null && op.commission_percentage !== undefined ? op.commission_percentage : '',
            payment_mode: op.payment_mode || 'commission_advance',
            fixed_advance_amount: op.fixed_advance_amount !== null && op.fixed_advance_amount !== undefined ? op.fixed_advance_amount : '',
            id: op.id
          };
        });
      }
      
      setBikesOperators(initialOps);
    }
  }, [type, data, vendors]);

  useEffect(() => {
    if (data) {
      setFormData({ 
        ...data,
        original_price: data.original_price !== null && data.original_price !== undefined ? data.original_price : '',
        commission_percentage: data.commission_percentage !== null && data.commission_percentage !== undefined ? data.commission_percentage : '',
        is_limited_offer: !!data.is_limited_offer,
        rating: data.rating !== null && data.rating !== undefined ? data.rating : 4.5,
        reviews_count: data.reviews_count !== null && data.reviews_count !== undefined ? data.reviews_count : 100,
        quick_info_tags: data.quick_info_tags || ['Stay Included', 'Private AC Cab', 'Meals Included', 'Local Driver'],
        day_wise_itinerary: data.day_wise_itinerary || data.itinerary || [],
        reporting_address: data.reporting_address || '',
        tour_guidelines: data.tour_guidelines || [],
        why_book_with_us: data.why_book_with_us || { items: [] },
        is_free_cancellation: !!data.is_free_cancellation,
        is_limited_seats: !!data.is_limited_seats,
        tour_highlights: data.tour_highlights || [],
        route_map: data.route_map || [],
        stay_details: data.stay_details || { hotel_name: '', photos: [], amenities: [], room_type: '' },
        pickup_drop: data.pickup_drop || { pickup_point: '', drop_point: '', reporting_time: '', coordinator_number: '' },
        landmarks_data: data.landmarks_data || [],
        faq_data: data.faq_data || [],
        is_bestseller: !!data.is_bestseller,
        is_instant_confirmation: data.is_instant_confirmation !== undefined && data.is_instant_confirmation !== null ? !!data.is_instant_confirmation : true,
        is_closed: !!data.is_closed,
        closed_reason: data.closed_reason || '',
        closed_from: data.closed_from || '',
        closed_until: data.closed_until || '',
        coming_soon: !!data.coming_soon,
        seats_left: data.seats_left !== undefined && data.seats_left !== null ? Number(data.seats_left) : 10,
        hotel_included: data.hotel_included !== undefined && data.hotel_included !== null ? !!data.hotel_included : true,
        meals_included: data.meals_included !== undefined && data.meals_included !== null ? !!data.meals_included : true,
        transport_included: data.transport_included !== undefined && data.transport_included !== null ? !!data.transport_included : true,
        guide_included: data.guide_included !== undefined && data.guide_included !== null ? !!data.guide_included : true,
        tour_type: data.tour_type || 'Sightseeing',
        next_batch: data.next_batch || '15 July',
        difficulty: data.difficulty || 'Moderate',
        group_type: data.group_type || 'Group Tour',
        perfect_for: data.perfect_for || [],
        why_guests_love: (data.why_guests_love || []).map(hl => {

          if (!hl) return { icon: 'Star', text: '' };
          if (typeof hl === 'object' && hl !== null) {
            return {
              icon: hl.icon || 'Star',
              text: hl.text || ''
            };
          }
          if (typeof hl === 'string') {
            const trimmed = hl.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              try {
                const parsed = JSON.parse(trimmed);
                return {
                  icon: parsed.icon || 'Star',
                  text: parsed.text || ''
                };
              } catch (e) {
                // ignore
              }
            }
            return {
              icon: 'Star',
              text: hl
            };
          }
          return { icon: 'Star', text: String(hl) };
        }),
        rooms_left: data.rooms_left !== null && data.rooms_left !== undefined ? data.rooms_left : 5,
        high_demand: !!data.high_demand,
        attractions: data.attractions || [],
        is_verified: data.is_verified !== undefined && data.is_verified !== null ? !!data.is_verified : true,
        bookings_count: data.bookings_count !== null && data.bookings_count !== undefined ? Number(data.bookings_count) : (type === 'tours' ? 150 : 18),
        property_type: data.property_type || 'Hotel',
        room_type: data.room_type || 'Deluxe Double Room',
        best_for: data.best_for || [],
        benefits: data.benefits || [],
        upi_discount: data.upi_discount !== null && data.upi_discount !== undefined ? Number(data.upi_discount) : null,
        free_video_type: data.free_video_type || 'none',
        featured_image: data.featured_image || '',
        payment_mode: data.payment_mode || 'commission_advance',
        fixed_advance_amount: data.fixed_advance_amount !== null && data.fixed_advance_amount !== undefined ? data.fixed_advance_amount : '',
        rules: {
          unmarried_couples: false,
          pets: false,
          smoking: false,
          id_required: false,
          min_age_18: false,
          alcohol_allowed: false,
          visitors_allowed: false,
          breakfast_included: false,
          breakfast_price: '',
          room_categories: [],
          badge_settings: { home: '', list: '', detail: '' },
          ...(typeof data.rules === 'string' ? JSON.parse(data.rules) : (data.rules || {}))
        }
      });
    } else {
      // Set defaults for empty forms
      const defaults = {
        city_id: cities.length > 0 ? cities[0].id : '',
        vendor_id: vendors.length > 0 ? vendors.filter(v => v.category === (type === 'bikes' ? 'Bike Rental' : type === 'hotels' ? 'Hotel' : ['rafting', 'adventures'].includes(type) ? 'Rafting' : 'Tour'))[0]?.id || vendors[0]?.id : '',
        name: '',
        description: '',
        price: 0,
        original_price: '',
        commission_percentage: '',
        is_limited_offer: false,
        images: [],
        whatsapp_number: '',
        cancellation_policy: '100% refund up to 24 hours prior to arrival.',
        payment_mode: 'commission_advance',
        fixed_advance_amount: 0,
        upi_discount: null,
        free_video_type: 'none',
        coming_soon: false
      };

      if (type === 'hotels') {
        defaults.address = '';
        defaults.maps_link = '';
        defaults.check_in = '12:00 PM';
        defaults.check_out = '11:00 AM';
        defaults.amenities = { wifi: false, ac: false, parking: false, restaurant: false, tv: false, mountain_view: false, river_view: false, room_service: false, power_backup: false, geyser: false };
        defaults.rules = { unmarried_couples: false, pets: false, smoking: false, id_required: false, min_age_18: false, alcohol_allowed: false, visitors_allowed: false, breakfast_included: false, breakfast_price: '', room_categories: [], badge_settings: { home: '', list: '', detail: '' } };
        defaults.landmarks = [];
        defaults.rating = 4.5;
        defaults.reviews_count = 100;
        defaults.why_guests_love = [
          { icon: 'Waves', text: 'River View Rooms' },
          { icon: 'Wifi', text: 'Fast WiFi' },
          { icon: 'Compass', text: '5 Min Walk To Laxman Jhula' },
          { icon: 'Smile', text: 'Clean Comfortable Rooms' }
        ];
        defaults.rooms_left = 5;
        defaults.high_demand = false;
        defaults.attractions = [];
        defaults.is_verified = true;
        defaults.bookings_count = 18;
        defaults.property_type = 'Hotel';
        defaults.room_type = 'Deluxe Double Room';
        defaults.best_for = ['Family Friendly', 'Couples Welcome', 'Backpackers'];
        defaults.perfect_for = ['Couples', 'Families', 'Backpackers'];
        defaults.benefits = [
          { icon: 'Lock', title: 'Secure Payment', desc: 'Protected by Razorpay SECURE payment gate' },
          { icon: 'CalendarCheck', title: 'Instant Booking', desc: 'Hotel room voucher sent immediately' },
          { icon: 'RefreshCw', title: 'Easy Refund', desc: 'No-hassle cancellation & quick refunds' },
          { icon: 'HelpCircle', title: '24×7 Support', desc: '24/7 on-ground assistance & guide network' },
          { icon: 'ShieldCheck', title: 'Verified Partners', desc: 'Every stay is handpicked and verified' },
          { icon: 'CircleDollarSign', title: 'Best Price Guarantee', desc: 'Find it cheaper? We match the price!' }
        ];
        defaults.upi_discount = null;
        defaults.featured_image = '';
      } else if (['rafting', 'adventures'].includes(type)) {
        defaults.activity_type = 'rafting';
        defaults.route = '';
        defaults.distance_km = 12;
        defaults.duration = '2 Hours';
        defaults.pickup_included = false;
        defaults.drop_included = false;
        defaults.age_limit = 12;
        defaults.inclusions = [];
        defaults.exclusions = [];
      } else if (type === 'bikes') {
        defaults.deposit = 0;
        defaults.documents = ['Driving License', 'Aadhar Card'];
        defaults.pickup_location = '';
      } else if (type === 'tours') {
        defaults.duration = '3 Days / 2 Nights';
        defaults.itinerary = [];
        defaults.day_wise_itinerary = [];
        defaults.quick_info_tags = ['Stay Included', 'Private AC Cab', 'Meals Included', 'Local Driver'];
        defaults.reporting_address = '';
        defaults.tour_guidelines = [];
        defaults.why_book_with_us = { items: [] };
        defaults.inclusions = [];
        defaults.exclusions = [];
        defaults.contact_number = '';
        defaults.is_free_cancellation = false;
        defaults.is_limited_seats = false;
        defaults.tour_highlights = [];
        defaults.route_map = [];
        defaults.stay_details = { hotel_name: '', photos: [], amenities: [], room_type: '' };
        defaults.pickup_drop = { pickup_point: '', drop_point: '', reporting_time: '', coordinator_number: '' };
        defaults.landmarks_data = [];
        defaults.faq_data = [];
        defaults.is_verified = true;
        defaults.is_bestseller = false;
        defaults.is_instant_confirmation = true;
        defaults.is_closed = false;
        defaults.closed_reason = '';
        defaults.closed_from = '';
        defaults.closed_until = '';
        defaults.seats_left = 10;
        defaults.bookings_count = 150;
        defaults.hotel_included = true;
        defaults.meals_included = true;
        defaults.transport_included = true;
        defaults.guide_included = true;
        defaults.tour_type = 'Sightseeing';
        defaults.next_batch = '15 July';
        defaults.difficulty = 'Moderate';
        defaults.group_type = 'Group Tour';
        defaults.perfect_for = [];
      }

      setFormData(defaults);

    }
  }, [type, data, cities, vendors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (['rafting', 'adventures'].includes(type)) {
        const enabledOps = Object.entries(activitiesOperators)
          .filter(([_, op]) => op.enabled)
          .map(([vendorId, op]) => ({
            vendorId,
            price: Number(op.price),
            originalPrice: op.original_price === '' || op.original_price === null || op.original_price === undefined ? null : Number(op.original_price),
            commissionPercentage: op.commission_percentage === '' || op.commission_percentage === null || op.commission_percentage === undefined ? null : Number(op.commission_percentage),
            paymentMode: op.payment_mode || 'commission_advance',
            fixedAdvanceAmount: op.fixed_advance_amount === '' || op.fixed_advance_amount === null || op.fixed_advance_amount === undefined ? null : Number(op.fixed_advance_amount),
            whatsappNumber: op.whatsapp_number || null,
            operatorLogo: op.operator_logo || null,
            yearsOfExperience: op.years_of_experience === '' || op.years_of_experience === null || op.years_of_experience === undefined ? null : Number(op.years_of_experience),
            isGovtApproved: !!op.is_govt_approved,
            safetyRating: op.safety_rating === '' || op.safety_rating === null || op.safety_rating === undefined ? 4.5 : Number(op.safety_rating),
            fullPaymentUpiDiscount: op.full_payment_upi_discount === '' || op.full_payment_upi_discount === null || op.full_payment_upi_discount === undefined ? 0 : Number(op.full_payment_upi_discount),
            id: op.id
          }));

        const matchingVendors = getVendorsForType(formData.activity_type || 'rafting', vendors);
        if (matchingVendors.length === 0) {
          const catLabel = 
            formData.activity_type === 'bungee' ? 'Bungee Jumping' :
            formData.activity_type === 'swing' ? 'Giant Swing' :
            formData.activity_type === 'paragliding' ? 'Paragliding' :
            formData.activity_type === 'zipline' ? 'Ganga Zipline' :
            formData.activity_type === 'camping' ? 'Camping' : 'Rafting';
          throw new Error(`No vendors found with category '${catLabel}'. Please go to the 'Vendors DB' tab and add a vendor for '${catLabel}' first!`);
        }

        if (enabledOps.length === 0) {
          throw new Error('Please enable at least one operator for this adventure package by checking the checkbox next to the operator.');
        }

        if (enabledOps.some(op => !op.price || Number(op.price) <= 0)) {
          throw new Error('Price must be greater than 0 for all enabled operators.');
        }

        const commonProps = {
          city_id: formData.city_id,
          name: formData.name || (formData.activity_type === 'rafting' ? `${formData.distance_km} KM Rafting Stretch` : 'Adventure Spot'),
          description: formData.description || '',
          route: formData.route || '',
          distance_km: formData.activity_type === 'camping' ? 0 : (Number(formData.distance_km) || 0),
          duration: formData.duration || '',
          pickup_included: !!formData.pickup_included,
          drop_included: !!formData.drop_included,
          age_limit: formData.activity_type === 'camping' ? 18 : (Number(formData.age_limit) || 12),
          images: formData.images || [],
          inclusions: formData.inclusions || [],
          exclusions: formData.exclusions || [],
          cancellation_policy: formData.cancellation_policy || '100% refund up to 24 hours prior to arrival.',
          activity_type: formData.activity_type || 'rafting',
          payment_mode: formData.payment_mode || 'commission_advance',
          commission_percentage: formData.commission_percentage === '' || formData.commission_percentage === null ? 10 : Number(formData.commission_percentage),
          fixed_advance_amount: formData.fixed_advance_amount === '' || formData.fixed_advance_amount === null ? 0 : Number(formData.fixed_advance_amount),
          upi_discount: formData.upi_discount === '' || formData.upi_discount === null ? null : Number(formData.upi_discount),
          free_video_type: formData.free_video_type || 'none',
          is_closed: !!formData.is_closed,
          closed_reason: formData.closed_reason || '',
          closed_from: formData.closed_from || null,
          closed_until: formData.closed_until || null,
          coming_soon: !!formData.coming_soon
        };

        if (data) {
          // Editing existing stretch/activity
          const existingOpsMap = {};
          data.operators.forEach(op => {
            existingOpsMap[op.vendor_id] = op.id;
          });

          const opsToInsert = [];
          const opsToUpdate = [];
          const opsToDelete = [];

          enabledOps.forEach(op => {
            const existingId = existingOpsMap[op.vendorId];
            if (existingId) {
              opsToUpdate.push({
                id: existingId,
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                original_price: op.originalPrice,
                payment_mode: op.paymentMode,
                commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
                fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null,
                whatsapp_number: op.whatsappNumber,
                operator_logo: op.operatorLogo,
                years_of_experience: op.yearsOfExperience,
                is_govt_approved: op.isGovtApproved,
                safety_rating: op.safetyRating,
                full_payment_upi_discount: op.fullPaymentUpiDiscount
              });
              delete existingOpsMap[op.vendorId];
            } else {
              opsToInsert.push({
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                original_price: op.originalPrice,
                payment_mode: op.paymentMode,
                commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
                fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null,
                whatsapp_number: op.whatsappNumber,
                operator_logo: op.operatorLogo,
                years_of_experience: op.yearsOfExperience,
                is_govt_approved: op.isGovtApproved,
                safety_rating: op.safetyRating,
                full_payment_upi_discount: op.fullPaymentUpiDiscount
              });
            }
          });

          Object.values(existingOpsMap).forEach(id => {
            opsToDelete.push(id);
          });

          if (opsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from('rafting').delete().in('id', opsToDelete);
            if (deleteError) throw deleteError;
          }

          if (opsToUpdate.length > 0) {
            const { error: updateError } = await supabase.from('rafting').upsert(opsToUpdate);
            if (updateError) throw updateError;
          }

          if (opsToInsert.length > 0) {
            const { error: insertError } = await supabase.from('rafting').insert(opsToInsert);
            if (insertError) throw insertError;
          }
        } else {
          // Creating new stretch/activity
          const recordsToInsert = enabledOps.map(op => ({
            ...commonProps,
            vendor_id: op.vendorId,
            price: op.price,
            original_price: op.originalPrice,
            payment_mode: op.paymentMode,
            commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
            fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null,
            whatsapp_number: op.whatsappNumber,
            operator_logo: op.operatorLogo,
            years_of_experience: op.yearsOfExperience,
            is_govt_approved: op.isGovtApproved,
            safety_rating: op.safetyRating,
            full_payment_upi_discount: op.fullPaymentUpiDiscount
          }));

          const { error: insertError } = await supabase.from('rafting').insert(recordsToInsert);
          if (insertError) throw insertError;
        }

        onClose();
        return;
      }

      if (type === 'bikes') {
        const enabledOps = Object.entries(bikesOperators)
          .filter(([_, op]) => op.enabled)
          .map(([vendorId, op]) => ({
            vendorId,
            price: Number(op.price),
            deposit: Number(op.deposit),
            pickupLocation: op.pickup_location || 'Rishikesh',
            paymentMode: op.payment_mode || 'commission_advance',
            commissionPercentage: op.commission_percentage === '' || op.commission_percentage === null || op.commission_percentage === undefined ? null : Number(op.commission_percentage),
            fixedAdvanceAmount: op.fixed_advance_amount === '' || op.fixed_advance_amount === null || op.fixed_advance_amount === undefined ? null : Number(op.fixed_advance_amount),
            id: op.id
          }));

        if (enabledOps.length === 0) {
          throw new Error('Please enable at least one vendor for this bike/scoty rent.');
        }

        if (enabledOps.some(op => !op.price || Number(op.price) <= 0)) {
          throw new Error('Price must be greater than 0 for all enabled operators.');
        }

        const commonProps = {
          city_id: formData.city_id,
          name: formData.name,
          description: formData.description || '',
          documents: formData.documents || ['Driving License', 'Aadhar Card'],
          images: formData.images || [],
          payment_mode: formData.payment_mode || 'commission_advance',
          commission_percentage: formData.payment_mode === 'commission_advance' ? (formData.commission_percentage !== '' && formData.commission_percentage !== null ? Number(formData.commission_percentage) : 10) : null,
          fixed_advance_amount: formData.payment_mode === 'fixed_advance' ? (formData.fixed_advance_amount !== '' && formData.fixed_advance_amount !== null ? Number(formData.fixed_advance_amount) : 0) : null,
          upi_discount: formData.upi_discount === undefined || formData.upi_discount === null || formData.upi_discount === '' ? null : Number(formData.upi_discount)
        };

        if (data) {
          // Editing existing bike model
          const existingOpsMap = {};
          data.operators.forEach(op => {
            existingOpsMap[op.vendor_id] = op.id;
          });

          const opsToInsert = [];
          const opsToUpdate = [];
          const opsToDelete = [];

          enabledOps.forEach(op => {
            const existingId = existingOpsMap[op.vendorId];
            if (existingId) {
              opsToUpdate.push({
                id: existingId,
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                deposit: op.deposit,
                pickup_location: op.pickupLocation,
                payment_mode: op.paymentMode,
                commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
                fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null
              });
              delete existingOpsMap[op.vendorId];
            } else {
              opsToInsert.push({
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                deposit: op.deposit,
                pickup_location: op.pickupLocation,
                payment_mode: op.paymentMode,
                commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
                fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null
              });
            }
          });

          Object.values(existingOpsMap).forEach(id => {
            opsToDelete.push(id);
          });

          if (opsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from('bikes').delete().in('id', opsToDelete);
            if (deleteError) throw deleteError;
          }

          if (opsToUpdate.length > 0) {
            const { error: updateError } = await supabase.from('bikes').upsert(opsToUpdate);
            if (updateError) throw updateError;
          }

          if (opsToInsert.length > 0) {
            const { error: insertError } = await supabase.from('bikes').insert(opsToInsert);
            if (insertError) throw insertError;
          }
        } else {
          // Creating new bike model
          const recordsToInsert = enabledOps.map(op => ({
            ...commonProps,
            vendor_id: op.vendorId,
            price: op.price,
            deposit: op.deposit,
            pickup_location: op.pickupLocation,
            payment_mode: op.paymentMode,
            commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
            fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null
          }));

          const { error: insertError } = await supabase.from('bikes').insert(recordsToInsert);
          if (insertError) throw insertError;
        }

      }

      if (type === 'tours') {
        const enabledOps = Object.entries(toursOperators)
          .filter(([_, op]) => op.enabled)
          .map(([vendorId, op]) => ({
            vendorId,
            price: Number(op.price),
            originalPrice: op.original_price === '' || op.original_price === null || op.original_price === undefined ? null : Number(op.original_price),
            commissionPercentage: op.commission_percentage === '' || op.commission_percentage === null || op.commission_percentage === undefined ? null : Number(op.commission_percentage),
            whatsappNumber: op.whatsapp_number || null,
            paymentMode: op.payment_mode || 'commission_advance',
            fixedAdvanceAmount: op.fixed_advance_amount === '' || op.fixed_advance_amount === null || op.fixed_advance_amount === undefined ? null : Number(op.fixed_advance_amount),
            id: op.id
          }));

        if (enabledOps.length === 0) {
          throw new Error('Please enable at least one operator for this tour package.');
        }

        const commonProps = {
          city_id: formData.city_id,
          name: formData.name,
          description: formData.description || '',
          duration: formData.duration || '3 Days / 2 Nights',
          itinerary: formData.day_wise_itinerary || formData.itinerary || [],
          day_wise_itinerary: formData.day_wise_itinerary || formData.itinerary || [],
          quick_info_tags: (formData.quick_info_tags || []).filter(Boolean),
          reporting_address: formData.reporting_address || '',
          inclusions: (formData.inclusions || []).filter(Boolean),
          exclusions: (formData.exclusions || []).filter(Boolean),
          tour_guidelines: (formData.tour_guidelines || []).filter(Boolean),
          why_book_with_us: formData.why_book_with_us || { items: [] },
          is_free_cancellation: !!formData.is_free_cancellation,
          is_limited_seats: !!formData.is_limited_seats,
          tour_highlights: (formData.tour_highlights || []).filter(Boolean),
          route_map: (formData.route_map || []).filter(Boolean),
          stay_details: formData.stay_details || { hotel_name: '', photos: [], amenities: [], room_type: '' },
          pickup_drop: formData.pickup_drop || { pickup_point: '', drop_point: '', reporting_time: '', coordinator_number: '' },
          landmarks_data: formData.landmarks_data || [],
          faq_data: formData.faq_data || [],
          cancellation_policy: formData.cancellation_policy || '100% refund up to 24 hours prior to arrival.',
          images: formData.images || [],
          payment_mode: formData.payment_mode || 'commission_advance',
          commission_percentage: formData.payment_mode === 'commission_advance' ? (formData.commission_percentage !== '' && formData.commission_percentage !== null ? Number(formData.commission_percentage) : 10) : null,
          fixed_advance_amount: formData.payment_mode === 'fixed_advance' ? (formData.fixed_advance_amount !== '' && formData.fixed_advance_amount !== null ? Number(formData.fixed_advance_amount) : 0) : null,
          is_verified: formData.is_verified !== undefined ? !!formData.is_verified : true,
          is_bestseller: !!formData.is_bestseller,
          is_instant_confirmation: formData.is_instant_confirmation !== undefined ? !!formData.is_instant_confirmation : true,
          is_closed: !!formData.is_closed,
          closed_reason: formData.closed_reason || '',
          closed_from: formData.closed_from || null,
          closed_until: formData.closed_until || null,
          upi_discount: formData.upi_discount !== null && formData.upi_discount !== undefined && formData.upi_discount !== '' ? Number(formData.upi_discount) : null,
          seats_left: formData.seats_left !== undefined && formData.seats_left !== null && formData.seats_left !== '' ? Number(formData.seats_left) : 10,
          bookings_count: formData.bookings_count !== undefined && formData.bookings_count !== null && formData.bookings_count !== '' ? Number(formData.bookings_count) : 150,
          hotel_included: formData.hotel_included !== undefined ? !!formData.hotel_included : true,
          meals_included: formData.meals_included !== undefined ? !!formData.meals_included : true,
          transport_included: formData.transport_included !== undefined ? !!formData.transport_included : true,
          guide_included: formData.guide_included !== undefined ? !!formData.guide_included : true,
          tour_type: formData.tour_type || 'Sightseeing',
          next_batch: formData.next_batch || '15 July',
          difficulty: formData.difficulty || 'Moderate',
          group_type: formData.group_type || 'Group Tour',
          perfect_for: (formData.perfect_for || []).filter(Boolean)
        };

        if (data) {
          const existingOpsMap = {};
          data.operators.forEach(op => {
            existingOpsMap[op.vendor_id] = op.id;
          });

          const opsToInsert = [];
          const opsToUpdate = [];
          const opsToDelete = [];

          enabledOps.forEach(op => {
            const existingId = existingOpsMap[op.vendorId];
            if (existingId) {
              opsToUpdate.push({
                id: existingId,
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                original_price: op.originalPrice,
                payment_mode: op.paymentMode,
                commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
                fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null,
                contact_number: op.whatsappNumber
              });
              delete existingOpsMap[op.vendorId];
            } else {
              opsToInsert.push({
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                original_price: op.originalPrice,
                payment_mode: op.paymentMode,
                commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
                fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null,
                contact_number: op.whatsappNumber
              });
            }
          });

          Object.values(existingOpsMap).forEach(id => {
            opsToDelete.push(id);
          });

          if (opsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from('tours').delete().in('id', opsToDelete);
            if (deleteError) throw deleteError;
          }

          if (opsToUpdate.length > 0) {
            const { error: updateError } = await supabase.from('tours').upsert(opsToUpdate);
            if (updateError) throw updateError;
          }

          if (opsToInsert.length > 0) {
            const { error: insertError } = await supabase.from('tours').insert(opsToInsert);
            if (insertError) throw insertError;
          }
        } else {
          const recordsToInsert = enabledOps.map(op => ({
            ...commonProps,
            vendor_id: op.vendorId,
            price: op.price,
            original_price: op.originalPrice,
            payment_mode: op.paymentMode,
            commission_percentage: op.paymentMode === 'commission_advance' ? (op.commissionPercentage !== null ? op.commissionPercentage : 10) : null,
            fixed_advance_amount: op.paymentMode === 'fixed_advance' ? op.fixedAdvanceAmount : null,
            contact_number: op.whatsappNumber
          }));

          const { error: insertError } = await supabase.from('tours').insert(recordsToInsert);
          if (insertError) throw insertError;
        }

        onClose();
        return;
      }

      // Default submit payload builder for hotels/bikes
      let submitData = {
        city_id: formData.city_id,
        vendor_id: formData.vendor_id,
        name: formData.name,
        description: formData.description || '',
        price: Number(formData.price),
        whatsapp_number: formData.whatsapp_number || null,
        images: formData.images || [],
        is_closed: !!formData.is_closed,
        closed_reason: formData.closed_reason || '',
        closed_from: formData.closed_from || null,
        closed_until: formData.closed_until || null,
        original_price: formData.original_price === '' || formData.original_price === null || formData.original_price === undefined ? null : Number(formData.original_price),
        payment_mode: formData.payment_mode || 'commission_advance',
        commission_percentage: formData.payment_mode === 'commission_advance' ? (formData.commission_percentage === '' || formData.commission_percentage === null || formData.commission_percentage === undefined ? null : Number(formData.commission_percentage)) : null,
        fixed_advance_amount: formData.payment_mode === 'fixed_advance' ? (formData.fixed_advance_amount === '' || formData.fixed_advance_amount === null || formData.fixed_advance_amount === undefined ? null : Number(formData.fixed_advance_amount)) : null,
        is_limited_offer: !!formData.is_limited_offer,
        upi_discount: formData.upi_discount !== null && formData.upi_discount !== undefined && formData.upi_discount !== '' ? Number(formData.upi_discount) : null
      };

      if (type === 'hotels') {
        submitData.address = formData.address || '';
        submitData.maps_link = formData.maps_link || '';
        submitData.check_in = formData.check_in || '12:00 PM';
        submitData.check_out = formData.check_out || '11:00 AM';
        submitData.cancellation_policy = formData.cancellation_policy || '100% refund up to 24 hours prior to arrival.';
        submitData.amenities = formData.amenities || {};
        submitData.rules = formData.rules || {};
        submitData.landmarks = formData.landmarks || [];
        submitData.attractions = formData.attractions || [];  // ✅ nearby attractions fix
        submitData.rating = formData.rating === undefined ? 4.5 : Number(formData.rating);
        submitData.reviews_count = formData.reviews_count === undefined ? 100 : Number(formData.reviews_count);
        submitData.rooms_left = formData.rooms_left === undefined ? 5 : Number(formData.rooms_left);
        submitData.high_demand = !!formData.high_demand;
        submitData.is_verified = formData.is_verified !== undefined ? !!formData.is_verified : true;
        submitData.bookings_count = formData.bookings_count === undefined ? 18 : Number(formData.bookings_count);
        // ✅ auto-generate popular_badge_text from bookings_count
        submitData.popular_badge_text = formData.popular_badge_text
          || (formData.bookings_count ? `${formData.bookings_count} bookings this week` : '18 bookings this week');
        submitData.property_type = formData.property_type || 'Hotel';
        submitData.room_type = formData.room_type || 'Deluxe Double Room';
        submitData.why_guests_love = formData.why_guests_love || [];
        submitData.best_for = formData.best_for || [];
        submitData.perfect_for = formData.perfect_for || [];
        submitData.benefits = formData.benefits || [];
        submitData.featured_image = formData.featured_image || '';
      } else if (type === 'bikes') {
        submitData.deposit = Number(formData.deposit || 0);
        submitData.documents = formData.documents || [];
        submitData.pickup_location = formData.pickup_location || '';
      }
      if (data) {
        // Edit Row
        const { error } = await supabase.from(type).update(submitData).eq('id', data.id);
        if (error) throw error;
      } else {
        // Insert Row
        const { error } = await supabase.from(type).insert(submitData);
        if (error) throw error;
      }
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Helper arrays update
  const handleArrayChange = (field, index, value) => {
    const updated = [...(formData[field] || [])];
    updated[index] = value;
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }));
  };

  const handleImageFileUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageIndices(prev => ({ ...prev, [idx]: true }));
    try {
      const ext = file.name.split('.').pop();
      const randName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
      const filePath = `listings/${randName}`;

      const { error } = await supabase.storage.from('media').upload(filePath, file);
      if (error) throw error;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      handleArrayChange('images', idx, data.publicUrl);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingImageIndices(prev => ({ ...prev, [idx]: false }));
    }
  };

  if (!formData.name && formData.price === undefined) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs text-left">
      {/* 1. Meta Details (City and Vendor selection) */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`space-y-1 ${['rafting', 'adventures', 'bikes', 'tours'].includes(type) ? 'col-span-2' : ''}`}>
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Target City</label>
          <select
            value={formData.city_id}
            onChange={(e) => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none"
          >
            {cities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {!['rafting', 'adventures', 'bikes', 'tours', 'hotels'].includes(type) && (
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Partner Vendor</label>
            <select
              value={formData.vendor_id}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor_id: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none"
            >
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Basic details */}
      <div className="grid grid-cols-2 gap-4">
        {type === 'adventures' ? (
          <div className="space-y-1 col-span-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Adventure Name</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  value={
                    (STANDARD_ADVENTURE_NAMES[formData.activity_type || 'rafting'] || []).includes(formData.name)
                      ? formData.name
                      : (formData.name ? 'custom' : '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setFormData(prev => ({ ...prev, name: '' }));
                    } else {
                      setFormData(prev => ({ ...prev, name: val }));
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none font-bold"
                >
                  <option value="" disabled>-- Select Adventure Name --</option>
                  {(STANDARD_ADVENTURE_NAMES[formData.activity_type || 'rafting'] || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="custom">Custom (Type manually...)</option>
                </select>
              </div>
              {(! (STANDARD_ADVENTURE_NAMES[formData.activity_type || 'rafting'] || []).includes(formData.name) || formData.name === '') && (
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter custom adventure name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1 col-span-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Listing Title</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
            />
          </div>
        )}

        {type === 'adventures' && (
          <div className="space-y-1 col-span-2 pb-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider font-semibold">Adventure Type</label>
            <select
              value={formData.activity_type || 'rafting'}
              onChange={(e) => {
                const nextType = e.target.value;
                const defaultName = STANDARD_ADVENTURE_NAMES[nextType]?.[0] || '';
                setFormData(prev => ({ 
                  ...prev, 
                  activity_type: nextType,
                  name: defaultName
                }));
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none font-bold"
            >
              <option value="rafting">Rafting</option>
              <option value="bungee">Bungee Jumping</option>
              <option value="swing">Giant Swing</option>
              <option value="paragliding">Paragliding</option>
              <option value="zipline">Ganga Zipline</option>
              <option value="camping">Camping</option>
            </select>
          </div>
        )}

        {(!['bikes', 'tours'].includes(type) || ['rafting', 'adventures'].includes(type)) && (
          <>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {['rafting', 'adventures'].includes(type) ? 'Fallback Showcase Price (₹)' : 'Price (₹)'}
              </label>
              <input
                type="number"
                required
                value={formData.price === undefined || formData.price === null ? '' : formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder={['rafting', 'adventures'].includes(type) ? 'e.g. 1290' : ''}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {['rafting', 'adventures'].includes(type) ? 'Showcase Original Price (₹)' : 'Original Price (₹ - Strikethrough)'}
              </label>
              <input
                type="number"
                value={formData.original_price !== null && formData.original_price !== undefined ? formData.original_price : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value === '' ? null : Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder={['rafting', 'adventures'].includes(type) ? 'e.g. 1800' : 'e.g. 2999 (Leave blank if no discount)'}
              />
            </div>
          </>
        )}

            {['hotels', 'bikes'].includes(type) && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">WhatsApp Number</label>
                <input
                  type="text"
                  value={formData.whatsapp_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  placeholder="e.g. 8630027341"
                />
              </div>
            )}

            {type === 'hotels' && (
              <>
                <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Commission Override (%)</label>
              <input
                type="number"
                value={formData.commission_percentage !== null && formData.commission_percentage !== undefined ? formData.commission_percentage : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, commission_percentage: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder="e.g. 15 (Overrides vendor commission)"
              />
            </div>

            <div className="space-y-1 flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={!!formData.is_limited_offer}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_limited_offer: e.target.checked }))}
                  className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4"
                />
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Limited Time Offer Badge</span>
              </label>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider font-semibold">Custom UPI Discount (INR)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 100 (Leave blank for no discount)"
            value={formData.upi_discount === undefined || formData.upi_discount === null ? '' : formData.upi_discount}
            onChange={(e) => setFormData(prev => ({ ...prev, upi_discount: e.target.value === '' ? null : Number(e.target.value) }))}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
          />
        </div>

        {false && (
          <>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider font-semibold">Star Rating (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                required
                value={formData.rating === undefined || formData.rating === null ? 4.8 : formData.rating}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider font-semibold">Reviews Count</label>
              <input
                type="number"
                min="0"
                required
                value={formData.reviews_count === undefined || formData.reviews_count === null ? 100 : formData.reviews_count}
                onChange={(e) => setFormData(prev => ({ ...prev, reviews_count: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Description</label>
        <textarea
          required
          rows="3"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none resize-none"
        />
      </div>

      {/* 3. Image URLs Manager */}
      <div className="space-y-2">
        <div className="flex justify-between items-center bg-slate-900/10 p-2 rounded-xl border border-slate-800/40 font-semibold">
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Gallery Images</label>
          <div className="flex items-center gap-2">
            <label className="py-1 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[10px] text-slate-350 font-bold cursor-pointer flex items-center justify-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  for (let file of files) {
                    try {
                      const ext = file.name.split('.').pop();
                      const randName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
                      const filePath = `listings/${randName}`;

                      const { error } = await supabase.storage.from('media').upload(filePath, file);
                      if (error) throw error;

                      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
                      setFormData(prev => ({
                        ...prev,
                        images: [...(prev.images || []), data.publicUrl]
                      }));
                    } catch (err) {
                      alert(`Upload failed for ${file.name}: ${err.message}`);
                    }
                  }
                }}
                className="hidden"
              />
              <span>Upload Photos</span>
            </label>
            <button
              type="button"
              onClick={() => addArrayItem('images')}
              className="py-1 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[10px] text-slate-300 font-bold cursor-pointer"
            >
              Add URL
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {(formData.images || []).map((img, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                required
                value={img}
                onChange={(e) => handleArrayChange('images', idx, e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none"
                placeholder="https://..."
              />
              
              {/* Image Upload Button */}
              <label className="py-2.5 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl cursor-pointer flex items-center justify-center shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileUpload(e, idx)}
                  className="hidden"
                  disabled={uploadingImageIndices[idx]}
                />
                {uploadingImageIndices[idx] ? (
                  <span className="text-[10px] animate-pulse">Uploading...</span>
                ) : (
                  <span className="text-[10px] font-bold">Upload</span>
                )}
              </label>

              <button
                type="button"
                onClick={() => removeArrayItem('images', idx)}
                className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Type Specific Fields */}
      {type === 'hotels' && (
        <div className="space-y-4 border-t border-slate-900 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Hotel Address</label>
              <input
                type="text"
                required
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Google Maps Link</label>
              <input
                type="text"
                value={formData.maps_link || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maps_link: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Property Type (e.g. Hotel, Resort)</label>
              <input
                type="text"
                value={formData.property_type || 'Hotel'}
                onChange={(e) => setFormData(prev => ({ ...prev, property_type: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Room Type (e.g. Deluxe Double Room)</label>
              <input
                type="text"
                value={formData.room_type || 'Deluxe Double Room'}
                onChange={(e) => setFormData(prev => ({ ...prev, room_type: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Star Rating (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                required
                value={formData.rating === undefined ? 4.5 : formData.rating}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Reviews Count</label>
              <input
                type="number"
                min="0"
                required
                value={formData.reviews_count === undefined ? 100 : formData.reviews_count}
                onChange={(e) => setFormData(prev => ({ ...prev, reviews_count: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Rooms Left</label>
              <input
                type="number"
                min="0"
                required
                value={formData.rooms_left === undefined ? 5 : formData.rooms_left}
                onChange={(e) => setFormData(prev => ({ ...prev, rooms_left: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Bookings This Week</label>
              <input
                type="number"
                min="0"
                required
                value={formData.bookings_count === undefined ? 18 : formData.bookings_count}
                onChange={(e) => setFormData(prev => ({ ...prev, bookings_count: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Featured Image URL (Slider Cover)</label>
            <input
              type="text"
              placeholder="Defaults to first image if blank"
              value={formData.featured_image || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
            />
          </div>

          <div className="flex gap-6 py-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-350 select-none">
              <input
                type="checkbox"
                checked={!!formData.high_demand}
                onChange={(e) => setFormData(prev => ({ ...prev, high_demand: e.target.checked }))}
                className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
              />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">High Demand</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-350 select-none">
              <input
                type="checkbox"
                checked={formData.is_verified === undefined ? true : !!formData.is_verified}
                onChange={(e) => setFormData(prev => ({ ...prev, is_verified: e.target.checked }))}
                className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
              />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">TripGod Verified</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-350 select-none">
              <input
                type="checkbox"
                checked={!!formData.is_limited_offer}
                onChange={(e) => setFormData(prev => ({ ...prev, is_limited_offer: e.target.checked }))}
                className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
              />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Limited Offer</span>
            </label>
          </div>


          {/* Highlights Section (Why Guests Love) - JSON editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Why Guests Love Highlights</label>
              <button
                type="button"
                onClick={() => {
                  const current = formData.why_guests_love || [];
                  setFormData(prev => ({
                    ...prev,
                    why_guests_love: [...current, { icon: 'Star', text: '' }]
                  }));
                }}
                className="py-1 px-2.5 bg-[#FF5F00]/10 hover:bg-[#FF5F00]/25 text-[#FF5F00] font-black text-[9px] uppercase tracking-wider rounded-lg border border-[#FF5F00]/20 cursor-pointer transition-all"
              >
                + Add Highlight Card
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(formData.why_guests_love || []).map((highlight, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-900/30 p-2 border border-slate-800 rounded-xl">
                  <select
                    value={highlight.icon || 'Star'}
                    onChange={(e) => {
                      const updated = [...(formData.why_guests_love || [])];
                      updated[idx] = { ...updated[idx], icon: e.target.value };
                      setFormData(prev => ({ ...prev, why_guests_love: updated }));
                    }}
                    className="bg-slate-900 border border-[#2b3547] rounded-lg px-2.5 py-1.5 text-white focus:outline-none text-xs w-36"
                  >
                    {['Waves', 'Wifi', 'Car', 'Utensils', 'Tv', 'Mountain', 'Bell', 'Zap', 'Flame', 'ShieldCheck', 'Check', 'Heart', 'MapPin', 'Compass', 'Coffee', 'Sparkles', 'Smile', 'ThumbsUp', 'CalendarCheck', 'Lock', 'RefreshCw', 'HelpCircle', 'Star'].map(ic => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 Min Walk To Laxman Jhula"
                    value={highlight.text || ''}
                    onChange={(e) => {
                      const updated = [...(formData.why_guests_love || [])];
                      updated[idx] = { ...updated[idx], text: e.target.value };
                      setFormData(prev => ({ ...prev, why_guests_love: updated }));
                    }}
                    className="flex-1 bg-slate-900 border border-[#2b3547] rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.why_guests_love || []).filter((_, i) => i !== idx);
                      setFormData(prev => ({ ...prev, why_guests_love: updated }));
                    }}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-550 border border-rose-500/20 rounded-lg cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {(formData.why_guests_love || []).length === 0 && (
                <p className="text-[10px] text-gray-500 font-medium italic">No highlights added yet. Click "+ Add Highlight Card" above.</p>
              )}
            </div>
          </div>

          {/* Quick Facts (Best For & Perfect For) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Best For list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Listing Card Badges / Quick Facts (Best For)</label>
                <button
                  type="button"
                  onClick={() => {
                    const current = formData.best_for || [];
                    setFormData(prev => ({
                      ...prev,
                      best_for: [...current, '']
                    }));
                  }}
                  className="py-0.5 px-2 bg-[#FF5F00]/10 hover:bg-[#FF5F00]/25 text-[#FF5F00] font-black text-[9px] uppercase tracking-wider rounded border border-[#FF5F00]/20 cursor-pointer"
                >
                  + Add Fact
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(formData.best_for || []).map((fact, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Couples Welcome"
                      value={fact}
                      onChange={(e) => {
                        const updated = [...(formData.best_for || [])];
                        updated[idx] = e.target.value;
                        setFormData(prev => ({ ...prev, best_for: updated }));
                      }}
                      className="flex-1 bg-slate-900 border border-[#2b3547] rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.best_for || []).filter((_, i) => i !== idx);
                        setFormData(prev => ({ ...prev, best_for: updated }));
                      }}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-550 border border-rose-500/20 rounded-lg cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {(formData.best_for || []).length === 0 && (
                  <p className="text-[10px] text-gray-500 font-medium italic">No Quick Facts (Best For) items. Click "+ Add Fact".</p>
                )}
              </div>
            </div>

            {/* Perfect For checklist */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Perfect For (Target Travelers)</label>
              <div className="grid grid-cols-2 gap-2 text-slate-350">
                {['Couples', 'Families', 'Backpackers', 'Riders', 'Adventure Travelers'].map(pf => {
                  const perfectList = formData.perfect_for || [];
                  const isChecked = perfectList.includes(pf);
                  return (
                    <label key={pf} className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let updated = [...perfectList];
                          if (e.target.checked) {
                            updated.push(pf);
                          } else {
                            updated = updated.filter(item => item !== pf);
                          }
                          setFormData(prev => ({ ...prev, perfect_for: updated }));
                        }}
                        className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
                      />
                      <span>{pf}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TripGod Trust Benefits - JSON editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">TripGod Trust Benefits</label>
              <button
                type="button"
                onClick={() => {
                  const current = formData.benefits || [];
                  setFormData(prev => ({
                    ...prev,
                    benefits: [...current, { icon: 'Lock', title: '', desc: '' }]
                  }));
                }}
                className="py-1 px-2.5 bg-[#FF5F00]/10 hover:bg-[#FF5F00]/25 text-[#FF5F00] font-black text-[9px] uppercase tracking-wider rounded-lg border border-[#FF5F00]/20 cursor-pointer transition-all"
              >
                + Add Benefit Card
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(formData.benefits || []).map((benefit, idx) => (
                <div key={idx} className="p-3 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.benefits || []).filter((_, i) => i !== idx);
                      setFormData(prev => ({ ...prev, benefits: updated }));
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-550 border border-rose-500/20 rounded-lg cursor-pointer"
                  >
                    <X size={12} />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider">Benefit Icon</label>
                      <select
                        value={benefit.icon || 'Lock'}
                        onChange={(e) => {
                          const updated = [...(formData.benefits || [])];
                          updated[idx] = { ...updated[idx], icon: e.target.value };
                          setFormData(prev => ({ ...prev, benefits: updated }));
                        }}
                        className="w-full bg-slate-900 border border-[#2b3547] rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs"
                      >
                        {['Lock', 'CalendarCheck', 'RefreshCw', 'HelpCircle', 'ShieldCheck', 'CircleDollarSign', 'Award', 'Sparkles'].map(ic => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider">Benefit Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Secure Payment"
                        value={benefit.title || ''}
                        onChange={(e) => {
                          const updated = [...(formData.benefits || [])];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setFormData(prev => ({ ...prev, benefits: updated }));
                        }}
                        className="w-full bg-slate-900 border border-[#2b3547] rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Protected by Razorpay SECURE payment gate"
                      value={benefit.desc || ''}
                      onChange={(e) => {
                        const updated = [...(formData.benefits || [])];
                        updated[idx] = { ...updated[idx], desc: e.target.value };
                        setFormData(prev => ({ ...prev, benefits: updated }));
                      }}
                      className="w-full bg-slate-900 border border-[#2b3547] rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs"
                    />
                  </div>
                </div>
              ))}
              {(formData.benefits || []).length === 0 && (
                <p className="text-[10px] text-gray-500 font-medium italic">No trust benefits added yet. Click "+ Add Benefit Card" above.</p>
              )}
            </div>
          </div>

          {/* Nearby Attractions - Dynamic List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Nearby Attractions</label>
              <button
                type="button"
                onClick={() => {
                  const currentList = formData.attractions || [];
                  setFormData(prev => ({
                    ...prev,
                    attractions: [...currentList, { name: '', distance: '', maps_url: '' }]
                  }));
                }}
                className="py-1 px-2.5 bg-[#FF5F00]/10 hover:bg-[#FF5F00]/25 text-[#FF5F00] font-black text-[9px] uppercase tracking-wider rounded-lg border border-[#FF5F00]/20 cursor-pointer transition-all"
              >
                + Add Attraction
              </button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {(formData.attractions || []).map((attraction, idx) => (
                <div key={idx} className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2.5 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.attractions || []).filter((_, i) => i !== idx);
                      setFormData(prev => ({ ...prev, attractions: updated }));
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-rose-550/10 hover:bg-rose-500/20 text-rose-550 border border-rose-500/20 rounded-lg cursor-pointer transition-colors"
                    title="Remove Attraction"
                  >
                    <X size={12} />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider">Attraction Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Laxman Jhula"
                        value={attraction.name || ''}
                        onChange={(e) => {
                          const updated = [...(formData.attractions || [])];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setFormData(prev => ({ ...prev, attractions: updated }));
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider">Distance</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1.5 KM"
                        value={attraction.distance || ''}
                        onChange={(e) => {
                          const updated = [...(formData.attractions || [])];
                          updated[idx] = { ...updated[idx], distance: e.target.value };
                          setFormData(prev => ({ ...prev, attractions: updated }));
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider">Google Maps URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://maps.google.com/?q=..."
                      value={attraction.maps_url || ''}
                      onChange={(e) => {
                        const updated = [...(formData.attractions || [])];
                        updated[idx] = { ...updated[idx], maps_url: e.target.value };
                        setFormData(prev => ({ ...prev, attractions: updated }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs"
                    />
                  </div>
                </div>
              ))}
              {(formData.attractions || []).length === 0 && (
                <p className="text-[10px] text-gray-500 font-medium italic">No attractions added yet. Click "+ Add Attraction" above.</p>
              )}
            </div>
          </div>

          {/* Amenities checkboxes */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Amenities</label>
            <div className="grid grid-cols-3 gap-2.5 text-slate-300">
              {['wifi', 'ac', 'parking', 'restaurant', 'tv', 'mountain_view', 'river_view', 'room_service', 'power_backup', 'geyser'].map(am => (
                <label key={am} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.amenities?.[am]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      amenities: { ...prev.amenities, [am]: e.target.checked }
                    }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
                  />
                  <span className="capitalize">{am.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rules switches */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">House Rules</label>
            <div className="grid grid-cols-3 gap-4 text-slate-300">
              {[
                { key: 'unmarried_couples', label: 'Unmarried Couples Allowed' },
                { key: 'pets', label: 'Pets Allowed' },
                { key: 'smoking', label: 'Smoking Allowed' },
                { key: 'id_required', label: 'Govt ID Required' },
                { key: 'min_age_18', label: '18+ Primary Guest' },
                { key: 'alcohol_allowed', label: 'Alcohol Allowed' },
                { key: 'visitors_allowed', label: 'Visitors Allowed' }
              ].map(rule => (
                <label key={rule.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.rules?.[rule.key]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: { ...prev.rules, [rule.key]: e.target.checked }
                    }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
                  />
                  <span>{rule.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Meal Policy & Add-ons Configuration */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-accent tracking-wider font-display">Meal Policy & Add-ons</label>
              <p className="text-[9px] text-gray-550">Configure dining choices for guests. If a meal is paid, it will be offered as an add-on check box during booking and calculated per person per night.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Breakfast Policy */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-2">
                <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wider">🍳 Breakfast</label>
                <select
                  value={formData.rules?.meals?.breakfast?.status || 'none'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      meals: {
                        ...(prev.rules?.meals || {}),
                        breakfast: {
                          status: e.target.value,
                          price: e.target.value === 'paid' ? (prev.rules?.meals?.breakfast?.price || 150) : 0
                        }
                      }
                    }
                  }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs cursor-pointer focus:outline-none"
                >
                  <option value="none">Not Available</option>
                  <option value="free">Free / Included</option>
                  <option value="paid">Paid Add-on</option>
                </select>
                {formData.rules?.meals?.breakfast?.status === 'paid' && (
                  <div className="space-y-1 pt-1 animate-fadeIn">
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Price / Guest / Night (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150"
                      value={formData.rules?.meals?.breakfast?.price || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          meals: {
                            ...(prev.rules?.meals || {}),
                            breakfast: {
                              status: 'paid',
                              price: e.target.value === '' ? '' : Number(e.target.value)
                            }
                          }
                        }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>

              {/* Lunch Policy */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-2">
                <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wider">🍲 Lunch</label>
                <select
                  value={formData.rules?.meals?.lunch?.status || 'none'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      meals: {
                        ...(prev.rules?.meals || {}),
                        lunch: {
                          status: e.target.value,
                          price: e.target.value === 'paid' ? (prev.rules?.meals?.lunch?.price || 250) : 0
                        }
                      }
                    }
                  }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs cursor-pointer focus:outline-none"
                >
                  <option value="none">Not Available</option>
                  <option value="free">Free / Included</option>
                  <option value="paid">Paid Add-on</option>
                </select>
                {formData.rules?.meals?.lunch?.status === 'paid' && (
                  <div className="space-y-1 pt-1 animate-fadeIn">
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Price / Guest / Night (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 250"
                      value={formData.rules?.meals?.lunch?.price || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          meals: {
                            ...(prev.rules?.meals || {}),
                            lunch: {
                              status: 'paid',
                              price: e.target.value === '' ? '' : Number(e.target.value)
                            }
                          }
                        }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>

              {/* Dinner Policy */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-2">
                <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wider">🍽️ Dinner</label>
                <select
                  value={formData.rules?.meals?.dinner?.status || 'none'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      meals: {
                        ...(prev.rules?.meals || {}),
                        dinner: {
                          status: e.target.value,
                          price: e.target.value === 'paid' ? (prev.rules?.meals?.dinner?.price || 300) : 0
                        }
                      }
                    }
                  }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs cursor-pointer focus:outline-none"
                >
                  <option value="none">Not Available</option>
                  <option value="free">Free / Included</option>
                  <option value="paid">Paid Add-on</option>
                </select>
                {formData.rules?.meals?.dinner?.status === 'paid' && (
                  <div className="space-y-1 pt-1 animate-fadeIn">
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Price / Guest / Night (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 300"
                      value={formData.rules?.meals?.dinner?.price || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          meals: {
                            ...(prev.rules?.meals || {}),
                            dinner: {
                              status: 'paid',
                              price: e.target.value === '' ? '' : Number(e.target.value)
                            }
                          }
                        }
                      }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Unified Badge & Tag Settings (Multiple Badges) */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-accent tracking-wider font-display">Custom Badge & Tags Settings (Dual Badges)</label>
              <p className="text-[9px] text-gray-550">Configure up to two distinct highlights or labels to display across the application to increase conversion.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Homepage Card Badges */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-3">
                <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wider">🏠 Homepage Card</label>
                
                {/* Badge 1 */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Badge 1</label>
                  <select
                    value={formData.rules?.badge_settings?.home_badge1 || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        badge_settings: { ...(prev.rules?.badge_settings || {}), home_badge1: e.target.value }
                      }
                    }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="💕 Couple Friendly">💕 Couple Friendly</option>
                    <option value="🏆 Best Value">🏆 Best Value</option>
                    <option value="⭐ Top Rated">⭐ Top Rated</option>
                    <option value="🔥 Limited Offer">🔥 Limited Offer</option>
                    <option value="👪 Family Choice">👪 Family Choice</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom badge 1..."
                    value={['', '💕 Couple Friendly', '🏆 Best Value', '⭐ Top Rated', '🔥 Limited Offer', '👪 Family Choice'].includes(formData.rules?.badge_settings?.home_badge1) ? '' : (formData.rules?.badge_settings?.home_badge1 || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          badge_settings: { ...(prev.rules?.badge_settings || {}), home_badge1: val }
                        }
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none mt-1"
                  />
                </div>

                {/* Badge 2 */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Badge 2</label>
                  <select
                    value={formData.rules?.badge_settings?.home_badge2 || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        badge_settings: { ...(prev.rules?.badge_settings || {}), home_badge2: e.target.value }
                      }
                    }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="💕 Couple Friendly">💕 Couple Friendly</option>
                    <option value="🏆 Best Value">🏆 Best Value</option>
                    <option value="⭐ Top Rated">⭐ Top Rated</option>
                    <option value="🔥 Limited Offer">🔥 Limited Offer</option>
                    <option value="👪 Family Choice">👪 Family Choice</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom badge 2..."
                    value={['', '💕 Couple Friendly', '🏆 Best Value', '⭐ Top Rated', '🔥 Limited Offer', '👪 Family Choice'].includes(formData.rules?.badge_settings?.home_badge2) ? '' : (formData.rules?.badge_settings?.home_badge2 || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          badge_settings: { ...(prev.rules?.badge_settings || {}), home_badge2: val }
                        }
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none mt-1"
                  />
                </div>
              </div>

              {/* Hotels List Card Badges */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-3">
                <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wider">🏨 Hotels Search List</label>
                
                {/* Badge 1 */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Badge 1</label>
                  <select
                    value={formData.rules?.badge_settings?.list_badge1 || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        badge_settings: { ...(prev.rules?.badge_settings || {}), list_badge1: e.target.value }
                      }
                    }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="💕 Couple Friendly">💕 Couple Friendly</option>
                    <option value="🏆 Best Value">🏆 Best Value</option>
                    <option value="⭐ Top Rated">⭐ Top Rated</option>
                    <option value="🔥 Limited Offer">🔥 Limited Offer</option>
                    <option value="👪 Family Choice">👪 Family Choice</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom badge 1..."
                    value={['', '💕 Couple Friendly', '🏆 Best Value', '⭐ Top Rated', '🔥 Limited Offer', '👪 Family Choice'].includes(formData.rules?.badge_settings?.list_badge1) ? '' : (formData.rules?.badge_settings?.list_badge1 || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          badge_settings: { ...(prev.rules?.badge_settings || {}), list_badge1: val }
                        }
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none mt-1"
                  />
                </div>

                {/* Badge 2 */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Badge 2</label>
                  <select
                    value={formData.rules?.badge_settings?.list_badge2 || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        badge_settings: { ...(prev.rules?.badge_settings || {}), list_badge2: e.target.value }
                      }
                    }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="💕 Couple Friendly">💕 Couple Friendly</option>
                    <option value="🏆 Best Value">🏆 Best Value</option>
                    <option value="⭐ Top Rated">⭐ Top Rated</option>
                    <option value="🔥 Limited Offer">🔥 Limited Offer</option>
                    <option value="👪 Family Choice">👪 Family Choice</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom badge 2..."
                    value={['', '💕 Couple Friendly', '🏆 Best Value', '⭐ Top Rated', '🔥 Limited Offer', '👪 Family Choice'].includes(formData.rules?.badge_settings?.list_badge2) ? '' : (formData.rules?.badge_settings?.list_badge2 || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          badge_settings: { ...(prev.rules?.badge_settings || {}), list_badge2: val }
                        }
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none mt-1"
                  />
                </div>
              </div>

              {/* Hotel Details drawer Header Badges */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-3">
                <label className="block text-[9.5px] font-black text-gray-400 uppercase tracking-wider">📄 Details Page Header</label>
                
                {/* Badge 1 */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Badge 1</label>
                  <select
                    value={formData.rules?.badge_settings?.detail_badge1 || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        badge_settings: { ...(prev.rules?.badge_settings || {}), detail_badge1: e.target.value }
                      }
                    }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="💕 Couple Friendly">💕 Couple Friendly</option>
                    <option value="🏆 Best Value">🏆 Best Value</option>
                    <option value="⭐ Top Rated">⭐ Top Rated</option>
                    <option value="🔥 Limited Offer">🔥 Limited Offer</option>
                    <option value="👪 Family Choice">👪 Family Choice</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom badge 1..."
                    value={['', '💕 Couple Friendly', '🏆 Best Value', '⭐ Top Rated', '🔥 Limited Offer', '👪 Family Choice'].includes(formData.rules?.badge_settings?.detail_badge1) ? '' : (formData.rules?.badge_settings?.detail_badge1 || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          badge_settings: { ...(prev.rules?.badge_settings || {}), detail_badge1: val }
                        }
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none mt-1"
                  />
                </div>

                {/* Badge 2 */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Badge 2</label>
                  <select
                    value={formData.rules?.badge_settings?.detail_badge2 || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        badge_settings: { ...(prev.rules?.badge_settings || {}), detail_badge2: e.target.value }
                      }
                    }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="💕 Couple Friendly">💕 Couple Friendly</option>
                    <option value="🏆 Best Value">🏆 Best Value</option>
                    <option value="⭐ Top Rated">⭐ Top Rated</option>
                    <option value="🔥 Limited Offer">🔥 Limited Offer</option>
                    <option value="👪 Family Choice">👪 Family Choice</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom badge 2..."
                    value={['', '💕 Couple Friendly', '🏆 Best Value', '⭐ Top Rated', '🔥 Limited Offer', '👪 Family Choice'].includes(formData.rules?.badge_settings?.detail_badge2) ? '' : (formData.rules?.badge_settings?.detail_badge2 || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        rules: {
                          ...prev.rules,
                          badge_settings: { ...(prev.rules?.badge_settings || {}), detail_badge2: val }
                        }
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Room Categories Configuration */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <label className="block text-[10px] font-black uppercase text-accent tracking-wider font-display">Room Categories (Multiple Rooms Setup)</label>
              <button
                type="button"
                onClick={() => {
                  const currentRooms = formData.rules?.room_categories || [];
                  setFormData(prev => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      room_categories: [
                        ...currentRooms,
                        { name: 'Suite Room', price: 3500, original_price: '', images: [] }
                      ]
                    }
                  }));
                }}
                className="text-[10px] font-bold text-accent hover:text-white bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                + Add Room Category
              </button>
            </div>

            {(!formData.rules?.room_categories || formData.rules.room_categories.length === 0) ? (
              <p className="text-[10px] text-gray-500 italic">No alternative room categories defined. Only the primary pricing (₹{formData.price || 0}/Night) will be selectable.</p>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {formData.rules.room_categories.map((room, rIdx) => (
                  <div key={rIdx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl relative space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const currentRooms = [...(formData.rules?.room_categories || [])];
                        currentRooms.splice(rIdx, 1);
                        setFormData(prev => ({
                          ...prev,
                          rules: { ...prev.rules, room_categories: currentRooms }
                        }));
                      }}
                      className="absolute top-2.5 right-2.5 text-red-500 hover:text-red-400 font-black text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Delete Room
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-20">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Room Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Executive Suite Room"
                          value={room.name || ''}
                          onChange={(e) => {
                            const rooms = [...(formData.rules?.room_categories || [])];
                            rooms[rIdx].name = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              rules: { ...prev.rules, room_categories: rooms }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Price / Night (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="Price per night"
                          value={room.price || ''}
                          onChange={(e) => {
                            const rooms = [...(formData.rules?.room_categories || [])];
                            rooms[rIdx].price = e.target.value === '' ? '' : Number(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              rules: { ...prev.rules, room_categories: rooms }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Original Price (₹ - Optional)</label>
                        <input
                          type="number"
                          placeholder="Strikethrough Price"
                          value={room.original_price || ''}
                          onChange={(e) => {
                            const rooms = [...(formData.rules?.room_categories || [])];
                            rooms[rIdx].original_price = e.target.value === '' ? '' : Number(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              rules: { ...prev.rules, room_categories: rooms }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Room Images — Multi-upload + Thumbnails + URL Paste */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Room Images</label>

                      {/* Existing image thumbnails */}
                      {Array.isArray(room.images) && room.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {room.images.map((url, imgIdx) => (
                            <div key={imgIdx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                              <img src={url} alt={`Room ${imgIdx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  const rooms = [...(formData.rules?.room_categories || [])];
                                  rooms[rIdx].images = rooms[rIdx].images.filter((_, i) => i !== imgIdx);
                                  setFormData(prev => ({ ...prev, rules: { ...prev.rules, room_categories: rooms } }));
                                }}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity border-0"
                                title="Remove image"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload button */}
                      <div>
                        <label className="flex items-center gap-2 py-2 px-3 bg-[#FF5F00]/10 hover:bg-[#FF5F00]/20 border border-[#FF5F00]/30 rounded-lg cursor-pointer transition-all w-fit">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF5F00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span className="text-[10px] font-black text-[#FF5F00] uppercase tracking-wider">Upload Images</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files);
                              if (!files.length) return;
                              const uploadedUrls = [];
                              for (const file of files) {
                                const ext = file.name.split('.').pop();
                                const randName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
                                const filePath = `listings/${randName}`;
                                const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
                                if (uploadError) { alert('Upload failed: ' + uploadError.message); continue; }
                                const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
                                uploadedUrls.push(urlData.publicUrl);
                              }
                              if (uploadedUrls.length > 0) {
                                const rooms = [...(formData.rules?.room_categories || [])];
                                const existingImages = Array.isArray(rooms[rIdx].images) ? rooms[rIdx].images : [];
                                rooms[rIdx].images = [...existingImages, ...uploadedUrls];
                                setFormData(prev => ({ ...prev, rules: { ...prev.rules, room_categories: rooms } }));
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <p className="text-[8px] text-gray-500 mt-1">Select multiple files at once. Uploads directly to storage.</p>
                      </div>

                      {/* Manual URL paste */}
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase tracking-wider">Or paste URL(s) — comma separated</label>
                        <textarea
                          placeholder="https://... , https://..."
                          value=""
                          onChange={(e) => {
                            const newUrls = e.target.value.split(',').map(url => url.trim()).filter(Boolean);
                            if (newUrls.length > 0) {
                              const rooms = [...(formData.rules?.room_categories || [])];
                              const existingImages = Array.isArray(rooms[rIdx].images) ? rooms[rIdx].images : [];
                              rooms[rIdx].images = [...existingImages, ...newUrls];
                              setFormData(prev => ({ ...prev, rules: { ...prev.rules, room_categories: rooms } }));
                              e.target.value = '';
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none h-[40px] font-mono resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Landmarks Dynamic List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Nearby Landmarks</label>
              <button
                type="button"
                onClick={() => {
                  const currentList = formData.landmarks || [];
                  setFormData(prev => ({
                    ...prev,
                    landmarks: [...currentList, '']
                  }));
                }}
                className="py-1 px-2.5 bg-[#FF5F00]/10 hover:bg-[#FF5F00]/25 text-[#FF5F00] font-black text-[9px] uppercase tracking-wider rounded-lg border border-[#FF5F00]/20 cursor-pointer transition-all"
              >
                + Add Landmark
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(formData.landmarks || []).map((landmark, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ram Jhula - 1.2 KM"
                    value={landmark}
                    onChange={(e) => {
                      const updated = [...(formData.landmarks || [])];
                      updated[idx] = e.target.value;
                      setFormData(prev => ({ ...prev, landmarks: updated }));
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.landmarks || []).filter((_, i) => i !== idx);
                      setFormData(prev => ({ ...prev, landmarks: updated }));
                    }}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-550 border border-rose-500/20 rounded-xl cursor-pointer transition-colors flex items-center justify-center"
                    title="Remove Landmark"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(formData.landmarks || []).length === 0 && (
                <p className="text-[10px] text-gray-500 font-medium italic">No landmarks added yet. Click "+ Add Landmark" above.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ADVENTURES FIELDS ----------------- */}
      {['rafting', 'adventures'].includes(type) && (
        <div className="space-y-4 border-t border-slate-900 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {formData.activity_type === 'rafting' ? 'Route' : (formData.activity_type === 'camping' ? 'Campsite Location' : 'Location/Detail')}
              </label>
              <input
                type="text"
                required
                value={formData.route || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, route: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder={
                  formData.activity_type === 'rafting' ? 'e.g. Shivpuri to Nim Beach' : 
                  (formData.activity_type === 'camping' ? 'e.g. Shivpuri Riverbank' : 'e.g. 117 Metres / Shivpuri Hills')
                }
              />
            </div>

            {formData.activity_type !== 'camping' ? (
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  {formData.activity_type === 'rafting' ? 'Distance (KM)' : 'Height/Distance value'}
                </label>
                <input
                  type="number"
                  required
                  value={formData.distance_km || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, distance_km: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Camp Type</label>
                <input
                  type="text"
                  placeholder="e.g. Swiss Luxury Tents"
                  value={formData.route_details || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, route_details: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Duration</label>
              <input
                type="text"
                required
                value={formData.duration || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder={formData.activity_type === 'camping' ? 'e.g. 1 Night / 2 Days' : 'e.g. 2 Hours / 3 Days'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center text-slate-350 bg-slate-900/10 p-3.5 rounded-2xl border border-slate-800/40">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!formData.pickup_included}
                onChange={(e) => setFormData(prev => ({ ...prev, pickup_included: e.target.checked }))}
                className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
              />
              <span className="text-xs font-semibold">Pickup Included</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!formData.drop_included}
                onChange={(e) => setFormData(prev => ({ ...prev, drop_included: e.target.checked }))}
                className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
              />
              <span className="text-xs font-semibold">Drop Included</span>
            </label>

            <div className="space-y-1">
              <label className="block text-[9px] font-black uppercase text-gray-400 tracking-wider">Age Limit</label>
              {formData.activity_type === 'camping' ? (
                <div className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-400 text-[11px] font-semibold">
                  18+ (Primary Guest)
                </div>
              ) : (
                <input
                  type="number"
                  required
                  value={formData.age_limit || 12}
                  onChange={(e) => setFormData(prev => ({ ...prev, age_limit: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none text-xs"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-black uppercase text-gray-400 tracking-wider">Free Video Option</label>
              <select
                value={formData.free_video_type || 'none'}
                onChange={(e) => setFormData(prev => ({ ...prev, free_video_type: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none text-[11px] font-bold"
              >
                <option value="none">No Video Included</option>
                <option value="gopro">GoPro Video Included</option>
                <option value="dslr">DSLR Video Included</option>
              </select>
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Inclusions Dynamic List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Inclusions</label>
                <button
                  type="button"
                  onClick={() => addArrayItem('inclusions')}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-300 font-bold cursor-pointer"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(formData.inclusions || []).map((inc, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={inc}
                      onChange={(e) => handleArrayChange('inclusions', idx, e.target.value)}
                      className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none"
                      placeholder="Inclusion item"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('inclusions', idx)}
                      className="p-1 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusions Dynamic List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Exclusions</label>
                <button
                  type="button"
                  onClick={() => addArrayItem('exclusions')}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-300 font-bold cursor-pointer"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(formData.exclusions || []).map((exc, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={exc}
                      onChange={(e) => handleArrayChange('exclusions', idx, e.target.value)}
                      className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none"
                      placeholder="Exclusion item"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('exclusions', idx)}
                      className="p-1 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Operators & Pricing */}
          <div className="space-y-3 pt-4 border-t border-slate-900">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Operators & Pricing</label>
              <p className="text-[10px] text-gray-500">Enable/disable operators and set their custom prices for this adventure package.</p>
            </div>
            
            <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
              {getVendorsForType(formData.activity_type || 'rafting', vendors).length === 0 ? (
                <div className="p-4 text-center text-slate-500 font-semibold italic text-[11px]">
                  No vendors found with category matching "{formData.activity_type || 'rafting'}". Please add a vendor in the Vendors tab first!
                </div>
              ) : (
                getVendorsForType(formData.activity_type || 'rafting', vendors).map(vendor => {
                const opState = activitiesOperators[vendor.id] || { enabled: false, price: '', original_price: '', commission_percentage: '', whatsapp_number: '' };
                return (
                  <div key={vendor.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 hover:bg-slate-900/50 transition-colors">
                    {/* Left: Checkbox and Vendor Name */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <input
                        type="checkbox"
                        checked={opState.enabled}
                        onChange={(e) => {
                          setActivitiesOperators(prev => ({
                            ...prev,
                            [vendor.id]: {
                              ...prev[vendor.id],
                              enabled: e.target.checked,
                              price: prev[vendor.id]?.price || '',
                              original_price: prev[vendor.id]?.original_price || '',
                              commission_percentage: prev[vendor.id]?.commission_percentage || '',
                              whatsapp_number: prev[vendor.id]?.whatsapp_number || vendor.whatsapp || '',
                              operator_logo: prev[vendor.id]?.operator_logo || '',
                              years_of_experience: prev[vendor.id]?.years_of_experience || '',
                              is_govt_approved: prev[vendor.id]?.is_govt_approved || false,
                              safety_rating: prev[vendor.id]?.safety_rating || 4.5,
                              full_payment_upi_discount: prev[vendor.id]?.full_payment_upi_discount || 0
                            }
                          }));
                        }}
                        className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-white block">{vendor.name}</span>
                        <span className="text-[9px] text-slate-500 font-semibold">{vendor.landmark || 'Rishikesh'}</span>
                      </div>
                    </div>

                    {/* Right: Price inputs (only editable if enabled) */}
                    {opState.enabled ? (
                      <div className="flex-grow space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Price (₹)</label>
                            <input
                              type="number"
                              required
                              value={opState.price}
                              onChange={(e) => {
                                setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    price: Number(e.target.value)
                                  }
                                }));
                              }}
                              placeholder="Price"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Original Price (₹)</label>
                            <input
                              type="number"
                              value={opState.original_price}
                              onChange={(e) => {
                                setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    original_price: e.target.value === '' ? '' : Number(e.target.value)
                                  }
                                }));
                              }}
                              placeholder="Strikethrough"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">WhatsApp</label>
                            <input
                              type="text"
                              value={opState.whatsapp_number}
                              onChange={(e) => {
                                setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    whatsapp_number: e.target.value
                                  }
                                }));
                              }}
                              placeholder="WhatsApp Number"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Payment Mode</label>
                            <select
                              value={opState.payment_mode || 'commission_advance'}
                              onChange={(e) => {
                                setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    payment_mode: e.target.value
                                  }
                                }));
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-350 text-[11px] focus:outline-none font-semibold"
                            >
                              <option value="commission_advance">Percentage Advance</option>
                              <option value="fixed_advance">Flat Rate Advance</option>
                              <option value="full_payment">Full 100% Online</option>
                            </select>
                          </div>
                        </div>

                        {/* Payment Settings Details Sub-Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(opState.payment_mode === 'commission_advance' || !opState.payment_mode) && (
                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Commission (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={opState.commission_percentage}
                                onChange={(e) => {
                                  setActivitiesOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      commission_percentage: e.target.value === '' ? '' : Number(e.target.value)
                                    }
                                  }));
                                }}
                                placeholder="e.g. 10"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                              />
                            </div>
                          )}

                          {opState.payment_mode === 'fixed_advance' && (
                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Fixed Advance Amount (₹)</label>
                              <input
                                type="number"
                                min="0"
                                value={opState.fixed_advance_amount !== null && opState.fixed_advance_amount !== undefined ? opState.fixed_advance_amount : ''}
                                onChange={(e) => {
                                  setActivitiesOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      fixed_advance_amount: e.target.value === '' ? '' : Number(e.target.value)
                                    }
                                  }));
                                }}
                                placeholder="e.g. 200"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="col-span-2 sm:col-span-5 text-[8px] font-black text-accent uppercase tracking-wider mt-1 border-t border-slate-900 pt-1.5">
                            Trust & Itinerary Metrics
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Logo URL</label>
                            <input
                              type="text"
                              value={opState.operator_logo || ''}
                              onChange={(e) => {
                                setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    operator_logo: e.target.value
                                  }
                                }));
                              }}
                              placeholder="https://example.com/logo.png"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Years Exp</label>
                            <input
                              type="number"
                              value={opState.years_of_experience || ''}
                              onChange={(e) => {
                                setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    years_of_experience: e.target.value === '' ? '' : Number(e.target.value)
                                  }
                                }));
                              }}
                              placeholder="e.g. 5"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Safety Rating</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={opState.safety_rating || ''}
                              onChange={(e) => {
                                setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    safety_rating: e.target.value === '' ? '' : Number(e.target.value)
                                  }
                                }));
                              }}
                              placeholder="4.8"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">UPI Discount (₹)</label>
                            <input
                              type="number"
                              value={opState.full_payment_upi_discount || ''}
                              onChange={(e) => {
                                setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    full_payment_upi_discount: e.target.value === '' ? '' : Number(e.target.value)
                                  }
                                }));
                              }}
                              placeholder="e.g. 200"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`govt-${vendor.id}`}
                            checked={!!opState.is_govt_approved}
                            onChange={(e) => {
                              setActivitiesOperators(prev => ({
                                  ...prev,
                                  [vendor.id]: {
                                    ...prev[vendor.id],
                                    is_govt_approved: e.target.checked
                                  }
                                }));
                            }}
                            className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <label htmlFor={`govt-${vendor.id}`} className="text-[10px] font-bold text-gray-400 cursor-pointer select-none">
                            Govt. Approved Agency
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-medium italic flex-grow text-right pr-4">
                        Disabled (not offering this package)
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- BIKES FIELDS ----------------- */}
      {type === 'bikes' && (
        <div className="space-y-4 border-t border-slate-900 pt-4">
          {/* Required Documents Dynamic List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Required Documents</label>
              <button
                type="button"
                onClick={() => {
                  const currentList = formData.documents || [];
                  setFormData(prev => ({
                    ...prev,
                    documents: [...currentList, '']
                  }));
                }}
                className="py-1 px-2.5 bg-[#FF5F00]/10 hover:bg-[#FF5F00]/25 text-[#FF5F00] font-black text-[9px] uppercase tracking-wider rounded-lg border border-[#FF5F00]/20 cursor-pointer transition-all"
              >
                + Add Document
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(formData.documents || []).map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Driving License"
                    value={doc}
                    onChange={(e) => {
                      const updated = [...(formData.documents || [])];
                      updated[idx] = e.target.value;
                      setFormData(prev => ({ ...prev, documents: updated }));
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.documents || []).filter((_, i) => i !== idx);
                      setFormData(prev => ({ ...prev, documents: updated }));
                    }}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl cursor-pointer transition-colors flex items-center justify-center"
                    title="Remove Document"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(formData.documents || []).length === 0 && (
                <p className="text-[10px] text-gray-500 font-medium italic">No required documents added yet. Click "+ Add Document" above.</p>
              )}
            </div>
          </div>

          {/* Operators & Pricing */}
          <div className="space-y-3 pt-4 border-t border-slate-900">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Operators & Pricing</label>
              <p className="text-[10px] text-gray-500">Enable/disable operators and set their custom prices, deposits, and pickup locations for this bike/scoty model.</p>
            </div>
            
            <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
              {vendors.filter(v => v.category === 'Bike Rental').length === 0 ? (
                <div className="p-4 text-center text-slate-500 font-semibold italic text-[11px]">
                  No vendors found with category 'Bike Rental'. Please add a vendor in the Vendors tab first!
                </div>
              ) : (
                vendors
                  .filter(v => v.category === 'Bike Rental')
                  .map(vendor => {
                  const opState = bikesOperators[vendor.id] || { enabled: false, price: '', deposit: 0, pickup_location: '' };
                  return (
                    <div key={vendor.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 hover:bg-slate-900/50 transition-colors">
                      {/* Left: Checkbox and Vendor Name */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <input
                          type="checkbox"
                          checked={opState.enabled}
                          onChange={(e) => {
                            setBikesOperators(prev => ({
                              ...prev,
                              [vendor.id]: {
                                ...prev[vendor.id],
                                enabled: e.target.checked,
                                price: prev[vendor.id]?.price || '',
                                deposit: prev[vendor.id]?.deposit !== undefined ? prev[vendor.id]?.deposit : 0,
                                pickup_location: prev[vendor.id]?.pickup_location || vendor.address || 'Rishikesh'
                              }
                            }));
                          }}
                          className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs text-white block">{vendor.name}</span>
                          <span className="text-[9px] text-slate-500 font-semibold">{vendor.address || 'Rishikesh'}</span>
                        </div>
                      </div>

                      {/* Right: Price, Deposit & Location inputs (only editable if enabled) */}
                      {opState.enabled ? (
                        <div className="flex-grow space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Price (₹ / day)</label>
                              <input
                                type="number"
                                required
                                value={opState.price}
                                onChange={(e) => {
                                  setBikesOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      price: Number(e.target.value)
                                    }
                                  }));
                                }}
                                placeholder="Price"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Security Deposit (₹)</label>
                              <input
                                type="number"
                                required
                                value={opState.deposit}
                                onChange={(e) => {
                                  setBikesOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      deposit: Number(e.target.value)
                                    }
                                  }));
                                }}
                                placeholder="Deposit"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Pickup Location</label>
                              <input
                                type="text"
                                required
                                value={opState.pickup_location}
                                onChange={(e) => {
                                  setBikesOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      pickup_location: e.target.value
                                    }
                                  }));
                                }}
                                placeholder="e.g. Tapovan, Rishikesh"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Payment Mode</label>
                              <select
                                value={opState.payment_mode || 'commission_advance'}
                                onChange={(e) => {
                                  setBikesOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      payment_mode: e.target.value
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-350 text-[11px] focus:outline-none font-semibold"
                              >
                                <option value="commission_advance">Percentage Advance</option>
                                <option value="fixed_advance">Flat Rate Advance</option>
                                <option value="full_payment">Full 100% Online</option>
                              </select>
                            </div>
                          </div>

                          {/* Payment Settings Sub-Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(opState.payment_mode === 'commission_advance' || !opState.payment_mode) && (
                              <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Commission (%)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={opState.commission_percentage !== null && opState.commission_percentage !== undefined ? opState.commission_percentage : ''}
                                  onChange={(e) => {
                                    setBikesOperators(prev => ({
                                      ...prev,
                                      [vendor.id]: {
                                        ...prev[vendor.id],
                                        commission_percentage: e.target.value === '' ? '' : Number(e.target.value)
                                      }
                                    }));
                                  }}
                                  placeholder="e.g. 10"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                                />
                              </div>
                            )}

                            {opState.payment_mode === 'fixed_advance' && (
                              <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Fixed Advance Amount (₹)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={opState.fixed_advance_amount !== null && opState.fixed_advance_amount !== undefined ? opState.fixed_advance_amount : ''}
                                  onChange={(e) => {
                                    setBikesOperators(prev => ({
                                      ...prev,
                                      [vendor.id]: {
                                        ...prev[vendor.id],
                                        fixed_advance_amount: e.target.value === '' ? '' : Number(e.target.value)
                                      }
                                    }));
                                  }}
                                  placeholder="e.g. 200"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-medium italic flex-grow text-right pr-4">
                          Disabled (not offering this model)
                        </div>
                      )}
                    </div>
                  );
                }))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TOURS FIELDS ----------------- */}
      {type === 'tours' && (
        <div className="space-y-4 border-t border-slate-900 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Tour Duration</label>
              <input
                type="text"
                required
                value={formData.duration || '3 Days / 2 Nights'}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Contact Number</label>
              <input
                type="text"
                value={formData.contact_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder="e.g. +91 99999 99999"
              />
            </div>
          </div>

          {/* Trust Factors & Policy Matrix Section Card */}
          <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 md:p-6 space-y-6 mt-4">
            <div className="border-b border-slate-900 pb-3">
              <h4 className="text-xs font-black uppercase text-accent tracking-wider font-display">
                Trust Factors & Policy Matrix
              </h4>
              <p className="text-[10px] text-gray-500 mt-1">Configure verification guidelines, dynamic inclusion/exclusion lists, micro-features, and itineraries.</p>
            </div>
            
            {/* Reporting Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Reporting Address</label>
              <input
                type="text"
                value={formData.reporting_address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, reporting_address: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder="e.g., Reporting Address: Near Lakshman Jhula, Rishikesh"
              />
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inclusions Dynamic List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Inclusions</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        inclusions: [...(prev.inclusions || []), '']
                      }));
                    }}
                    className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-300 font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(formData.inclusions || []).map((inc, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={inc}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const updated = [...(prev.inclusions || [])];
                            updated[idx] = val;
                            return { ...prev, inclusions: updated };
                          });
                        }}
                        className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none"
                        placeholder="Inclusion item"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => {
                            const updated = (prev.inclusions || []).filter((_, i) => i !== idx);
                            return { ...prev, inclusions: updated };
                          });
                        }}
                        className="p-1 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclusions Dynamic List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Exclusions</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        exclusions: [...(prev.exclusions || []), '']
                      }));
                    }}
                    className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-350 font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(formData.exclusions || []).map((exc, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={exc}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const updated = [...(prev.exclusions || [])];
                            updated[idx] = val;
                            return { ...prev, exclusions: updated };
                          });
                        }}
                        className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none"
                        placeholder="Exclusion item"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => {
                            const updated = (prev.exclusions || []).filter((_, i) => i !== idx);
                            return { ...prev, exclusions: updated };
                          });
                        }}
                        className="p-1 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tour Guidelines Dynamic List */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider font-display text-slate-300">
                  Important Tour Guidelines
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tour_guidelines: [...(prev.tour_guidelines || []), '']
                    }));
                  }}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-300 font-bold cursor-pointer"
                >
                  + Add Item
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(formData.tour_guidelines || []).map((guide, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={guide}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const updated = [...(prev.tour_guidelines || [])];
                          updated[idx] = val;
                          return { ...prev, tour_guidelines: updated };
                        });
                      }}
                      placeholder="e.g., Aadhaar Card is mandatory for verification."
                      className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => {
                          const updated = (prev.tour_guidelines || []).filter((_, i) => i !== idx);
                          return { ...prev, tour_guidelines: updated };
                        });
                      }}
                      className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {(formData.tour_guidelines || []).length === 0 && (
                  <p className="text-[10px] text-gray-500 italic">No tour guidelines added. Fallback will hide guidelines widget cleanly.</p>
                )}
              </div>
            </div>

            {/* Tour Rating & Reviews Count override fields */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1 text-left">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Tour Rating (Backend Override)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={formData.why_book_with_us?.rating || ''}
                  placeholder="e.g. 4.8"
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : '';
                    setFormData(prev => ({
                      ...prev,
                      why_book_with_us: {
                        ...(prev.why_book_with_us || { items: [] }),
                        rating: val
                      }
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF5F00]"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Reviews Count (Backend Override)
                </label>
                <input
                  type="number"
                  value={formData.why_book_with_us?.reviews_count || ''}
                  placeholder="e.g. 126"
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : '';
                    setFormData(prev => ({
                      ...prev,
                      why_book_with_us: {
                        ...(prev.why_book_with_us || { items: [] }),
                        reviews_count: val
                      }
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#FF5F00]"
                />
              </div>
            </div>

            {/* Why Book With Us Items */}
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Why Book With Us micro-features (3 Items)
              </label>
              
              <div className="space-y-3">
                {[0, 1, 2].map((idx) => {
                  const itemsList = formData.why_book_with_us?.items || [];
                  const item = itemsList[idx] || { icon: 'Ticket', title: '', desc: '' };
                  
                  return (
                    <div key={idx} className="bg-slate-905 border border-slate-900 rounded-xl p-3 grid grid-cols-3 gap-3">
                      <div className="space-y-1 col-span-3 font-bold text-slate-400 text-[9px] uppercase tracking-wider">
                        Feature {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Icon</label>
                        <select
                          value={item.icon || 'Ticket'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const list = [...(prev.why_book_with_us?.items || [])];
                              while (list.length <= idx) list.push({ icon: 'Ticket', title: '', desc: '' });
                              list[idx] = { ...list[idx], icon: val };
                              return { ...prev, why_book_with_us: { items: list } };
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"
                        >
                          <option value="Ticket">Ticket</option>
                          <option value="Shield">Shield</option>
                          <option value="Headset">Headset</option>
                          <option value="Hotel">Hotel</option>
                          <option value="Car">Car</option>
                          <option value="Utensils">Utensils</option>
                          <option value="Compass">Compass</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Title</label>
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const list = [...(prev.why_book_with_us?.items || [])];
                              while (list.length <= idx) list.push({ icon: 'Ticket', title: '', desc: '' });
                              list[idx] = { ...list[idx], title: val };
                              return { ...prev, why_book_with_us: { items: list } };
                            });
                          }}
                          placeholder="e.g. Instant Confirmation"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Description</label>
                        <input
                          type="text"
                          value={item.desc || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const list = [...(prev.why_book_with_us?.items || [])];
                              while (list.length <= idx) list.push({ icon: 'Ticket', title: '', desc: '' });
                              list[idx] = { ...list[idx], desc: val };
                              return { ...prev, why_book_with_us: { items: list } };
                            });
                          }}
                          placeholder="e.g. Secure booking immediately"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Info Tags */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Quick Info Inclusions (Tags)</label>
                <button
                  type="button"
                  onClick={() => {
                    const tag = prompt("Enter tag (e.g. Stay Included, Private AC Cab):");
                    if (tag) {
                      setFormData(prev => ({
                        ...prev,
                        quick_info_tags: [...(prev.quick_info_tags || []), tag]
                      }));
                    }
                  }}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-350 font-bold cursor-pointer"
                >
                  + Add Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.quick_info_tags || []).map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded text-xs text-white border border-slate-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        quick_info_tags: (prev.quick_info_tags || []).filter((_, i) => i !== idx)
                      }))}
                      className="text-red-500 hover:text-red-400 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(formData.quick_info_tags || []).length === 0 && (
                  <span className="text-[10px] text-gray-500 italic">No quick info tags added. Fallback will show defaults.</span>
                )}
              </div>
            </div>

            {/* Day Wise Itinerary Accordion Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Day-Wise Itinerary Accordion Builder</label>
                <button
                  type="button"
                  onClick={() => {
                    const nextDay = (formData.day_wise_itinerary || []).length + 1;
                    setFormData(prev => ({
                      ...prev,
                      day_wise_itinerary: [
                        ...(prev.day_wise_itinerary || []),
                        { day: nextDay, title: '', tags: [], description: '' }
                      ]
                    }));
                  }}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-350 font-bold cursor-pointer"
                >
                  + Add Day
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {(formData.day_wise_itinerary || []).map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-900 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[10px] text-accent">DAY {item.day || idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => {
                            const updated = (prev.day_wise_itinerary || []).filter((_, i) => i !== idx)
                              .map((dayItem, dIdx) => ({ ...dayItem, day: dIdx + 1 }));
                            return { ...prev, day_wise_itinerary: updated };
                          });
                        }}
                        className="text-red-500 hover:text-red-400 text-[10px] font-bold"
                      >
                        Remove Day
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Day Title</label>
                        <input
                          type="text"
                          required
                          value={item.title || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const updated = [...(prev.day_wise_itinerary || [])];
                              updated[idx] = { ...updated[idx], title: val };
                              return { ...prev, day_wise_itinerary: updated };
                            });
                          }}
                          placeholder="e.g. Arrival & Camp setup"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Route Tags (comma-separated)</label>
                        <input
                          type="text"
                          value={(item.tags || []).join(', ')}
                          onChange={(e) => {
                            const tagsVal = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                            setFormData(prev => {
                              const updated = [...(prev.day_wise_itinerary || [])];
                              updated[idx] = { ...updated[idx], tags: tagsVal };
                              return { ...prev, day_wise_itinerary: updated };
                            });
                          }}
                          placeholder="e.g. Pickup, Luxury Camp"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Stay Location/Place Name</label>
                        <input
                          type="text"
                          value={item.stay || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const updated = [...(prev.day_wise_itinerary || [])];
                              updated[idx] = { ...updated[idx], stay: val };
                              return { ...prev, day_wise_itinerary: updated };
                            });
                          }}
                          placeholder="e.g. Deluxe Camps, Rishikesh"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Meals (comma-separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(item.meals) ? item.meals.join(', ') : (item.meals || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const updated = [...(prev.day_wise_itinerary || [])];
                              updated[idx] = { ...updated[idx], meals: val.split(',').map(m => m.trim()).filter(Boolean) };
                              return { ...prev, day_wise_itinerary: updated };
                            });
                          }}
                          placeholder="e.g. Breakfast, Dinner"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Activities (comma-separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(item.activities) ? item.activities.join(', ') : (item.activities || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const updated = [...(prev.day_wise_itinerary || [])];
                              updated[idx] = { ...updated[idx], activities: val.split(',').map(a => a.trim()).filter(Boolean) };
                              return { ...prev, day_wise_itinerary: updated };
                            });
                          }}
                          placeholder="e.g. Trekking, Sightseeing"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase">Image URLs (comma-separated)</label>
                        <input
                          type="text"
                          value={Array.isArray(item.images) ? item.images.join(', ') : (item.images || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const updated = [...(prev.day_wise_itinerary || [])];
                              updated[idx] = { ...updated[idx], images: val.split(',').map(img => img.trim()).filter(Boolean) };
                              return { ...prev, day_wise_itinerary: updated };
                            });
                          }}
                          placeholder="e.g. https://images.com/pic1.jpg"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black text-gray-500 uppercase">Description</label>
                      <textarea
                        required
                        value={item.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const updated = [...(prev.day_wise_itinerary || [])];
                            updated[idx] = { ...updated[idx], description: val };
                            return { ...prev, day_wise_itinerary: updated };
                          });
                        }}
                        rows={2}
                        placeholder="Description of the day's route..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Premium Experience Details Section Card */}
          <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 md:p-6 space-y-6 mt-4">
            <div className="border-b border-slate-900 pb-3">
              <h4 className="text-xs font-black uppercase text-accent tracking-wider font-display">
                Premium Experience & FAQ Matrix
              </h4>
              <p className="text-[10px] text-gray-500 mt-1">Configure premium badges, highlights, route maps, hotel previews, pickup details, and FAQs.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Marketplace Badges & Inclusions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                
                {/* TripGod Verified */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="is_verified"
                    checked={formData.is_verified || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_verified: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_verified" className="text-xs font-bold text-white cursor-pointer select-none">
                    TripGod Verified
                  </label>
                </div>

                {/* Bestseller */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="is_bestseller"
                    checked={formData.is_bestseller || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_bestseller: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_bestseller" className="text-xs font-bold text-white cursor-pointer select-none">
                    Bestseller Tour
                  </label>
                </div>

                {/* Instant Confirmation */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="is_instant_confirmation"
                    checked={formData.is_instant_confirmation || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_instant_confirmation: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_instant_confirmation" className="text-xs font-bold text-white cursor-pointer select-none">
                    Instant Confirmation
                  </label>
                </div>

                {/* Free Cancellation */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="is_free_cancellation"
                    checked={formData.is_free_cancellation || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_free_cancellation: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_free_cancellation" className="text-xs font-bold text-white cursor-pointer select-none">
                    Free Cancellation
                  </label>
                </div>

                {/* Limited Seats */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="is_limited_seats"
                    checked={formData.is_limited_seats || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_limited_seats: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_limited_seats" className="text-xs font-bold text-white cursor-pointer select-none">
                    Limited Seats
                  </label>
                </div>

                {/* Hotel Included */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="hotel_included"
                    checked={formData.hotel_included || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, hotel_included: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="hotel_included" className="text-xs font-bold text-white cursor-pointer select-none">
                    Hotel Included
                  </label>
                </div>

                {/* Meals Included */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="meals_included"
                    checked={formData.meals_included || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, meals_included: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="meals_included" className="text-xs font-bold text-white cursor-pointer select-none">
                    Meals Included
                  </label>
                </div>

                {/* Transport Included */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="transport_included"
                    checked={formData.transport_included || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, transport_included: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="transport_included" className="text-xs font-bold text-white cursor-pointer select-none">
                    Transport Included
                  </label>
                </div>

                {/* Guide Included */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="guide_included"
                    checked={formData.guide_included || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, guide_included: e.target.checked }))}
                    className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="guide_included" className="text-xs font-bold text-white cursor-pointer select-none">
                    Guide Included
                  </label>
                </div>

              </div>
            </div>

            {/* Statistics & Tour Type Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Seats Left */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Seats Left Indicator</label>
                <input
                  type="number"
                  value={formData.seats_left || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, seats_left: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  placeholder="e.g., 5"
                />
              </div>

              {/* Bookings Count (Travelers Count) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Traveler Bookings Count</label>
                <input
                  type="number"
                  value={formData.bookings_count || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookings_count: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  placeholder="e.g., 180"
                />
              </div>

              {/* Tour Type */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Tour Type</label>
                <select
                  value={formData.tour_type || 'Sightseeing'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tour_type: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                >
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Trekking">Trekking</option>
                  <option value="Pilgrimage">Pilgrimage</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Camping">Camping</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Premium Tour Listing Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Next Batch Date */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Next Batch Date</label>
                <input
                  type="text"
                  value={formData.next_batch || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_batch: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  placeholder="e.g. 15 July"
                />
              </div>

              {/* Tour Difficulty */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Difficulty Level</label>
                <select
                  value={formData.difficulty || 'Moderate'}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Difficult">Difficult</option>
                  <option value="Challenging">Challenging</option>
                </select>
              </div>

              {/* Group Type */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Group / Tour Format</label>
                <select
                  value={formData.group_type || 'Group Tour'}
                  onChange={(e) => setFormData(prev => ({ ...prev, group_type: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                >
                  <option value="Group Tour">Group Tour</option>
                  <option value="Private Tour">Private Tour</option>
                  <option value="Customized Tour">Customized Tour</option>
                </select>
              </div>
            </div>

            {/* Perfect For checklist for Tours */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Perfect For (Target Segments)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                {['Solo Travelers', 'Couples', 'Families', 'Friends', 'Backpackers', 'Adventure Seekers', 'Riders', 'Nature Lovers'].map(pf => {
                  const perfectList = formData.perfect_for || [];
                  const isChecked = perfectList.includes(pf);
                  return (
                    <label key={pf} className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let updated = [...perfectList];
                          if (e.target.checked) {
                            updated.push(pf);
                          } else {
                            updated = updated.filter(item => item !== pf);
                          }
                          setFormData(prev => ({ ...prev, perfect_for: updated }));
                        }}
                        className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span>{pf}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Tour Highlights */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Tour Highlights (Why Travelers Choose)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tour_highlights: [...(prev.tour_highlights || []), '']
                    }));
                  }}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-300 font-bold cursor-pointer"
                >
                  + Add Highlight
                </button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {(formData.tour_highlights || []).map((hl, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={hl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const updated = [...(prev.tour_highlights || [])];
                          updated[idx] = val;
                          return { ...prev, tour_highlights: updated };
                        });
                      }}
                      placeholder="e.g. Verified Local Operator"
                      className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => {
                          const updated = (prev.tour_highlights || []).filter((_, i) => i !== idx);
                          return { ...prev, tour_highlights: updated };
                        });
                      }}
                      className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg cursor-pointer text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {(formData.tour_highlights || []).length === 0 && (
                  <p className="text-[10px] text-gray-500 italic">No highlights added. Fallbacks will show default Trust badges.</p>
                )}
              </div>
            </div>

            {/* Route Map Timeline Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Route Map Points (Trace sequence)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      route_map: [...(prev.route_map || []), '']
                    }));
                  }}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-300 font-bold cursor-pointer"
                >
                  + Add Point
                </button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {(formData.route_map || []).map((pt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={pt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const updated = [...(prev.route_map || [])];
                          updated[idx] = val;
                          return { ...prev, route_map: updated };
                        });
                      }}
                      placeholder="e.g. Rishikesh, Shivpuri"
                      className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => {
                          const updated = (prev.route_map || []).filter((_, i) => i !== idx);
                          return { ...prev, route_map: updated };
                        });
                      }}
                      className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg cursor-pointer text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {(formData.route_map || []).length === 0 && (
                  <p className="text-[10px] text-gray-500 italic">No route map points added.</p>
                )}
              </div>
            </div>

            {/* Stay Details */}
            <div className="space-y-3 pt-2 border-t border-slate-900">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Hotel/Stay Previews
              </label>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-900 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-gray-500 uppercase">Hotel/Camp Name</label>
                    <input
                      type="text"
                      value={formData.stay_details?.hotel_name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          stay_details: { ...(prev.stay_details || {}), hotel_name: val }
                        }));
                      }}
                      placeholder="e.g. Majestic River Camp"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-gray-500 uppercase">Room Type</label>
                    <input
                      type="text"
                      value={formData.stay_details?.room_type || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          stay_details: { ...(prev.stay_details || {}), room_type: val }
                        }));
                      }}
                      placeholder="e.g. Luxury Tents on Twin Sharing"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase">Stay Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.stay_details?.amenities) ? formData.stay_details.amenities.join(', ') : (formData.stay_details?.amenities || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        stay_details: {
                          ...(prev.stay_details || {}),
                          amenities: val.split(',').map(a => a.trim()).filter(Boolean)
                        }
                      }));
                    }}
                    placeholder="e.g. Attached Washroom, Fast Wifi, Hot Water"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase">Hotel Photos (comma-separated URLs)</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.stay_details?.photos) ? formData.stay_details.photos.join(', ') : (formData.stay_details?.photos || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        stay_details: {
                          ...(prev.stay_details || {}),
                          photos: val.split(',').map(p => p.trim()).filter(Boolean)
                        }
                      }));
                    }}
                    placeholder="e.g. url1, url2"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pickup & Drop Details */}
            <div className="space-y-3 pt-2 border-t border-slate-900">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Pickup & Drop Details
              </label>
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-900 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase">Pickup Location</label>
                  <input
                    type="text"
                    value={formData.pickup_drop?.pickup_point || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        pickup_drop: { ...(prev.pickup_drop || {}), pickup_point: val }
                      }));
                    }}
                    placeholder="e.g. Rishikesh Railway Station"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase">Drop Location</label>
                  <input
                    type="text"
                    value={formData.pickup_drop?.drop_point || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        pickup_drop: { ...(prev.pickup_drop || {}), drop_point: val }
                      }));
                    }}
                    placeholder="e.g. Rishikesh Railway Station"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase">Reporting Time</label>
                  <input
                    type="text"
                    value={formData.pickup_drop?.reporting_time || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        pickup_drop: { ...(prev.pickup_drop || {}), reporting_time: val }
                      }));
                    }}
                    placeholder="e.g. 09:00 AM"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-gray-500 uppercase">Coordinator Contact Number</label>
                  <input
                    type="text"
                    value={formData.pickup_drop?.coordinator_number || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        pickup_drop: { ...(prev.pickup_drop || {}), coordinator_number: val }
                      }));
                    }}
                    placeholder="e.g. +91 99999 99999"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Landmarks & Attractions */}
            <div className="space-y-3 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Nearby Landmarks & Attractions
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      landmarks_data: [...(prev.landmarks_data || []), { name: '', distance: '', time: '', map_url: '' }]
                    }));
                  }}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-300 font-bold cursor-pointer"
                >
                  + Add Landmark
                </button>
              </div>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {(formData.landmarks_data || []).map((landmark, idx) => (
                  <div key={idx} className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 grid grid-cols-4 gap-2 relative">
                    <div className="space-y-1 col-span-2">
                      <label className="block text-[7px] text-gray-500 uppercase">Name</label>
                      <input
                        type="text"
                        required
                        value={landmark.name || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const list = [...(prev.landmarks_data || [])];
                            list[idx] = { ...list[idx], name: val };
                            return { ...prev, landmarks_data: list };
                          });
                        }}
                        placeholder="e.g. Ram Jhula"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[7px] text-gray-500 uppercase">Distance</label>
                      <input
                        type="text"
                        required
                        value={landmark.distance || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const list = [...(prev.landmarks_data || [])];
                            list[idx] = { ...list[idx], distance: val };
                            return { ...prev, landmarks_data: list };
                          });
                        }}
                        placeholder="e.g. 5 km"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[7px] text-gray-500 uppercase">Time</label>
                      <input
                        type="text"
                        required
                        value={landmark.time || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const list = [...(prev.landmarks_data || [])];
                            list[idx] = { ...list[idx], time: val };
                            return { ...prev, landmarks_data: list };
                          });
                        }}
                        placeholder="e.g. 15 min"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 col-span-3">
                      <label className="block text-[7px] text-gray-500 uppercase">Google Maps URL</label>
                      <input
                        type="text"
                        value={landmark.map_url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const list = [...(prev.landmarks_data || [])];
                            list[idx] = { ...list[idx], map_url: val };
                            return { ...prev, landmarks_data: list };
                          });
                        }}
                        placeholder="e.g. https://maps.google.com/..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-[10px] focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => {
                            const list = (prev.landmarks_data || []).filter((_, i) => i !== idx);
                            return { ...prev, landmarks_data: list };
                          });
                        }}
                        className="py-1 px-2.5 bg-red-950/20 border border-red-900/30 text-red-450 rounded-lg text-[9px] font-bold cursor-pointer hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {(formData.landmarks_data || []).length === 0 && (
                  <p className="text-[10px] text-gray-500 italic">No landmarks added.</p>
                )}
              </div>
            </div>

            {/* FAQs matrix */}
            <div className="space-y-3 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  FAQs Accordion
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      faq_data: [...(prev.faq_data || []), { question: '', answer: '' }]
                    }));
                  }}
                  className="py-0.5 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[9px] text-slate-300 font-bold cursor-pointer"
                >
                  + Add FAQ
                </button>
              </div>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {(formData.faq_data || []).map((faq, idx) => (
                  <div key={idx} className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-2 relative">
                    <div className="space-y-1">
                      <label className="block text-[7px] text-gray-500 uppercase">Question</label>
                      <input
                        type="text"
                        required
                        value={faq.question || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const list = [...(prev.faq_data || [])];
                            list[idx] = { ...list[idx], question: val };
                            return { ...prev, faq_data: list };
                          });
                        }}
                        placeholder="e.g. What is the cancellation policy?"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[7px] text-gray-500 uppercase">Answer</label>
                      <textarea
                        required
                        value={faq.answer || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const list = [...(prev.faq_data || [])];
                            list[idx] = { ...list[idx], answer: val };
                            return { ...prev, faq_data: list };
                          });
                        }}
                        rows={2}
                        placeholder="Answer details..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => {
                            const list = (prev.faq_data || []).filter((_, i) => i !== idx);
                            return { ...prev, faq_data: list };
                          });
                        }}
                        className="py-1 px-2.5 bg-red-950/20 border border-red-900/30 text-red-450 rounded-lg text-[9px] font-bold cursor-pointer hover:bg-red-950/30"
                      >
                        Remove FAQ
                      </button>
                    </div>
                  </div>
                ))}
                {(formData.faq_data || []).length === 0 && (
                  <p className="text-[10px] text-gray-500 italic">No FAQs added.</p>
                )}
              </div>
            </div>
          </div>

          {/* Operators & Pricing */}
          <div className="space-y-3 pt-4 border-t border-slate-900">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Operators & Pricing</label>
              <p className="text-[10px] text-gray-500">Enable/disable operators and set their custom prices, original prices, commission overrides, and contact overrides for this tour package.</p>
            </div>
            
            <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
              {vendors
                .filter(v => v.category === 'Tour')
                .map(vendor => {
                  const opState = toursOperators[vendor.id] || { enabled: false, price: '', original_price: '', commission_percentage: '', whatsapp_number: '' };
                  return (
                    <div key={vendor.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 hover:bg-slate-900/50 transition-colors">
                      {/* Left: Checkbox and Vendor Name */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <input
                          type="checkbox"
                          checked={opState.enabled}
                          onChange={(e) => {
                            setToursOperators(prev => ({
                              ...prev,
                              [vendor.id]: {
                                ...prev[vendor.id],
                                enabled: e.target.checked,
                                price: prev[vendor.id]?.price || '',
                                original_price: prev[vendor.id]?.original_price || '',
                                commission_percentage: prev[vendor.id]?.commission_percentage || '',
                                whatsapp_number: prev[vendor.id]?.whatsapp_number || vendor.whatsapp || ''
                              }
                            }));
                          }}
                          className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs text-white block">{vendor.name}</span>
                          <span className="text-[9px] text-slate-500 font-semibold">{vendor.landmark || vendor.address || 'Rishikesh'}</span>
                        </div>
                      </div>

                      {/* Right: Price inputs (only editable if enabled) */}
                      {opState.enabled ? (
                        <div className="flex-grow space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Price (₹)</label>
                              <input
                                type="number"
                                required
                                value={opState.price}
                                onChange={(e) => {
                                  setToursOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      price: Number(e.target.value)
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-accent"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Orig Price (₹)</label>
                              <input
                                type="number"
                                placeholder="Strikethrough"
                                value={opState.original_price}
                                onChange={(e) => {
                                  setToursOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      original_price: e.target.value === '' ? '' : Number(e.target.value)
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-accent"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">WhatsApp Contact</label>
                              <input
                                type="text"
                                value={opState.whatsapp_number}
                                onChange={(e) => {
                                  setToursOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      whatsapp_number: e.target.value
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-accent"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Payment Mode</label>
                              <select
                                value={opState.payment_mode || 'commission_advance'}
                                onChange={(e) => {
                                  setToursOperators(prev => ({
                                    ...prev,
                                    [vendor.id]: {
                                      ...prev[vendor.id],
                                      payment_mode: e.target.value
                                    }
                                  }));
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-350 text-[11px] focus:outline-none font-semibold"
                              >
                                <option value="commission_advance">Percentage Advance</option>
                                <option value="fixed_advance">Flat Rate Advance</option>
                                <option value="full_payment">Full 100% Online</option>
                              </select>
                            </div>
                          </div>

                          {/* Payment Settings Sub-Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(opState.payment_mode === 'commission_advance' || !opState.payment_mode) && (
                              <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Comm Override (%)</label>
                                <input
                                  type="number"
                                  placeholder={`Default ${vendor.commission_percentage}%`}
                                  value={opState.commission_percentage}
                                  onChange={(e) => {
                                    setToursOperators(prev => ({
                                      ...prev,
                                      [vendor.id]: {
                                        ...prev[vendor.id],
                                        commission_percentage: e.target.value === '' ? '' : Number(e.target.value)
                                      }
                                    }));
                                  }}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-accent"
                                />
                              </div>
                            )}

                            {opState.payment_mode === 'fixed_advance' && (
                              <div className="space-y-1">
                                <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Fixed Advance Amount (₹)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={opState.fixed_advance_amount !== null && opState.fixed_advance_amount !== undefined ? opState.fixed_advance_amount : ''}
                                  onChange={(e) => {
                                    setToursOperators(prev => ({
                                      ...prev,
                                      [vendor.id]: {
                                        ...prev[vendor.id],
                                        fixed_advance_amount: e.target.value === '' ? '' : Number(e.target.value)
                                      }
                                    }));
                                  }}
                                  placeholder="e.g. 200"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-accent"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-600 font-semibold italic flex-grow text-right py-2 pr-4">
                          Operator disabled for this tour
                        </div>
                      )}
                    </div>
                  );
                })}
              {vendors.filter(v => v.category === 'Tour').length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  No vendors found with category "Tour Package". Please create one first.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Availability & Closing Settings */}
      <div className="space-y-4 border-t border-slate-900 pt-4">
        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Seasonal Availability & Closings</label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Is Closed checkbox */}
          <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              id="is_closed"
              checked={formData.is_closed || false}
              onChange={(e) => setFormData(prev => ({ ...prev, is_closed: e.target.checked }))}
              className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <div>
              <label htmlFor="is_closed" className="text-xs font-black text-white cursor-pointer select-none block uppercase tracking-wide">
                Temporarily Closed / Block Bookings
              </label>
              <span className="text-[10px] text-gray-500">Checking this will immediately stop bookings and show a notification on the frontend.</span>
            </div>
          </div>

          {/* Coming Soon checkbox */}
          {['rafting', 'adventures', 'swing', 'paragliding', 'zipline', 'camping'].includes(type) && (
            <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="coming_soon"
                checked={formData.coming_soon || false}
                onChange={(e) => setFormData(prev => ({ ...prev, coming_soon: e.target.checked }))}
                className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <div>
                <label htmlFor="coming_soon" className="text-xs font-black text-white cursor-pointer select-none block uppercase tracking-wide">
                  Mark as Coming Soon
                </label>
                <span className="text-[10px] text-gray-500">Checking this will mark the activity as "Coming Soon", show a banner, and disable booking.</span>
              </div>
            </div>
          )}

          {/* Closed Reason */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Closure Reason / Reopening Notice</label>
            <input
              type="text"
              value={formData.closed_reason || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, closed_reason: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none"
              placeholder="e.g. Monsoon season / Government advisory / Off-season maintenance"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Closed From */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Closed From Date</label>
            <input
              type="date"
              value={formData.closed_from || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, closed_from: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none"
            />
          </div>

          {/* Closed Until */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Closed Until / Reopening Date</label>
            <input
              type="date"
              value={formData.closed_until || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, closed_until: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="space-y-1">
        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Cancellation Policy</label>
        <input
          type="text"
          required
          value={formData.cancellation_policy || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, cancellation_policy: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
        />
      </div>

      {/* 5. Payment Configuration */}
      {type === 'hotels' && (
        <div className="space-y-4 border-t border-slate-900 pt-4">
          <h4 className="text-xs font-black uppercase text-accent tracking-wider font-display">Payment Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Payment Mode</label>
              <select
                value={formData.payment_mode || 'commission_advance'}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_mode: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none font-bold"
              >
                <option value="commission_advance">Commission-Based Advance</option>
                <option value="fixed_advance">Fixed Advance Amount</option>
                <option value="full_payment">Full 100% Payment Online</option>
              </select>
            </div>

            {(formData.payment_mode === 'commission_advance' || !formData.payment_mode) && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Commission Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission_percentage !== null && formData.commission_percentage !== undefined ? formData.commission_percentage : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_percentage: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="e.g. 20"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                />
              </div>
            )}

            {formData.payment_mode === 'fixed_advance' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Fixed Advance Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.fixed_advance_amount !== null && formData.fixed_advance_amount !== undefined ? formData.fixed_advance_amount : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, fixed_advance_amount: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="py-3 px-6 bg-slate-900 border border-slate-800 text-slate-300 font-bold uppercase rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formLoading}
          className="py-3 px-8 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black uppercase tracking-wider rounded-xl shadow-md border-none cursor-pointer"
        >
          {formLoading ? 'Saving...' : 'Save Listing'}
        </button>
      </div>
    </form>
  );
}

// Utility: Group rafting packages by distance_km
const groupRaftingByDistance = (list) => {
  const grouped = {};
  list.forEach(item => {
    const rawDist = item.distance_km;
    let dist = 12;
    if (rawDist) {
      const matched = String(rawDist).match(/\d+/);
      if (matched) {
        dist = Number(matched[0]);
      }
    }
    const key = `${dist} KM`;
    if (!grouped[key]) {
      grouped[key] = {
        id: item.id,
        distance_km: dist,
        name: item.name || `${dist} KM Rafting Stretch`,
        route: item.route,
        description: item.description,
        duration: item.duration,
        age_limit: item.age_limit,
        images: item.images,
        inclusions: item.inclusions,
        exclusions: item.exclusions,
        cancellation_policy: item.cancellation_policy,
        city_id: item.city_id,
        price: item.price,
        operators: []
      };
    }
    grouped[key].operators.push(item);
    if (Number(item.price) < Number(grouped[key].price)) {
      grouped[key].price = item.price;
    }
  });
  return Object.values(grouped);
};

// Utility: Group bikes by name
const groupBikesByName = (list) => {
  const grouped = {};
  list.forEach(item => {
    const key = item.name;
    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        operators: []
      };
    }
    grouped[key].operators.push(item);
    if (Number(item.price) < Number(grouped[key].price)) {
      grouped[key].price = item.price;
    }
  });
  return Object.values(grouped);
};

// Utility: Group activities by name
const groupActivitiesByName = (list) => {
  const grouped = {};
  list.forEach(item => {
    const key = item.name;
    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        operators: []
      };
    }
    grouped[key].operators.push(item);
    if (Number(item.price) < Number(grouped[key].price)) {
      grouped[key].price = item.price;
    }
  });
  return Object.values(grouped);
};

// Utility: Group tours by name
const groupToursByName = (list) => {
  const grouped = {};
  list.forEach(item => {
    const key = item.name;
    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        operators: []
      };
    }
    grouped[key].operators.push(item);
    if (Number(item.price) < Number(grouped[key].price)) {
      grouped[key].price = item.price;
    }
  });
  return Object.values(grouped);
};

// Utility: Filter vendors by adventure activity type
const getVendorsForType = (activityType, vendorsList) => {
  if (!vendorsList || vendorsList.length === 0) return [];
  const typeLower = (activityType || '').toLowerCase();
  
  if (typeLower === 'rafting') {
    return vendorsList.filter(v => v.category === 'Rafting');
  }
  if (typeLower === 'camping') {
    return vendorsList.filter(v => v.category === 'Camping');
  }
  if (typeLower === 'bungee') {
    return vendorsList.filter(v => v.category === 'Bungee' || v.category === 'Bungee Jumping');
  }
  if (typeLower === 'zipline') {
    return vendorsList.filter(v => v.category === 'Zipline' || v.category === 'Ganga Zipline');
  }
  if (typeLower === 'swing') {
    return vendorsList.filter(v => v.category === 'Giant Swing' || v.category === 'Swing');
  }
  if (typeLower === 'paragliding') {
    return vendorsList.filter(v => v.category === 'Paragliding');
  }
  
  const fallback = vendorsList.filter(v => ['Rafting', 'Camping'].includes(v.category));
  return fallback.length > 0 ? fallback : vendorsList;
};


