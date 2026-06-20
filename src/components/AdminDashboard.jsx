import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, ShoppingBag, Building2, Waves, Bike, MapPin, Users, Image, 
  Trash2, Edit, Plus, LogOut, Search, Filter, ShieldCheck, ChevronRight,
  TrendingUp, CircleDollarSign, Check, X, PlusCircle, Sparkles, MapPinned
} from 'lucide-react';
import { supabase } from '../supabase';

const STANDARD_ADVENTURE_NAMES = {
  rafting: [
    "12 KM Rafting",
    "16 KM Rafting",
    "24 KM Rafting",
    "36 KM Rafting"
  ],
  bungee: [
    "117M Jumps with DSLR Video",
    "117M Jumps (Without Video)",
    "111M Bungee Jump with DSLR Video",
    "Combo: Bungee Jump (111M) + Giant Swing (113M) with Video",
    "Rooftop Bungee Jump (111M) (Without Video)",
    "Couple Bungee Jump with DSLR Video"
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
    shop_image: '', star_rating: 4.5, landmark: ''
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
      if (editingItem && editingItem.type === 'vendor') {
        const { error } = await supabase.from('vendors').update(newVendor).eq('id', editingItem.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vendors').insert(newVendor);
        if (error) throw error;
      }
      setNewVendor({ name: '', category: 'Hotel', phone: '', whatsapp: '', address: '', commission_percentage: 10, status: 'Active', shop_image: '', star_rating: 4.5, landmark: '' });
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
    const searchString = `${b.customer_name} ${b.customer_phone} ${b.customer_email} ${b.id}`.toLowerCase();
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
              { id: 'media', label: 'Media Library', icon: Image }
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
                            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Booking ID: {b.id.substring(0,8)}...</span>
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
                        placeholder="e.g. 9837371137"
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
                        placeholder="e.g. 9837371137"
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
                          setNewVendor({ name: '', category: 'Hotel', phone: '', whatsapp: '', address: '', commission_percentage: 10, status: 'Active', shop_image: '', star_rating: 4.5, landmark: '' });
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
                                    landmark: v.landmark || ''
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
// SUB-COMPONENT: LISTINGFORM (Dynamic listing generator CRUD)
// =============================================================================
function ListingForm({ type, data, cities, vendors, onClose }) {
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [activitiesOperators, setActivitiesOperators] = useState({});
  const [bikesOperators, setBikesOperators] = useState({});
  const [toursOperators, setToursOperators] = useState({});

  // Initialize adventures/activities operators state (covers rafting, bungee, swing, paragliding, zipline, camping)
  useEffect(() => {
    if (['rafting', 'adventures', 'bungee', 'swing', 'paragliding', 'zipline', 'camping'].includes(type)) {
      const initialOps = {};
      
      // Initialize all vendors
      vendors.forEach(v => {
        initialOps[v.id] = {
          enabled: false,
          price: '',
          original_price: '',
          commission_percentage: '',
          whatsapp_number: v.whatsapp || '',
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
            id: op.id
          };
        });
      }
      
      setBikesOperators(initialOps);
    }
  }, [type, data, vendors]);

  // Initialize form fields based on type
  useEffect(() => {
    if (data) {
      setFormData({ 
        ...data,
        original_price: data.original_price !== null && data.original_price !== undefined ? data.original_price : '',
        commission_percentage: data.commission_percentage !== null && data.commission_percentage !== undefined ? data.commission_percentage : '',
        is_limited_offer: !!data.is_limited_offer
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
        cancellation_policy: '100% refund up to 24 hours prior to arrival.'
      };

      if (type === 'hotels') {
        defaults.address = '';
        defaults.maps_link = '';
        defaults.check_in = '12:00 PM';
        defaults.check_out = '11:00 AM';
        defaults.amenities = { wifi: false, ac: false, parking: false, restaurant: false, tv: false, mountain_view: false, river_view: false, room_service: false, power_backup: false, geyser: false };
        defaults.rules = { unmarried_couples: false, pets: false, smoking: false, id_required: false, min_age_18: false, alcohol_allowed: false, visitors_allowed: false };
        defaults.landmarks = [];
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
        defaults.inclusions = [];
        defaults.exclusions = [];
        defaults.contact_number = '';
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
            whatsappNumber: op.whatsapp_number || null,
            id: op.id
          }));

        if (enabledOps.length === 0) {
          throw new Error('Please enable at least one operator for this adventure package.');
        }

        const commonProps = {
          city_id: formData.city_id,
          name: formData.name || (formData.activity_type === 'rafting' ? `${formData.distance_km} KM Rafting Stretch` : 'Adventure Spot'),
          description: formData.description || '',
          route: formData.route || '',
          distance_km: Number(formData.distance_km) || 0,
          duration: formData.duration || '',
          pickup_included: !!formData.pickup_included,
          drop_included: !!formData.drop_included,
          age_limit: Number(formData.age_limit) || 12,
          images: formData.images || [],
          inclusions: formData.inclusions || [],
          exclusions: formData.exclusions || [],
          cancellation_policy: formData.cancellation_policy || '100% refund up to 24 hours prior to arrival.',
          activity_type: formData.activity_type || 'rafting'
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
                commission_percentage: op.commissionPercentage,
                whatsapp_number: op.whatsappNumber
              });
              delete existingOpsMap[op.vendorId];
            } else {
              opsToInsert.push({
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                original_price: op.originalPrice,
                commission_percentage: op.commissionPercentage,
                whatsapp_number: op.whatsappNumber
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
            commission_percentage: op.commissionPercentage,
            whatsapp_number: op.whatsappNumber
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
            id: op.id
          }));

        if (enabledOps.length === 0) {
          throw new Error('Please enable at least one vendor for this bike/scoty rent.');
        }

        const commonProps = {
          city_id: formData.city_id,
          name: formData.name,
          description: formData.description || '',
          documents: formData.documents || ['Driving License', 'Aadhar Card'],
          images: formData.images || []
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
                pickup_location: op.pickupLocation
              });
              delete existingOpsMap[op.vendorId];
            } else {
              opsToInsert.push({
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                deposit: op.deposit,
                pickup_location: op.pickupLocation
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
            pickup_location: op.pickupLocation
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
          itinerary: formData.itinerary || [],
          inclusions: formData.inclusions || [],
          exclusions: formData.exclusions || [],
          cancellation_policy: formData.cancellation_policy || '100% refund up to 24 hours prior to arrival.',
          images: formData.images || []
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
                commission_percentage: op.commissionPercentage,
                contact_number: op.whatsappNumber
              });
              delete existingOpsMap[op.vendorId];
            } else {
              opsToInsert.push({
                ...commonProps,
                vendor_id: op.vendorId,
                price: op.price,
                original_price: op.originalPrice,
                commission_percentage: op.commissionPercentage,
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
            commission_percentage: op.commissionPercentage,
            contact_number: op.whatsappNumber
          }));

          const { error: insertError } = await supabase.from('tours').insert(recordsToInsert);
          if (insertError) throw insertError;
        }

        onClose();
        return;
      }

      // Default submit for hotels, bikes, tours
      const submitData = {
        ...formData,
        original_price: formData.original_price === '' || formData.original_price === null || formData.original_price === undefined ? null : Number(formData.original_price),
        commission_percentage: formData.commission_percentage === '' || formData.commission_percentage === null || formData.commission_percentage === undefined ? null : Number(formData.commission_percentage),
        is_limited_offer: !!formData.is_limited_offer
      };
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

        {!['rafting', 'adventures', 'bikes', 'tours'].includes(type) && (
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

        {!['rafting', 'adventures', 'bikes', 'tours'].includes(type) && (
          <>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Price (₹)</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Original Price (₹ - Strikethrough)</label>
              <input
                type="number"
                value={formData.original_price !== null && formData.original_price !== undefined ? formData.original_price : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder="e.g. 2999 (Leave blank if no discount)"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">WhatsApp Number</label>
              <input
                type="text"
                value={formData.whatsapp_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder="e.g. 9837371137"
              />
            </div>

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
        <div className="flex justify-between items-center">
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Image URLs</label>
          <button
            type="button"
            onClick={() => addArrayItem('images')}
            className="py-1 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[10px] text-slate-300 font-bold cursor-pointer"
          >
            Add Image URL
          </button>
        </div>
        <div className="space-y-2">
          {(formData.images || []).map((img, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                required
                value={img}
                onChange={(e) => handleArrayChange('images', idx, e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none"
                placeholder="https://..."
              />
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
      {/* ----------------- HOTELS FIELDS ----------------- */}
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
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Check-in Time</label>
              <input
                type="text"
                value={formData.check_in || '12:00 PM'}
                onChange={(e) => setFormData(prev => ({ ...prev, check_in: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Check-out Time</label>
              <input
                type="text"
                value={formData.check_out || '11:00 AM'}
                onChange={(e) => setFormData(prev => ({ ...prev, check_out: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
              />
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
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl cursor-pointer transition-colors flex items-center justify-center"
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
                {formData.activity_type === 'rafting' ? 'Route' : 'Location/Detail'}
              </label>
              <input
                type="text"
                required
                value={formData.route || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, route: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder={formData.activity_type === 'rafting' ? 'e.g. Shivpuri to Nim Beach' : 'e.g. 117 Metres / Shivpuri Hills'}
              />
            </div>

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

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Duration</label>
              <input
                type="text"
                required
                value={formData.duration || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                placeholder="e.g. 2 Hours / 3 Days"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.pickup_included}
                onChange={(e) => setFormData(prev => ({ ...prev, pickup_included: e.target.checked }))}
                className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
              />
              <span>Pickup Included</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.drop_included}
                onChange={(e) => setFormData(prev => ({ ...prev, drop_included: e.target.checked }))}
                className="rounded border-slate-800 bg-slate-900 text-accent focus:ring-0"
              />
              <span>Drop Included</span>
            </label>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Age Limit</label>
              <input
                type="number"
                required
                value={formData.age_limit || 12}
                onChange={(e) => setFormData(prev => ({ ...prev, age_limit: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-1 text-white focus:outline-none"
              />
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
              {getVendorsForType(formData.activity_type || 'rafting', vendors).map(vendor => {
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
                              whatsapp_number: prev[vendor.id]?.whatsapp_number || vendor.whatsapp || ''
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-grow">
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
                          <label className="block text-[8px] font-black uppercase text-gray-500 tracking-wider">Commission (%)</label>
                          <input
                            type="number"
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
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-medium italic flex-grow text-right pr-4">
                        Disabled (not offering this package)
                      </div>
                    )}
                  </div>
                );
              })}
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
              {vendors
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-grow">
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
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-medium italic flex-grow text-right pr-4">
                          Disabled (not offering this model)
                        </div>
                      )}
                    </div>
                  );
                })}
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
                placeholder="e.g. 9837371137"
              />
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
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-grow">
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
        id: item.id,
        name: item.name,
        description: item.description,
        deposit: item.deposit,
        documents: item.documents,
        pickup_location: item.pickup_location,
        city_id: item.city_id,
        price: item.price,
        images: item.images,
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
        id: item.id,
        name: item.name,
        activity_type: item.activity_type || 'rafting',
        route: item.route,
        distance_km: item.distance_km,
        description: item.description,
        duration: item.duration,
        pickup_included: item.pickup_included,
        drop_included: item.drop_included,
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

// Utility: Group tours by name
const groupToursByName = (list) => {
  const grouped = {};
  list.forEach(item => {
    const key = item.name;
    if (!grouped[key]) {
      grouped[key] = {
        id: item.id,
        name: item.name,
        description: item.description,
        duration: item.duration,
        itinerary: item.itinerary,
        inclusions: item.inclusions,
        exclusions: item.exclusions,
        cancellation_policy: item.cancellation_policy,
        contact_number: item.contact_number,
        city_id: item.city_id,
        price: item.price,
        images: item.images,
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

