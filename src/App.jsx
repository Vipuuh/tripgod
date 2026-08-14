import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, LogIn, MessageSquare, X, 
  MapPin, Phone, Mail, ChevronRight, Waves, Bike, Car, Building2, User,
  MapPinned, ShieldCheck, Lock, Handshake, Smartphone
} from 'lucide-react';
import { supabase } from './supabase';

// Pages
import Home from './pages/Home';
import Rafting from './pages/Rafting';
import Zipline from './pages/Zipline';
import Paragliding from './pages/Paragliding';
import Swing from './pages/Swing';
import Bungee from './pages/Bungee';
import Camping from './pages/Camping';
import BikeRent from './pages/BikeRent';
import Pickup from './pages/Pickup';
import Hotels from './pages/Hotels';
import Tours from './pages/Tours';
import TourPartnerSelection from './pages/TourPartnerSelection';
import Kayaking from './pages/Kayaking';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import CustomComboPage from './pages/CustomComboPage';

// Components
import BookingModal from './components/BookingModal';
import CartModal from './components/CartModal';
import CookieConsent from './components/CookieConsent';
import SupportFloatingWidget from './components/SupportFloatingWidget';
import AdminDashboard from './components/AdminDashboard';
import VendorPortal from './components/VendorPortal';
import LoginModal from './components/LoginModal';
import AccountModal from './components/AccountModal';
import MaintenanceMode from './components/MaintenanceMode';
import AdminPreviewBanner from './components/AdminPreviewBanner';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto my-12 bg-red-50 border border-red-200 text-red-900 rounded-3xl shadow-md text-left font-sans">
          <h2 className="text-lg font-black uppercase text-red-700">Something went wrong</h2>
          <p className="text-xs font-bold mt-3 text-slate-500">Error details:</p>
          <pre className="p-4 mt-1 bg-red-100/50 rounded-2xl text-[10px] font-mono overflow-auto max-h-48 text-red-800 border border-red-200/50">
            {this.state.error?.toString()}
          </pre>
          {this.state.error?.stack && (
            <>
              <p className="text-xs font-bold mt-4 text-slate-500">Stack Trace:</p>
              <pre className="p-4 mt-1 bg-red-100/50 rounded-2xl text-[10px] font-mono overflow-auto max-h-48 text-red-800 border border-red-200/50">
                {this.state.error.stack}
              </pre>
            </>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl border-none cursor-pointer transition-all shadow-sm"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Navigation State
  const [route, setRoute] = useState('home');
  const [selectedTour, setSelectedTour] = useState(null);
  
  // Maintenance Mode & Store Lock State
  const [maintenanceConfig, setMaintenanceConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('tripgod_maintenance_config');
      return saved ? JSON.parse(saved) : {
        enabled: false,
        headline: "We're Upgrading TripGod! 🚀",
        message: "We are currently making exciting upgrades & adding new adventure packages. We'll be back online shortly!",
        estimated_time: "Back online within 2 hours",
        support_phone: "+91 98765 43210",
        support_whatsapp: "+919876543210",
        passcode: "tripgod2026"
      };
    } catch (e) {
      return { enabled: false };
    }
  });

  const [isAdminBypass, setIsAdminBypass] = useState(() => {
    return localStorage.getItem('tripgod_admin_bypass') === 'true';
  });

  // Fetch maintenance mode settings & auth session on mount
  useEffect(() => {
    const fetchMaintenanceSetting = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'maintenance_config')
          .maybeSingle();

        if (data?.value) {
          setMaintenanceConfig(data.value);
          localStorage.setItem('tripgod_maintenance_config', JSON.stringify(data.value));
        }
      } catch (err) {
        console.warn('Maintenance config fetch warning:', err);
      }
    };

    const checkAdminAuthSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAdminBypass(true);
          localStorage.setItem('tripgod_admin_bypass', 'true');
        }
      } catch (e) {}
    };

    fetchMaintenanceSetting();
    checkAdminAuthSession();
  }, []);

  const handleTurnOffMaintenance = async () => {
    const updatedConfig = { ...maintenanceConfig, enabled: false };
    setMaintenanceConfig(updatedConfig);
    localStorage.setItem('tripgod_maintenance_config', JSON.stringify(updatedConfig));
    try {
      await supabase
        .from('site_settings')
        .upsert({ key: 'maintenance_config', value: updatedConfig });
    } catch (err) {
      console.error('Error disabling maintenance mode:', err);
    }
  };

  const handleExitPreview = () => {
    localStorage.removeItem('tripgod_admin_bypass');
    setIsAdminBypass(false);
  };

  // City states (Supabase dynamic multi-city support)
  const [citiesList, setCitiesList] = useState([]);
  const [currentCity, setCurrentCity] = useState(null);

  // Dynamic PWA Manifest configuration for direct mobile app launch
  useEffect(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      if (route === 'vendor' || route === 'partner') {
        manifestLink.setAttribute('href', '/vendor-manifest.json');
      } else {
        manifestLink.setAttribute('href', '/manifest.json');
      }
    }
  }, [route]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase.from('cities').select('*').order('name');
        if (error) throw error;
        if (data && data.length > 0) {
          setCitiesList(data);
          // Restore selected city from localStorage if available
          const savedCity = localStorage.getItem('tripgod_selected_city');
          if (savedCity) {
            setCurrentCity(JSON.parse(savedCity));
          } else {
            // Default to Rishikesh or first city
            const rishikesh = data.find(c => c.slug === 'rishikesh');
            setCurrentCity(rishikesh || data[0]);
          }
        } else {
          // Fallback cities
          const fallback = [{ id: 'default', name: 'Rishikesh', slug: 'rishikesh' }];
          setCitiesList(fallback);
          setCurrentCity(fallback[0]);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
        const fallback = [{ id: 'default', name: 'Rishikesh', slug: 'rishikesh' }];
        setCitiesList(fallback);
        setCurrentCity(fallback[0]);
      }
    };
    fetchCities();
  }, []);

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingActivity, setBookingActivity] = useState(null);
  const [initialBookingDate, setInitialBookingDate] = useState('');
  const [initialBookingGuests, setInitialBookingGuests] = useState(1);
  const [prefDate, setPrefDate] = useState('');
  const [prefGuests, setPrefGuests] = useState(1);

  // Search Drawer State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Login State
  const [userLoggedIn, setUserLoggedIn] = useState(() => {
    return localStorage.getItem('tripgod_logged_in') === 'true';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('tripgod_user_name') || '';
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [footerAdventuresOpen, setFooterAdventuresOpen] = useState(false);
  const [footerServicesOpen, setFooterServicesOpen] = useState(false);
  const [footerContactOpen, setFooterContactOpen] = useState(false);

  // Scroll Progress State
  const [scrollProgress, setScrollProgress] = useState(0);

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress(window.scrollY / totalScroll);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Universal Scroll Position Saver (Saves scroll Y position per path)
  useEffect(() => {
    let scrollTimeout;
    const saveCurrentScroll = () => {
      const currentPath = window.location.pathname || '/';
      if (window.scrollY > 0) {
        sessionStorage.setItem(`tripgod_scroll_${currentPath}`, window.scrollY.toString());
      }
    };

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveCurrentScroll, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', saveCurrentScroll);

    return () => {
      saveCurrentScroll();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', saveCurrentScroll);
    };
  }, []);

  // Sync path routing if user uses back/forward buttons (HTML5 History API)
  useEffect(() => {
    const handlePathChange = () => {
      let path = window.location.pathname;
      if (path.startsWith('/')) {
        path = path.substring(1);
      }
      if (path === '') {
        path = 'home';
      }

      const hash = window.location.hash;
      const validRoutes = ['home', 'rafting', 'zipline', 'paragliding', 'bungee', 'swing', 'camping', 'kayaking', 'bikerent', 'pickup', 'hotels', 'tours', 'admin', 'vendor', 'vendor-app', 'partner', 'privacy', 'terms', 'refund', 'custom-combo'];

      const isSubRoute = path.startsWith('hotels/') || path.startsWith('rafting/') || path.startsWith('zipline/') || path.startsWith('paragliding/') || path.startsWith('bungee/') || path.startsWith('swing/') || path.startsWith('camping/') || path.startsWith('kayaking/') || path.startsWith('tours/');

      if (validRoutes.includes(path) || isSubRoute) {
        let resolvedRoute = path;
        if (path.startsWith('hotels/')) resolvedRoute = 'hotels';
        else if (path.startsWith('rafting/')) resolvedRoute = 'rafting';
        else if (path.startsWith('zipline/')) resolvedRoute = 'zipline';
        else if (path.startsWith('paragliding/')) resolvedRoute = 'paragliding';
        else if (path.startsWith('bungee/')) resolvedRoute = 'bungee';
        else if (path.startsWith('swing/')) resolvedRoute = 'swing';
        else if (path.startsWith('camping/')) resolvedRoute = 'camping';
        else if (path.startsWith('kayaking/')) resolvedRoute = 'kayaking';
        else if (path.startsWith('tours/')) resolvedRoute = 'tours';

        setRoute(resolvedRoute);

        // Restore saved scroll position for current URL path if available
        const currentPath = window.location.pathname || '/';
        const savedY = sessionStorage.getItem(`tripgod_scroll_${currentPath}`);
        if (savedY && Number(savedY) > 0) {
          setTimeout(() => {
            window.scrollTo({ top: Number(savedY), behavior: 'instant' });
          }, 80);
        } else {
          window.scrollTo(0, 0);
        }

        if (resolvedRoute === 'home' && hash === '#adventures') {
          setTimeout(() => {
            document.getElementById('adventures')?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      } else {
        setRoute('home');
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handlePathChange);
    // Initialize if pathname exists on load
    handlePathChange();

    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  // Update URL path when route changes
  const navigateTo = (newRoute) => {
    const currentPath = window.location.pathname || '/';
    if (window.scrollY > 0) {
      sessionStorage.setItem(`tripgod_scroll_${currentPath}`, window.scrollY.toString());
    }

    if (newRoute === 'adventures') {
      window.history.pushState(null, '', '/#adventures');
      setRoute('home');
      setTimeout(() => {
        document.getElementById('adventures')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      let targetPath;
      let resolvedRoute = newRoute;
      
      if (newRoute.startsWith('tours/') && newRoute.endsWith('/partners')) {
        targetPath = `/${newRoute}`;
        resolvedRoute = 'tour-partner-selection';
      } else {
        targetPath = newRoute === 'home' ? '/' : `/${newRoute}`;
      }
      
      window.history.pushState(null, '', targetPath);
      setRoute(resolvedRoute);

      const savedY = sessionStorage.getItem(`tripgod_scroll_${targetPath}`);
      if (savedY && Number(savedY) > 0) {
        setTimeout(() => {
          window.scrollTo({ top: Number(savedY), behavior: 'instant' });
        }, 80);
      } else {
        window.scrollTo(0, 0);
      }
    }
  };

  const handleAddToCart = (item) => {
    setCart((prev) => [...prev, item]);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('tripgod_cart');
  };

  const openBookingModal = (activity, customDate = '', customGuests = 1) => {
    setBookingActivity(activity);
    setInitialBookingDate(customDate || prefDate || '');
    setInitialBookingGuests(customGuests !== 1 ? customGuests : (prefGuests || 1));
    setIsBookingModalOpen(true);
  };

  // Adventure listings for search
  const searchableAdventures = [
    { name: 'River Rafting (12 KM Shivpuri)', route: 'rafting' },
    { name: 'River Rafting (16 KM Nim Beach)', route: 'rafting' },
    { name: 'River Rafting (26 KM Marine Drive)', route: 'rafting' },
    { name: 'Bungee Jumping (83M Mohan Chatti)', route: 'bungee' },
    { name: 'Giant Swing (113M Valleys)', route: 'swing' },
    { name: 'Ganga Zipline Crossings', route: 'zipline' },
    { name: 'Tandem Paragliding', route: 'paragliding' },
    { name: 'Riverside Swiss Tent Camping', route: 'camping' },
    { name: 'Activa or Similar Scooty Rent', route: 'bikerent' },
    { name: 'Royal Enfield Classic Rent', route: 'bikerent' },
    { name: 'Hunter 350 Rent', route: 'bikerent' },
    { name: 'Xpulse 200 Rent', route: 'bikerent' },
    { name: 'Himalayan 450 CC Rent', route: 'bikerent' },
    { name: 'Haridwar Railway Station Cabs', route: 'pickup' },
    { name: 'Dehradun Airport Transfers', route: 'pickup' },
    { name: 'Ashram Stays & Resorts', route: 'hotels' },
    { name: 'Tour & Pilgrimage Packages', route: 'tours' },
    { name: 'Admin Control Panel Dashboard', route: 'admin' }
  ];

  const filteredAdventures = searchQuery
    ? searchableAdventures.filter(adv => adv.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Check if website is locked in Maintenance Mode (and user is not an Admin previewing)
  if (maintenanceConfig?.enabled && !isAdminBypass && route !== 'admin') {
    return (
      <MaintenanceMode 
        config={maintenanceConfig} 
        onAdminBypassSuccess={() => setIsAdminBypass(true)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between selection:bg-[#FF5F00] selection:text-white">
      
      {/* 0. Admin Live Preview Top Banner (Shown when maintenance mode is active & admin is previewing) */}
      {maintenanceConfig?.enabled && isAdminBypass && (
        <AdminPreviewBanner 
          setRoute={navigateTo} 
          onTurnOffMaintenance={() => setMaintenanceConfig(prev => ({ ...prev, enabled: false }))} 
          onExitPreview={() => setIsAdminBypass(false)} 
        />
      )}
      {/* 1. Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-accent z-50 transform origin-left transition-transform duration-100"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* 2. Sticky Header */}
      {route !== 'admin' && route !== 'vendor' && route !== 'vendor-app' && route !== 'partner' && (
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-100 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          {/* Left Header Group */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Logo */}
            <div 
              onClick={() => navigateTo('home')}
              className="flex items-center cursor-pointer select-none group"
            >
              <span className="font-black text-lg sm:text-2xl tracking-tighter text-slate-900 group-hover:text-[#FF6B00] transition-colors">TRIP</span>
              <span className="font-black text-lg sm:text-2xl tracking-tighter text-white bg-accent-gradient px-2 py-0.5 rounded-lg ml-1 shadow-sm group-hover:scale-105 transition-transform">GOD</span>
            </div>

            {/* City Selector (Vercel Multi-city dynamic integration) */}
            {citiesList.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 transition-colors">
                <MapPin size={11} className="text-[#FF5F00] shrink-0" />
                <select
                  value={currentCity?.id || ''}
                  onChange={(e) => {
                    const selected = citiesList.find(c => c.id === e.target.value);
                    if (selected) {
                      setCurrentCity(selected);
                      localStorage.setItem('tripgod_selected_city', JSON.stringify(selected));
                    }
                  }}
                  className="bg-transparent border-none text-[10px] sm:text-[11px] font-black uppercase text-slate-800 focus:outline-none focus:ring-0 cursor-pointer p-0 pr-3 sm:pr-4 appearance-none"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23FF5F00'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/></svg>")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right center',
                    backgroundSize: '8px sm:10px'
                  }}
                >
                  {citiesList.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6">
            {/* Search Trigger */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-[#FF6B00] hover:bg-slate-100 rounded-full transition-colors relative border-none cursor-pointer"
            >
              <Search size={18} className="sm:w-[20px] sm:h-[20px]" />
            </button>

            {/* Login Button */}
            {userLoggedIn ? (
              <button 
                onClick={() => setIsAccountOpen(true)}
                className="py-1.5 px-3 sm:py-2 sm:px-4 bg-[#FF5F00]/10 border border-[#FF5F00]/30 text-[#FF5F00] rounded-full font-bold text-[10px] sm:text-xs uppercase flex items-center gap-1 sm:gap-1.5 transition-all hover:scale-105 hover:bg-[#FF5F00]/20 cursor-pointer"
              >
                <User size={12} className="sm:w-[14px] sm:h-[14px]" /> <span>{userName || 'Esha'}</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="py-1.5 px-4 sm:py-2 sm:px-5 bg-accent-gradient text-white rounded-full font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] transition-all hover:scale-105 border-none cursor-pointer font-display"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* 3. Page Rendering Wrapper */}
      <main className="w-full max-w-full overflow-x-hidden min-h-[75vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {route === 'home' && (
              <Home 
                setRoute={navigateTo} 
                openBookingModal={openBookingModal} 
                prefDate={prefDate}
                setPrefDate={setPrefDate}
                prefGuests={prefGuests}
                setPrefGuests={setPrefGuests}
              />
            )}
            {route === 'rafting' && <ErrorBoundary><Rafting currentCity={currentCity} openBookingModal={openBookingModal} /></ErrorBoundary>}
            {route === 'zipline' && <ErrorBoundary><Zipline currentCity={currentCity} openBookingModal={openBookingModal} /></ErrorBoundary>}
            {route === 'paragliding' && <ErrorBoundary><Paragliding currentCity={currentCity} openBookingModal={openBookingModal} /></ErrorBoundary>}
            {route === 'bungee' && <ErrorBoundary><Bungee currentCity={currentCity} openBookingModal={openBookingModal} /></ErrorBoundary>}
            {route === 'swing' && <ErrorBoundary><Swing currentCity={currentCity} openBookingModal={openBookingModal} /></ErrorBoundary>}
            {route === 'camping' && <ErrorBoundary><Camping currentCity={currentCity} openBookingModal={openBookingModal} /></ErrorBoundary>}
            {route === 'kayaking' && <ErrorBoundary><Kayaking currentCity={currentCity} openBookingModal={openBookingModal} /></ErrorBoundary>}
            {route === 'bikerent' && <BikeRent currentCity={currentCity} openBookingModal={openBookingModal} />}
            {route === 'pickup' && <Pickup openBookingModal={openBookingModal} />}
            {route === 'hotels' && <ErrorBoundary><Hotels currentCity={currentCity} openBookingModal={openBookingModal} /></ErrorBoundary>}
            {route === 'tours' && (
              <Tours
                currentCity={currentCity}
                openBookingModal={openBookingModal}
                selectedTour={selectedTour}
                setSelectedTour={setSelectedTour}
                navigateTo={navigateTo}
              />
            )}
            {route === 'admin' && (
              <ErrorBoundary>
                <AdminDashboard 
                  setRoute={navigateTo} 
                  maintenanceConfig={maintenanceConfig} 
                  setMaintenanceConfig={setMaintenanceConfig} 
                  isMaintenanceActive={maintenanceConfig?.enabled} 
                  setIsMaintenanceActive={(val) => setMaintenanceConfig(prev => ({ ...prev, enabled: val }))} 
                />
              </ErrorBoundary>
            )}
            {(route === 'vendor' || route === 'vendor-app' || route === 'partner') && <VendorPortal onNavigateHome={() => navigateTo('home')} />}
            {route === 'privacy' && <Privacy />}
            {route === 'terms' && <Terms />}
            {route === 'refund' && <RefundPolicy />}
            {route === 'custom-combo' && (
              <ErrorBoundary>
                <CustomComboPage 
                  onClose={() => navigateTo('home')}
                  onBookCustomCombo={(bookingPayload) => {
                    openBookingModal(bookingPayload);
                  }}
                />
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. Footer */}
      {route !== 'admin' && route !== 'vendor' && route !== 'vendor-app' && route !== 'partner' && (
      <footer className="bg-black text-white font-sans">


        {/* MAIN FOOTER GRID */}
        <div className="py-8 md:py-16 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10">
          
          {/* Logo, Tagline & Payment Logos */}
          <div className="space-y-4 md:space-y-5 md:col-span-1">
            <div className="flex items-center select-none">
              <span className="font-black text-2xl tracking-tighter text-white">TRIP</span>
              <span className="font-black text-2xl tracking-tighter text-white bg-accent-gradient px-2 py-0.5 rounded-lg ml-1 shadow-sm">GOD</span>
            </div>

            {/* Partner With Us */}
            <div className="flex flex-col gap-1">
              <a
                href="https://wa.me/919410572857?text=Hi%2C%20I%20want%20to%20partner%20with%20TripGod%20as%20a%20vendor."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 group w-fit"
              >
                <Handshake size={16} className="text-accent group-hover:scale-110 transition-all duration-300" />
                <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-accent transition-colors font-display">
                  Partner With Us
                </span>
              </a>
              <p className="text-[11px] text-gray-400 font-semibold leading-normal">
                Own a hotel, bike, or rafting business? Grow your bookings with TripGod.
              </p>
            </div>

            <p className="text-gray-400 text-xs font-semibold leading-relaxed">
              Rishikesh's #1 Adventure Booking Partner. Handpicked activities, verified crews and a 100% refund guarantee.
            </p>
            {/* Embedded WhatsApp block */}
            <a 
              href="https://wa.me/919410572857"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#D5F538] text-black font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider hover-glow transition-all"
            >
              <MessageSquare size={14} /> WhatsApp Reservation
            </a>

            {/* Secure Payment Logos — Bucketlistt style */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                <Lock size={10} className="text-gray-500" /> Secure Payments
              </p>
              <div className="flex flex-wrap gap-2">
                {/* UPI */}
                <div className="bg-white rounded-lg px-2 flex items-center justify-center h-8 w-[68px]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4.5 w-auto object-contain" />
                </div>
                {/* Google Pay */}
                <div className="bg-white rounded-lg px-2 flex items-center justify-center h-8 w-[68px]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-4 w-auto object-contain" />
                </div>
                {/* BHIM */}
                <div className="bg-white rounded-lg px-2 flex items-center justify-center h-8 w-[68px]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/65/BHIM_logo.svg" alt="BHIM" className="h-4 w-auto object-contain" />
                </div>
                {/* Visa */}
                <div className="bg-white rounded-lg px-2 flex items-center justify-center h-8 w-[68px]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Visa_Inc._logo_%282005%E2%80%932014%29.svg" alt="Visa" className="h-3 w-auto object-contain" />
                </div>
                {/* Mastercard */}
                <div className="bg-white rounded-lg px-2 flex items-center justify-center h-8 w-[68px]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4.5 w-auto object-contain" />
                </div>
                {/* Amex */}
                <div className="bg-white rounded-lg px-2 flex items-center justify-center h-8 w-[68px]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="American Express" className="h-3.5 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* Column 1: Adventures */}
          <div className="space-y-3 border-b border-white/5 md:border-b-0 pb-3 md:pb-0">
            <h4 
              onClick={() => setFooterAdventuresOpen(!footerAdventuresOpen)}
              className="font-bold text-xs uppercase tracking-widest text-accent font-display flex items-center justify-between md:block cursor-pointer md:cursor-default py-1 md:py-0 select-none"
            >
              <span>Adventures</span>
              <span className="md:hidden text-gray-500 text-sm font-black pr-2">
                {footerAdventuresOpen ? '−' : '+'}
              </span>
            </h4>
            <ul className={`${footerAdventuresOpen ? 'block animate-fade-in' : 'hidden'} md:block space-y-2.5 text-xs font-medium text-gray-400 pl-1 md:pl-0`}>
              <li><button onClick={() => navigateTo('rafting')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400">River Rafting</button></li>
              <li><button onClick={() => navigateTo('bungee')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Bungee Jumping</button></li>
              <li><button onClick={() => navigateTo('zipline')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Ganga Zipline</button></li>
              <li><button onClick={() => navigateTo('paragliding')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Paragliding</button></li>
              <li><button onClick={() => navigateTo('swing')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Giant Swing</button></li>
              <li><button onClick={() => navigateTo('camping')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Riverside Camping</button></li>
            </ul>
          </div>

          {/* Column 2: Services */}
          <div className="space-y-3 border-b border-white/5 md:border-b-0 pb-3 md:pb-0">
            <h4 
              onClick={() => setFooterServicesOpen(!footerServicesOpen)}
              className="font-bold text-xs uppercase tracking-widest text-accent font-display flex items-center justify-between md:block cursor-pointer md:cursor-default py-1 md:py-0 select-none"
            >
              <span>Services</span>
              <span className="md:hidden text-gray-500 text-sm font-black pr-2">
                {footerServicesOpen ? '−' : '+'}
              </span>
            </h4>
            <ul className={`${footerServicesOpen ? 'block animate-fade-in' : 'hidden'} md:block space-y-2.5 text-xs font-medium text-gray-400 pl-1 md:pl-0`}>
              <li><button onClick={() => navigateTo('bikerent')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Bike &amp; Scooty Rent</button></li>
              <li><button onClick={() => navigateTo('hotels')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Boutique Stays</button></li>
              <li><a href="/vendor.html" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-bold transition-colors flex items-center gap-1.5 no-underline"><Smartphone size={13} /> TripGod Vendor App</a></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-3 pb-1 md:pb-0">
            <h4 
              onClick={() => setFooterContactOpen(!footerContactOpen)}
              className="font-bold text-xs uppercase tracking-widest text-accent font-display flex items-center justify-between md:block cursor-pointer md:cursor-default py-1 md:py-0 select-none"
            >
              <span>Contact</span>
              <span className="md:hidden text-gray-500 text-sm font-black pr-2">
                {footerContactOpen ? '−' : '+'}
              </span>
            </h4>
            <ul className={`${footerContactOpen ? 'block animate-fade-in' : 'hidden'} md:block space-y-2.5 text-xs font-medium text-gray-400 pl-1 md:pl-0`}>
              <li className="flex items-center gap-2"><Phone size={12} /> WhatsApp: +91 9410572857</li>
              <li className="flex items-center gap-2"><Mail size={12} /> Email: hi@tripgod.in</li>
              <li className="flex items-center gap-2"><MapPin size={12} /> Rishikesh, Uttarakhand, India</li>
            </ul>
          </div>

          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <span>&copy; 2026 TripGod.in. All rights reserved.</span>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-end items-center">
            <a 
              href="/TripGod_Vendor.apk"
              download="TripGod_Vendor.apk"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#FF6B00] to-[#FF4500] text-white font-extrabold rounded-full text-[11px] uppercase tracking-wider hover:scale-105 transition-all shadow-md no-underline"
              title="Download TripGod Vendor APK file (5.3 MB)"
            >
              <Smartphone size={13} />
              <span>Download Vendor APK</span>
            </a>
            <button onClick={() => navigateTo('vendor')} className="text-orange-400 font-bold hover:text-orange-300 transition-colors cursor-pointer">Vendor Partner Login</button>
            <button onClick={() => navigateTo('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => navigateTo('terms')} className="hover:text-white transition-colors cursor-pointer">Terms &amp; Conditions</button>
            <button onClick={() => navigateTo('refund')} className="hover:text-white transition-colors cursor-pointer">Refund &amp; Cancellation Policy</button>
          </div>
        </div>

      </footer>
      )}

      {/* 5. Cookie Consent & Support Floating Action Widget */}
      {route !== 'admin' && route !== 'vendor' && route !== 'partner' && (
        <>
          <CookieConsent onNavigatePrivacy={() => navigateTo('privacy')} />
          <SupportFloatingWidget phone="919410572857" />
        </>
      )}

      {/* 6. Unified Booking Modal */}
      <ErrorBoundary key={bookingActivity?.id || 'booking-modal'}>
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          // Reset activity after animation completes so modal remounts cleanly next time
          setTimeout(() => setBookingActivity(null), 350);
        }}
        activity={bookingActivity}
        onAddToCart={handleAddToCart}
        initialDate={initialBookingDate}
        initialGuests={initialBookingGuests}
      />
      </ErrorBoundary>

      {/* 7. Unified Cart Sidebar Drawer */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* 8. Search Drawer Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Backdrop click */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
            />

            {/* Search Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="relative w-full max-w-xl bg-white border border-black/10 rounded-2xl shadow-2xl z-10 p-6 space-y-4 mt-12"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="text-lg font-bold font-display text-black">Search Rishikesh Adventures</h3>
                <button 
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-full hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                autoFocus
                placeholder="Type 'rafting', 'zipline', 'camping'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-accent font-semibold"
              />

              {searchQuery && (
                <div className="max-h-60 overflow-y-auto border border-black/5 rounded-xl divide-y divide-black/5 bg-gray-50">
                  {filteredAdventures.length > 0 ? (
                    filteredAdventures.map((adv, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          navigateTo(adv.route);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left py-3 px-4 text-xs font-bold text-gray-700 hover:bg-accent hover:text-black flex justify-between items-center transition-colors"
                      >
                        <span>{adv.name}</span>
                        <ChevronRight size={14} />
                      </button>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs font-semibold text-gray-400">
                      No matching adventures found. Try 'rafting' or 'bike'.
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-1.5 pt-1">
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Popular Queries</span>
                <div className="flex flex-wrap gap-2">
                  {['Rafting', 'Zipline', 'Camping', 'Scooty'].map((term, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(term)}
                      className="px-3 py-1 bg-gray-150 border border-black/5 hover:border-black hover:bg-accent rounded-full text-xs font-bold transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 9. Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={(data) => {
          setUserName(data.name);
          setUserLoggedIn(true);
          localStorage.setItem('tripgod_logged_in', 'true');
          localStorage.setItem('tripgod_user_name', data.name);
          if (data.email) {
            localStorage.setItem('tripgod_user_email', data.email);
          }
        }}
      />

      {/* 10. Account Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        userName={userName}
        userEmail={localStorage.getItem('tripgod_user_email') || ''}
        onLogout={() => {
          setUserLoggedIn(false);
          setUserName('');
          localStorage.removeItem('tripgod_logged_in');
          localStorage.removeItem('tripgod_user_name');
          localStorage.removeItem('tripgod_user_email');
        }}
      />
    </div>
  );
}
