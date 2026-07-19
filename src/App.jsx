import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, LogIn, MessageSquare, X, 
  MapPin, Phone, Mail, ChevronRight, Waves, Bike, Car, Building2, User,
  MapPinned, ShieldCheck, Lock, Handshake
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

// Components
import BookingModal from './components/BookingModal';
import CartModal from './components/CartModal';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';
import AccountModal from './components/AccountModal';

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
  
  // City states (Supabase dynamic multi-city support)
  const [citiesList, setCitiesList] = useState([]);
  const [currentCity, setCurrentCity] = useState(null);

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
      const validRoutes = ['home', 'rafting', 'zipline', 'paragliding', 'bungee', 'swing', 'camping', 'kayaking', 'bikerent', 'pickup', 'hotels', 'tours', 'admin', 'privacy', 'terms', 'refund'];

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
        if (resolvedRoute === 'home') {
          const savedScroll = sessionStorage.getItem('home_scroll_pos');
          if (hash === '#adventures') {
            setTimeout(() => {
              document.getElementById('adventures')?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
          } else if (savedScroll) {
            setTimeout(() => {
              window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'auto' });
            }, 100);
          } else {
            window.scrollTo(0, 0);
          }
        } else {
          window.scrollTo(0, 0);
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
    if (route === 'home') {
      sessionStorage.setItem('home_scroll_pos', window.scrollY);
    }

    if (newRoute === 'adventures') {
      window.history.pushState(null, '', '/#adventures');
      setRoute('home');
      setTimeout(() => {
        document.getElementById('adventures')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      if (newRoute === 'home') {
        sessionStorage.removeItem('home_scroll_pos');
      }
      
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
      window.scrollTo(0, 0);
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

  return (
    <div className="relative min-h-[75vh] bg-gradient-to-b from-[#FAF8F5] via-[#F3F5F6] to-[#FAF8F5] text-black font-sans selection:bg-accent selection:text-black">
      {/* 1. Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-accent z-50 transform origin-left transition-transform duration-100"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* 2. Sticky Header */}
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
            {route === 'admin' && <AdminDashboard setRoute={navigateTo} />}
            {route === 'privacy' && <Privacy />}
            {route === 'terms' && <Terms />}
            {route === 'refund' && <RefundPolicy />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. Footer */}
      <footer className="bg-black text-white font-sans">


        {/* MAIN FOOTER GRID */}
        <div className="py-16 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Logo, Tagline & Payment Logos */}
          <div className="space-y-5 md:col-span-1">
            <div className="flex items-center select-none">
              <span className="font-black text-2xl tracking-tighter text-white">TRIP</span>
              <span className="font-black text-2xl tracking-tighter text-white bg-accent-gradient px-2 py-0.5 rounded-lg ml-1 shadow-sm">GOD</span>
            </div>

            {/* Partner With Us */}
            <div className="flex flex-col gap-1.5">
              <a
                href="https://wa.me/918630027341?text=Hi%2C%20I%20want%20to%20partner%20with%20TripGod%20as%20a%20vendor."
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
              href="https://wa.me/918630027341"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#D5F538] text-black font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider hover-glow transition-all"
            >
              <MessageSquare size={14} /> WhatsApp Reservation
            </a>

            {/* Secure Payment Logos — Bucketlistt style */}
            <div className="space-y-2 pt-2">
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
          <div className="space-y-3 border-b border-white/5 md:border-b-0 pb-4 md:pb-0">
            <h4 
              onClick={() => setFooterAdventuresOpen(!footerAdventuresOpen)}
              className="font-bold text-xs uppercase tracking-widest text-accent font-display flex items-center justify-between md:block cursor-pointer md:cursor-default py-2 md:py-0 select-none"
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
          <div className="space-y-3 border-b border-white/5 md:border-b-0 pb-4 md:pb-0">
            <h4 
              onClick={() => setFooterServicesOpen(!footerServicesOpen)}
              className="font-bold text-xs uppercase tracking-widest text-accent font-display flex items-center justify-between md:block cursor-pointer md:cursor-default py-2 md:py-0 select-none"
            >
              <span>Services</span>
              <span className="md:hidden text-gray-500 text-sm font-black pr-2">
                {footerServicesOpen ? '−' : '+'}
              </span>
            </h4>
            <ul className={`${footerServicesOpen ? 'block animate-fade-in' : 'hidden'} md:block space-y-2.5 text-xs font-medium text-gray-400 pl-1 md:pl-0`}>
              <li><button onClick={() => navigateTo('bikerent')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Bike &amp; Scooty Rent</button></li>
              <li><button onClick={() => navigateTo('hotels')} className="hover:text-accent transition-colors bg-transparent border-none text-left p-0 cursor-pointer font-sans text-gray-400 font-medium">Boutique Stays</button></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-3 pb-2 md:pb-0">
            <h4 
              onClick={() => setFooterContactOpen(!footerContactOpen)}
              className="font-bold text-xs uppercase tracking-widest text-accent font-display flex items-center justify-between md:block cursor-pointer md:cursor-default py-2 md:py-0 select-none"
            >
              <span>Contact</span>
              <span className="md:hidden text-gray-500 text-sm font-black pr-2">
                {footerContactOpen ? '−' : '+'}
              </span>
            </h4>
            <ul className={`${footerContactOpen ? 'block animate-fade-in' : 'hidden'} md:block space-y-2.5 text-xs font-medium text-gray-400 pl-1 md:pl-0`}>
              <li className="flex items-center gap-2"><Phone size={12} /> WhatsApp: 8630027341</li>
              <li className="flex items-center gap-2"><Mail size={12} /> Email: hello@tripgod.in</li>
              <li className="flex items-center gap-2"><MapPin size={12} /> Rishikesh, Uttarakhand, India</li>
            </ul>
          </div>

          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <span>&copy; 2026 TripGod.in. All rights reserved.</span>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-end">
            <button onClick={() => navigateTo('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => navigateTo('terms')} className="hover:text-white transition-colors cursor-pointer">Terms &amp; Conditions</button>
            <button onClick={() => navigateTo('refund')} className="hover:text-white transition-colors cursor-pointer">Refund &amp; Cancellation Policy</button>
          </div>
        </div>

      </footer>

      {/* 5. Floating WhatsApp Pulsing Button */}
      <a
        href="https://wa.me/918630027341"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-6 sm:bottom-6 sm:right-6 z-40 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform group cursor-pointer"
        style={{ contentVisibility: 'auto' }}
      >
        {/* Pulsing rings */}
        <span className="absolute inset-0 rounded-full bg-green-500/40 animate-ping" style={{ animationDuration: '3s' }} />
        <span className="absolute -inset-1.5 rounded-full bg-green-500/20 animate-pulse" style={{ animationDuration: '3s' }} />
        
        {/* White Phone Icon representing WhatsApp */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 448 512" 
          className="w-7 h-7 fill-white relative z-10 transition-transform group-hover:rotate-12"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>

      {/* 6. Unified Booking Modal */}
      <ErrorBoundary>
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
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
