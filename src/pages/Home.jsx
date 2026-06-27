import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Waves, Zap, Compass, Milestone, 
  ArrowRight, ShieldCheck, CreditCard, 
  Star, MessageSquare, Lock, PhoneCall, ChevronDown,
  Calendar, Users, Clock, Activity, MapPin, Building2, Bike, Car, MapPinned, Mountain, Hotel, Ship,
  Handshake
} from 'lucide-react';
import CountUp from '../components/CountUp';
import { supabase } from '../supabase';


const RaftingIcon = (props) => (
  <svg viewBox="0 0 100 100" className="w-10 h-10" stroke="#FF6B00" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M 25 58 C 25 73 75 73 75 58 C 75 48 25 48 25 58 Z" fill="#FF6B00" />
    <path d="M 15 78 Q 30 73 45 78 T 75 78 T 90 78" strokeWidth="4" />
    <circle cx="43" cy="38" r="5" fill="#FF6B00" />
    <path d="M 43 43 L 48 53" />
    <path d="M 33 33 L 58 63" strokeWidth="4" />
    <circle cx="63" cy="38" r="5" fill="#FF6B00" />
    <path d="M 63 43 L 68 53" />
    <path d="M 53 33 L 78 63" strokeWidth="4" />
  </svg>
);

const ParaglidingIcon = (props) => (
  <svg viewBox="0 0 100 100" className="w-10 h-10" stroke="#FF6B00" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M 20 40 C 20 15 80 15 80 40 C 65 35 35 35 20 40 Z" fill="#FF6B00" />
    <path d="M 20 40 L 50 72 M 38 37 L 50 72 M 62 37 L 50 72 M 80 40 L 50 72" strokeWidth="2.5" />
    <circle cx="50" cy="76" r="5" fill="#FF6B00" />
    <path d="M 50 81 L 50 92 L 45 97 M 50 92 L 55 97" />
  </svg>
);

const ZiplineIcon = (props) => (
  <svg viewBox="0 0 100 100" className="w-10 h-10" stroke="#FF6B00" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M 15 35 L 85 65" strokeWidth="4" />
    <path d="M 45 48 L 55 52" strokeWidth="8" />
    <path d="M 50 50 L 50 64" strokeWidth="3" />
    <circle cx="50" cy="69" r="5" fill="#FF6B00" />
    <path d="M 50 74 L 45 84 L 35 87 M 45 84 L 55 89" />
    <path d="M 50 76 L 65 71 M 50 76 L 35 79" />
  </svg>
);

const BikeIcon = (props) => (
  <svg viewBox="0 0 100 100" className="w-10 h-10" stroke="#FF6B00" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="30" cy="65" r="14" />
    <circle cx="70" cy="65" r="14" />
    <path d="M 30 65 L 46 38 L 64 38 L 70 65" />
    <path d="M 46 38 L 50 65" />
    <path d="M 60 25 L 68 25 L 72 38" />
    <path d="M 40 32 L 50 32" strokeWidth="8" />
  </svg>
);


const heroSlides = [
  {
    image: '/rafting-hero.jpg',
    activity: 'White Water Rafting',
    accent: 'Rafting'
  },
  {
    image: '/zipline-hero.jpg',
    activity: 'Ganga Ziplining',
    accent: 'Zipline'
  },
  {
    image: '/paragliding-hero.jpg',
    activity: 'Mountain Paragliding',
    accent: 'Paragliding'
  },
  {
    image: '/camping-hero.jpg',
    activity: 'Riverside Camping',
    accent: 'Camping'
  }
];

export default function Home({ setRoute, openBookingModal, prefDate, setPrefDate, prefGuests, setPrefGuests }) {
  // Slideshow state
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  // Quick Booking Selector States & Data
  const bookingActivitiesList = [
    {
      id: 'rafting-16',
      name: 'River Rafting',
      price: 1290,
      category: 'rafting',
      stretch: '16 KM (Shivpuri to Nim Beach)',
      icon: Waves,
      route: 'rafting'
    },
    {
      id: 'zipline',
      name: 'Ganga Zipline',
      price: 2000,
      category: 'zipline',
      icon: Milestone,
      route: 'zipline'
    },
    {
      id: 'paragliding',
      name: 'Paragliding',
      price: 4500,
      category: 'paragliding',
      icon: Compass,
      route: 'paragliding'
    },
    {
      id: 'swing',
      name: 'Giant Swing',
      price: 3600,
      category: 'swing',
      icon: Zap,
      route: 'swing'
    },
    {
      id: 'camping',
      name: 'Camping',
      price: 1800,
      category: 'camping',
      icon: Compass,
      route: 'camping'
    },
    {
      id: 'bikerent',
      name: 'Bike Rent',
      price: 500,
      category: 'bikerent',
      slots: ['Full Day (09:00 AM - 09:00 PM)', '24 Hours Rent'],
      icon: Milestone,
      route: 'bikerent'
    },
    {
      id: 'hotels',
      name: 'Hotels',
      price: 2200,
      category: 'hotels',
      icon: Star,
      route: 'hotels'
    }
  ];

  const [selectedActivityIdx, setSelectedActivityIdx] = useState(0);
  const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => {
    if (prefDate) return prefDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [bookingGuests, setBookingGuests] = useState(prefGuests || 2);

  // MakeMyTrip style Search Tab States
  const [activeSearchTab, setActiveSearchTab] = useState('hotels');
  
  // Stays / Hotels search states
  const [hotelCheckIn, setHotelCheckIn] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [hotelCheckOut, setHotelCheckOut] = useState(() => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  });
  const [hotelGuests, setHotelGuests] = useState(2);

  // Rafting search states
  const [raftingDate, setRaftingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [raftingGuests, setRaftingGuests] = useState(2);

  // Bike Rental search states
  const [bikeDate, setBikeDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [bikeDays, setBikeDays] = useState(1);

  // Tours search states
  const [tourDate, setTourDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [tourGuests, setTourGuests] = useState(2);

  // Cabs / Pickup search states
  const [cabDate, setCabDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [cabSlot, setCabSlot] = useState('Morning Slot');
  
  const dateInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsActivityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Mouse position tracking for Hero tilt parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };
  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Reviews auto-sliding states
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [isHoveringReviews, setIsHoveringReviews] = useState(false);
  const reviewsContainerRef = useRef(null);

  // FAQ state
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };


  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 35 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  const quickAccess = [
    { label: 'Hotels', emoji: '🏨', route: 'hotels' },
    { label: 'Char Dham', emoji: '🛕', route: 'tours' },
    { label: 'Rafting', emoji: '🚣', route: 'rafting' },
    { label: 'Bike Rent', emoji: '🏍️', route: 'bikerent' }
  ];

  const activities = [
    {
      id: 'rafting',
      name: 'River Rafting',
      desc: 'Fight the rapids of the holy Ganges with certified guides.',
      price: '1,290',
      img: '/rafting-hero.jpg',
      route: 'rafting'
    },
    {
      id: 'zipline',
      name: 'Ganga Zipline',
      desc: 'Glide over the gushing Ganges at speeds up to 140-160 km/h.',
      price: '2,000',
      img: '/zipline-hero.jpg',
      route: 'zipline'
    },
    {
      id: 'paragliding',
      name: 'Paragliding',
      desc: 'Soar high above Rishikesh hills with experienced tandem pilots.',
      price: '4,500',
      img: '/paragliding-hero.jpg',
      route: 'paragliding'
    },
    {
      id: 'swing',
      name: 'Giant Swing',
      desc: 'Swing 113m above deep valleys, single or in couples.',
      price: '3,600',
      img: '/swing-hero.png',
      route: 'swing'
    },
    {
      id: 'camping',
      name: 'Riverside Camping',
      desc: 'Swiss tents, bonfire, snacks and buffet meals near Shivpuri.',
      price: '1,800',
      img: '/camping-hero.jpg',
      route: 'camping'
    }
  ];

  const raftingStretches = [
    {
      km: '12 KM',
      stretch: 'Shivpuri → Laxman Jhula',
      time: '2-3 hrs',
      level: 'Moderate',
      price: 1290,
      badge: 'MOST POPULAR'
    },
    {
      km: '16 KM',
      stretch: 'Shivpuri → Nim Beach',
      time: '3.5 hrs',
      level: 'Thrilling',
      price: 1590
    },
    {
      km: '26 KM',
      stretch: 'Marine Drive → Nim Beach',
      time: '5-6 hrs',
      level: 'Advanced',
      price: 2490
    }
  ];

  const stats = [
    { label: 'Happy Customers', value: '12,000+' },
    { label: 'Partner Vendors', value: '50+' },
    { label: 'Adventure Types', value: '15+' },
    { label: 'Refund Guarantee', value: '100%' }
  ];

  const rentalBikes = [
    {
      id: 'bike-activa',
      name: 'Activa or Similar',
      type: 'Automatic Scooter',
      spec: 'Easy Handling | Practical for Rishikesh Streets',
      price: 800,
      img: '/scooty-rent.jpg',
      badge: 'POPULAR'
    },
    {
      id: 'bike-classic',
      name: 'Royal Enfield Classic',
      type: 'Cruiser Motorcycle',
      spec: '350cc | Comfort Seat | Iconic Thump',
      price: 1300,
      img: '/classic-rent.png',
      badge: 'ICONIC THUMP'
    },
    {
      id: 'bike-hunter',
      name: 'Hunter 350',
      type: 'Urban Roadster',
      spec: '350cc | Nimble Handling | Retro Styling',
      price: 1300,
      img: '/hunter-rent.jpg'
    },
    {
      id: 'bike-xpulse',
      name: 'Xpulse 200',
      type: 'Dual-Purpose Dual-Sport',
      spec: '200cc | Light Weight | Long Travel Suspension',
      price: 1300,
      img: '/xpulse-rent.jpg'
    },
    {
      id: 'bike-himalayan',
      name: 'Himalayan 450 CC',
      type: 'Adventure Tourer',
      spec: '450cc | Sherpa Liquid-Cooled Engine',
      price: 1600,
      img: '/himalayan-rent.jpg'
    }
  ];

  const reviews = [
    { name: 'Amit Sharma', initials: 'AS', location: 'India • Rishikesh', activity: 'River Rafting', stars: 5, text: 'Rafting from Shivpuri was an incredible experience! The guides were very professional and safety-conscious.' },
    { name: 'Priya Patel', initials: 'PP', location: 'India • Rishikesh', activity: 'Scenic Paragliding', stars: 5, text: 'The tandem paragliding flight was amazing. Incredible views and highly experienced pilots!' },
    { name: 'Vikram Singh', initials: 'VS', location: 'India • Rishikesh', activity: 'Ganga Zipline', stars: 5, text: 'Zipping across the Ganges was the highlight of our Rishikesh trip. Breath-taking views!' },
    { name: 'Rohan Gupta', initials: 'RG', location: 'India • Rishikesh', activity: 'Riverside Camping', stars: 5, text: 'Swiss tents were clean, food was delicious, and the bonfire night was magical. Highly recommended!' },
    { name: 'Sara Khan', initials: 'SK', location: 'India • Rishikesh', activity: 'Giant Swing', stars: 5, text: 'An absolute adrenaline rush. TripGod made booking so easy via WhatsApp!' }
  ];

  const faqs = [
    {
      q: "How much advance payment is required to secure a booking?",
      a: "You only need to pay a small partial advance online (which varies by activity) using UPI, cards, or net banking. The remaining balance can be paid directly in cash or UPI at the venue before starting your activity."
    },
    {
      q: "What is your refund and cancellation policy?",
      a: "If you cancel 24 hours or more before your scheduled trip time, your booking advance is 100% refundable, no questions asked. Cancellations made within 24 hours of the trip are non-refundable."
    },
    {
      q: "Is swimming mandatory for river rafting?",
      a: "Not at all! Every rafter is equipped with a high-buoyancy life jacket, safety helmet, and guided by a certified rafting operator. Non-swimmers can comfortably do all rafting stretches."
    },
    {
      q: "What documents do I need to rent a bike or scooty?",
      a: "You need a physical, valid Indian or International Driving License (DL) for two-wheelers, plus one original Government Photo ID (Aadhaar, Passport, or Voter ID) which will be safely kept and returned upon vehicle submission."
    },
    {
      q: "Is TripGod an aggregator or the direct operator?",
      a: "TripGod is a marketplace aggregator. We tie up with certified, highly vetted, and safe adventure companies in Rishikesh. We ensure premium quality, standard flat rates, and handle cancellations/refunds reliably."
    }
  ];

  // Auto sliding reviews effect
  useEffect(() => {
    if (isHoveringReviews) return;
    const interval = setInterval(() => {
      setActiveReviewIdx((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHoveringReviews, reviews.length]);

  // Fetch admin-curated homepage sections from Supabase
  const [featuredHotels, setFeaturedHotels] = useState(null);
  const [featuredTours, setFeaturedTours] = useState(null);
  const [featuredBikes, setFeaturedBikes] = useState(null);

  useEffect(() => {
    const fetchHomepageSections = async () => {
      try {
        // Fetch all curated sections
        const { data: sections, error } = await supabase
          .from('homepage_sections')
          .select('*')
          .order('display_order', { ascending: true });
        if (error) throw error;
        if (!sections || sections.length === 0) return;

        // Hotels
        const hotelIds = sections.filter(s => s.section === 'hotels').map(s => s.item_id);
        if (hotelIds.length > 0) {
          const { data: hotelsData } = await supabase
            .from('hotels')
            .select('id, name, price, images, rating, reviews_count, address')
            .in('id', hotelIds);
          if (hotelsData && hotelsData.length > 0) {
            const ordered = hotelIds.map(id => hotelsData.find(h => h.id === id)).filter(Boolean);
            setFeaturedHotels(ordered.map(h => ({
              id: h.id,
              name: h.name,
              price: Number(h.price),
              img: h.images && h.images[0] ? h.images[0] : '/aloha_resort.png',
              rating: h.rating ? Number(h.rating) : 4.5,
              reviewsCount: h.reviews_count ? Number(h.reviews_count) : 100,
              location: h.address || 'Rishikesh'
            })));
          }
        }

        // Tours
        const tourIds = sections.filter(s => s.section === 'tours').map(s => s.item_id);
        if (tourIds.length > 0) {
          const { data: toursData } = await supabase
            .from('tours')
            .select('id, name, price, images, duration')
            .in('id', tourIds);
          if (toursData && toursData.length > 0) {
            const ordered = tourIds.map(id => toursData.find(t => t.id === id)).filter(Boolean);
            setFeaturedTours(ordered.map(t => ({
              id: t.id,
              name: t.name,
              price: Number(t.price),
              img: t.images && t.images[0] ? t.images[0] : '/kedarnath_temple.png',
              duration: t.duration || '5 Days',
              rating: 4.9,
              reviewsCount: 100
            })));
          }
        }

        // Bikes
        const bikeIds = sections.filter(s => s.section === 'bikes').map(s => s.item_id);
        if (bikeIds.length > 0) {
          const { data: bikesData } = await supabase
            .from('bikes')
            .select('id, name, price, images, description')
            .in('id', bikeIds);
          if (bikesData && bikesData.length > 0) {
            const ordered = bikeIds.map(id => bikesData.find(b => b.id === id)).filter(Boolean);
            setFeaturedBikes(ordered.map(b => ({
              id: b.id,
              name: b.name,
              price: Number(b.price),
              img: b.images && b.images[0] ? b.images[0] : '/scooty-rent.jpg',
              type: b.description || 'Motorcycle'
            })));
          }
        }
      } catch (err) {
        console.warn('Homepage sections fetch failed, using static data:', err);
      }
    };
    fetchHomepageSections();
  }, []);

  return (
    <div className="w-full max-w-screen-xl mx-auto overflow-x-hidden min-h-screen bg-neutral-50 text-black">
      {/* 1. Hero Section */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center bg-[#0B0C10] font-sans overflow-hidden cursor-default"
      >
        {/* Infinite Cross-fading Adventure Slideshow Background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHeroSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{ backgroundImage: `url(${heroSlides[currentHeroSlide].image})` }}
              className="absolute inset-0 bg-cover bg-center"
            />
          </AnimatePresence>
          {/* Dark Glassmorphic/Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/60 to-black/85 z-[1]" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#050508]/40 to-[#0B0C10]/95 z-[1]" />

          {/* Interactive Floating Splash Water Droplets/Particles */}
          <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
            {/* Ambient Base Glow Blobs shifting with mouse */}
            <motion.div 
              animate={{
                x: mousePos.x * 30,
                y: mousePos.y * 30
              }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-[#FF5F00]/15 blur-[120px]" 
            />
            <motion.div 
              animate={{
                x: mousePos.x * -30,
                y: mousePos.y * -30
              }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[450px] h-[250px] sm:h-[450px] rounded-full bg-[#FF3E00]/10 blur-[100px]" 
            />

            {/* Drifting water bubbles/particles */}
            {[...Array(12)].map((_, i) => {
              const size = [8, 12, 16, 20, 24][i % 5];
              const delays = [0, 2, 4, 1.5, 3, 5, 0.5, 2.5, 1, 3.5, 2, 4.5];
              const duration = [8, 12, 10, 14, 9, 11, 13, 8, 11, 9, 14, 10];
              const startX = [10, 25, 45, 60, 80, 95, 15, 35, 55, 70, 85, 90];
              const startY = [90, 85, 95, 90, 88, 92, 87, 89, 93, 86, 91, 94];

              return (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -350],
                    x: [0, (i % 2 === 0 ? 30 : -30)],
                    opacity: [0, 0.45, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: duration[i % duration.length],
                    ease: "easeInOut",
                    delay: delays[i % delays.length]
                  }}
                  style={{
                    left: `${startX[i % startX.length]}%`,
                    top: `${startY[i % startY.length]}%`,
                    width: size,
                    height: size
                  }}
                  className="absolute rounded-full bg-white/20 border border-white/30 backdrop-blur-xs"
                />
              );
            })}
          </div>
        </div>

        {/* Light Glassmorphic Refraction Layer */}
        <div className="absolute inset-0 bg-[#0B0C10]/15 backdrop-blur-[2px] z-[2] pointer-events-none" />

        {/* Content Wrapper */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5 sm:space-y-6 pt-16 pb-12 overflow-hidden">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md text-[#FF6B00] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#FF6B00]/30 shadow-[0_0_15px_rgba(255,107,0,0.15)] animate-pulse"
          >
            3+ Years of Trusted Service in Rishikesh
          </motion.span>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight font-display tracking-tight uppercase"
          >
            STAY, RIDE & ADVENTURE <br />
            IN <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-[#FF3E00] drop-shadow-[0_2px_10px_rgba(255,95,0,0.2)] font-black">RISHIKESH</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-300 max-w-lg mx-auto text-xs sm:text-sm md:text-base leading-relaxed font-medium px-4"
          >
            From riverside stays to the holy Char Dham yatra. Book trusted local vendors instantly. Pay just a <strong className="text-[#FF6B00]">token advance</strong> today, <strong className="text-white">zero stress tomorrow</strong>.
          </motion.p>

          <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col items-stretch md:items-center px-4">
            {/* Tab selection menu */}
            <div className="w-full md:w-auto flex items-center gap-1.5 md:gap-2 bg-black/75 backdrop-blur-xl px-4 md:px-6 py-2.5 md:py-3.5 rounded-t-2xl md:rounded-t-3xl border-t border-x border-white/15 overflow-x-auto no-scrollbar flex-nowrap justify-start md:justify-center scroll-smooth">
              {[
                { id: 'hotels', label: 'Hotels', icon: Building2 },
                { id: 'tours', label: 'Tours', icon: MapPinned },
                { id: 'rafting', label: 'Rafting', icon: Waves },
                { id: 'bikerent', label: 'Bike Rental', icon: Bike }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeSearchTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSearchTab(tab.id)}
                    className={`flex items-center gap-1.5 md:gap-2 px-3.5 md:px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all duration-300 border-none cursor-pointer flex-shrink-0 ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white shadow-[0_4px_15px_rgba(255,95,0,0.35)] scale-105' 
                        : 'text-gray-400 hover:text-white bg-transparent hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-white' : 'text-gray-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab contents (Glassmorphic box) */}
            <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl md:rounded-tr-none p-5 md:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.3)] border border-white/10 relative text-left">
              
              {activeSearchTab === 'hotels' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-center pb-4 md:pb-0">
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] shadow-xs">
                    <MapPin className="text-[#FF5F00] shrink-0" size={18} />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">City / Destination</span>
                      <span className="text-sm font-extrabold text-slate-900 mt-0.5">Rishikesh, India</span>
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] cursor-pointer shadow-xs" onClick={() => document.getElementById('hotel-checkin')?.showPicker()}>
                    <Calendar className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left w-full">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Check-in Date</span>
                      <input 
                        type="date" 
                        id="hotel-checkin"
                        min={new Date().toISOString().split('T')[0]}
                        value={hotelCheckIn}
                        onChange={(e) => {
                          setHotelCheckIn(e.target.value);
                          const checkInDate = new Date(e.target.value);
                          checkInDate.setDate(checkInDate.getDate() + 1);
                          setHotelCheckOut(checkInDate.toISOString().split('T')[0]);
                        }}
                        className="text-sm font-extrabold text-slate-900 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] cursor-pointer shadow-xs" onClick={() => document.getElementById('hotel-checkout')?.showPicker()}>
                    <Calendar className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left w-full">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Check-out Date</span>
                      <input 
                        type="date" 
                        id="hotel-checkout"
                        min={hotelCheckIn}
                        value={hotelCheckOut}
                        onChange={(e) => setHotelCheckOut(e.target.value)}
                        className="text-sm font-extrabold text-slate-900 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] shadow-xs">
                    <Users className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left flex-1">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Guests</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-sm font-extrabold text-slate-900">{hotelGuests} Guest{hotelGuests > 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setHotelGuests(g => Math.max(1, g - 1))} className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-none flex items-center justify-center font-bold cursor-pointer">-</button>
                          <button type="button" onClick={() => setHotelGuests(g => Math.min(20, g + 1))} className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-none flex items-center justify-center font-bold cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
              {activeSearchTab === 'rafting' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center pb-4 md:pb-0">
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] shadow-xs">
                    <MapPin className="text-[#FF5F00] shrink-0" size={18} />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Activity Route</span>
                      <span className="text-sm font-extrabold text-slate-900 mt-0.5">Rishikesh Stretches</span>
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] cursor-pointer shadow-xs" onClick={() => document.getElementById('rafting-date')?.showPicker()}>
                    <Calendar className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left w-full">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Travel Date</span>
                      <input 
                        type="date" 
                        id="rafting-date"
                        min={new Date().toISOString().split('T')[0]}
                        value={raftingDate}
                        onChange={(e) => setRaftingDate(e.target.value)}
                        className="text-sm font-extrabold text-slate-900 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] shadow-xs">
                    <Users className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left flex-1">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Rafters</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-sm font-extrabold text-slate-900">{raftingGuests} Person{raftingGuests > 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setRaftingGuests(g => Math.max(1, g - 1))} className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-none flex items-center justify-center font-bold cursor-pointer">-</button>
                          <button type="button" onClick={() => setRaftingGuests(g => Math.min(30, g + 1))} className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-none flex items-center justify-center font-bold cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
              {activeSearchTab === 'bikerent' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center pb-4 md:pb-0">
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] shadow-xs">
                    <MapPin className="text-[#FF5F00] shrink-0" size={18} />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Pickup Location</span>
                      <span className="text-sm font-extrabold text-slate-900 mt-0.5">Rishikesh Office</span>
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] cursor-pointer shadow-xs" onClick={() => document.getElementById('bike-date')?.showPicker()}>
                    <Calendar className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left w-full">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Start Date</span>
                      <input 
                        type="date" 
                        id="bike-date"
                        min={new Date().toISOString().split('T')[0]}
                        value={bikeDate}
                        onChange={(e) => setBikeDate(e.target.value)}
                        className="text-sm font-extrabold text-slate-900 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] shadow-xs">
                    <Clock className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left flex-1">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Rental Duration</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-sm font-extrabold text-slate-900">{bikeDays} Day{bikeDays > 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setBikeDays(d => Math.max(1, d - 1))} className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-none flex items-center justify-center font-bold cursor-pointer">-</button>
                          <button type="button" onClick={() => setBikeDays(d => Math.min(30, d + 1))} className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-none flex items-center justify-center font-bold cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
              {activeSearchTab === 'tours' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center pb-4 md:pb-0">
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] shadow-xs">
                    <MapPin className="text-[#FF5F00] shrink-0" size={18} />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Destination</span>
                      <span className="text-sm font-extrabold text-slate-900 mt-0.5">Char Dham / Rishikesh</span>
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] cursor-pointer shadow-xs" onClick={() => document.getElementById('tour-date')?.showPicker()}>
                    <Calendar className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left w-full">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Travel Date</span>
                      <input 
                        type="date" 
                        id="tour-date"
                        min={new Date().toISOString().split('T')[0]}
                        value={tourDate}
                        onChange={(e) => setTourDate(e.target.value)}
                        className="text-sm font-extrabold text-slate-900 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="p-3.5 border border-slate-200/60 hover:border-[#FF5F00]/40 rounded-2xl bg-white/70 hover:bg-white/90 transition-all duration-300 flex items-center gap-3 min-h-[68px] shadow-xs">
                    <Users className="text-slate-400 shrink-0" size={18} />
                    <div className="flex flex-col text-left flex-1">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Travellers</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-sm font-extrabold text-slate-900">{tourGuests} Person{tourGuests > 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setTourGuests(g => Math.max(1, g - 1))} className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-none flex items-center justify-center font-bold cursor-pointer">-</button>
                          <button type="button" onClick={() => setTourGuests(g => Math.min(50, g + 1))} className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-none flex items-center justify-center font-bold cursor-pointer">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
              {activeSearchTab === 'pickup' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center pb-4 md:pb-0">
                  <div className="p-3 border border-black/5 hover:border-black/10 rounded-xl bg-gray-50 flex flex-col justify-center min-h-[64px]">
                    <span className="text-[9px] font-black uppercase text-[#FF5F00] tracking-wider">Airport/Station route</span>
                    <span className="text-sm font-extrabold text-black mt-1">Dehradun Airport / Haridwar Station</span>
                  </div>
                  <div className="p-3 border border-black/10 hover:border-[#FF5F00]/50 rounded-xl bg-gray-50 flex flex-col justify-center cursor-pointer min-h-[64px]" onClick={() => document.getElementById('cab-date')?.showPicker()}>
                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Pickup Date</span>
                    <input 
                      type="date" 
                      id="cab-date"
                      min={new Date().toISOString().split('T')[0]}
                      value={cabDate}
                      onChange={(e) => setCabDate(e.target.value)}
                      className="text-sm font-extrabold text-black bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 cursor-pointer mt-0.5"
                    />
                  </div>
                  <div className="p-3 border border-black/10 hover:border-[#FF5F00]/50 rounded-xl bg-gray-50 flex flex-col justify-between min-h-[64px]">
                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Preferred Slot</span>
                    <select 
                      value={cabSlot} 
                      onChange={(e) => setCabSlot(e.target.value)}
                      className="text-sm font-extrabold text-black bg-transparent focus:ring-0 focus:outline-none w-full p-0 cursor-pointer mt-1"
                    >
                      <option value="Morning Slot" className="text-black">Morning Slot (06:00 AM - 12:00 PM)</option>
                      <option value="Afternoon Slot" className="text-black">Afternoon Slot (12:00 PM - 05:00 PM)</option>
                      <option value="Evening Slot" className="text-black">Evening Slot (05:00 PM - 11:00 PM)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Centered hanging search button */}
              <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 z-20">
                <button
                  type="button"
                  onClick={() => {
                    if (activeSearchTab === 'hotels') {
                      setPrefDate(hotelCheckIn);
                      setPrefGuests(hotelGuests);
                      setRoute('hotels');
                    } else if (activeSearchTab === 'rafting') {
                      setPrefDate(raftingDate);
                      setPrefGuests(raftingGuests);
                      setRoute('rafting');
                    } else if (activeSearchTab === 'bikerent') {
                      setPrefDate(bikeDate);
                      setPrefGuests(1);
                      setRoute('bikerent');
                    } else if (activeSearchTab === 'tours') {
                      setPrefDate(tourDate);
                      setPrefGuests(tourGuests);
                      setRoute('tours');
                    } else if (activeSearchTab === 'pickup') {
                      setPrefDate(cabDate);
                      setPrefGuests(1);
                      setRoute('pickup');
                    }
                  }}
                  className="px-10 py-4 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-full shadow-[0_8px_30px_rgba(255,95,0,0.4)] hover:shadow-[0_12px_40px_rgba(255,95,0,0.6)] hover:scale-105 transition-all duration-300 border-none cursor-pointer flex items-center gap-2 font-display"
                >
                  <span>Search</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          </div>
        </div>


        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <svg viewBox="0 0 1440 120" className="w-full h-auto fill-black translate-y-[2px]" preserveAspectRatio="none">
            <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* 5. Infinite Running Stats Ticker */}
      <div className="bg-black text-white py-5 overflow-hidden border-y border-white/10 font-sans">
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: [0, "-33.33%"] }}
            transition={{ 
              ease: "linear", 
              duration: 20, 
              repeat: Infinity 
            }}
            className="flex items-center gap-12 pr-12 text-xs sm:text-sm font-black tracking-widest uppercase"
          >
             {[1, 2, 3].map((setIdx) => (
              <React.Fragment key={setIdx}>
                <span className="flex items-center gap-2"><strong className="text-accent text-base sm:text-lg">12,000+</strong> HAPPY CUSTOMERS</span>
                <span className="text-white/20 text-lg">•</span>
                <span className="flex items-center gap-2"><strong className="text-accent text-base sm:text-lg">50+</strong> PARTNER VENDORS</span>
                <span className="text-white/20 text-lg">•</span>
                <span className="flex items-center gap-2"><strong className="text-accent text-base sm:text-lg">15+</strong> ADVENTURE TYPES</span>
                <span className="text-white/20 text-lg">•</span>
                <span className="flex items-center gap-2"><strong className="text-accent text-base sm:text-lg">100%</strong> REFUND GUARANTEE</span>
                <span className="text-white/20 text-lg">•</span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 2. Quick Access Row */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-b from-[#FAF8F5] to-white border-y border-slate-100 py-10 relative z-20"
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-4 sm:gap-6 px-2 md:px-0">
            {quickAccess.map((item, index) => (
              <button 
                key={index} 
                onClick={() => setRoute(item.route)}
                className="hover-scale-premium hover-glow flex flex-col items-center justify-center gap-2.5 p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center justify-center h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-accent-gradient group-hover:shadow-[0_8px_20px_rgba(255,107,0,0.25)] transition-all duration-500">
                  <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-500">{item.emoji}</span>
                </div>
                <span className="font-black text-[10px] sm:text-xs text-slate-800 tracking-wider uppercase text-center font-display leading-tight mt-1 group-hover:text-[#FF6B00] transition-colors">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 2.5. Recommended Hotels Section */}
      <div className="py-20 border-b border-black/5 bg-white">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-2"
          >
            <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-3 py-1 rounded-full inline-block mb-1">Stay in Luxury</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-display tracking-tight leading-tight text-neutral-900">
              TOP HOTELS IN RISHIKESH
            </h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto mt-4" />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {(featuredHotels || [
              {
                id: 'aloha',
                name: 'Aloha On The Ganges',
                price: 7500,
                img: '/aloha_resort.png',
                rating: 4.8,
                reviewsCount: 345,
                location: 'Tapovan, Near Laxman Jhula'
              },
              {
                id: 'ganga-kinare',
                name: 'Ganga Kinare Resort',
                price: 5500,
                img: '/ganga_kinare.png',
                rating: 4.7,
                reviewsCount: 218,
                location: 'Barrage Road, Rishikesh'
              },
              {
                id: 'divine',
                name: 'Divine Resort & Spa',
                price: 4800,
                img: '/divine_resort.png',
                rating: 4.6,
                reviewsCount: 195,
                location: 'Laxman Jhula Road, Tapovan'
              }
            ]).map((hotel, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                onClick={() => setRoute('hotels')}
                className="group bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div className="h-52 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                  <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute bottom-4 left-4 bg-accent-gradient text-white text-xs font-black py-1.5 px-3.5 rounded-full shadow-[0_4px_12px_rgba(255,95,0,0.25)]">
                    FROM ₹{hotel.price}/NIGHT
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-col text-left mb-1.5">
                      <div className="flex items-center gap-1 text-sm font-extrabold text-slate-800">
                        <Star size={14} className="fill-amber-500 text-amber-500" />
                        <span>{hotel.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{hotel.reviewsCount} Reviews</span>
                    </div>
                    <h3 className="font-extrabold text-base font-display text-slate-900 leading-snug text-left uppercase">{hotel.name}</h3>
                    <p className="text-xs text-slate-450 font-bold flex items-center gap-1"><MapPin size={11} className="text-[#FF5F00] shrink-0" /> {hotel.location}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRoute('hotels'); }}
                      className="w-full py-3 bg-accent-gradient text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] transition-all duration-300 border-none cursor-pointer font-display"
                    >
                      View Stays
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 3. Activity Cards Section */}
      <div id="adventures" className="w-full bg-gray-50/80 py-20 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-2"
          >
            <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-3 py-1 rounded-full inline-block mb-1">Select Your Thrill</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-display tracking-tight text-neutral-900">CHOOSE YOUR ADVENTURE</h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto mt-4" />
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8"
        >
          {activities.map((act) => (
             <motion.div
              key={act.id}
              variants={fadeInUp}
              onClick={() => setRoute(act.route)}
              className="group bg-white border border-slate-100 rounded-3xl overflow-hidden cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
            >
              {/* Image box */}
              <div className="h-32 sm:h-56 bg-slate-100 overflow-hidden relative">
                <img 
                  src={act.img} 
                  alt={act.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-accent-gradient text-white text-[9px] sm:text-xs font-black py-1 px-2.5 sm:px-3.5 rounded-full shadow-[0_4px_12px_rgba(255,95,0,0.25)]">
                  {act.price.includes('Call') || act.price.includes('Enquire') ? act.price : `FROM ₹${act.price}`}
                </div>
              </div>

              {/* Text content — compact, no description */}
              <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-lg font-extrabold font-display tracking-tight text-slate-800 group-hover:text-[#FF5F00] transition-colors text-left uppercase">
                    {act.name}
                  </h3>
                </div>
                
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 group-hover:text-[#FF5F00] transition-colors">
                    Details <ArrowRight size={12} />
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRoute(act.route); }}
                    className="py-1.5 sm:py-2 px-3.5 sm:px-4 bg-accent-gradient text-white text-[9px] sm:text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.4)] transition-all border-none cursor-pointer font-display"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </div>

      {/* 4.2. Char Dham Yatra Section */}
      <div className="py-20 border-b border-black/5 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-2"
          >
            <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-3 py-1 rounded-full inline-block mb-1">Spiritual Pilgrimage</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-display tracking-tight leading-tight text-neutral-900">
              SACRED CHAR DHAM YATRA PACKAGES
            </h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto mt-4" />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {(featuredTours || [
              {
                id: 'dodham',
                name: 'Do Dham Yatra (Kedarnath & Badrinath)',
                price: 18500,
                duration: '5 Days / 4 Nights',
                img: '/badrinath_temple.png',
                rating: 4.9,
                reviewsCount: 148
              },
              {
                id: 'chardham',
                name: 'Complete Char Dham Yatra Tour',
                price: 32000,
                duration: '10 Days / 9 Nights',
                img: '/kedarnath_temple.png',
                rating: 4.9,
                reviewsCount: 215
              }
            ]).map((tour, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                onClick={() => setRoute('tours')}
                className="group bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div className="h-56 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                  <img src={tour.img} alt={tour.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute bottom-4 left-4 bg-accent-gradient text-white text-xs font-black py-1.5 px-3.5 rounded-full shadow-[0_4px_12px_rgba(255,95,0,0.25)]">
                    FROM ₹{tour.price}/PERSON
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-col text-left mb-1.5">
                      <div className="flex items-center gap-1 text-sm font-extrabold text-slate-800">
                        <Star size={14} className="fill-amber-500 text-amber-500" />
                        <span>{tour.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{tour.reviewsCount} Reviews</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-extrabold text-base font-display text-slate-900 leading-snug text-left uppercase">{tour.name}</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-black px-2.5 py-1 rounded-xl shrink-0 uppercase tracking-wider">{tour.duration}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRoute('tours'); }}
                      className="w-full py-3 bg-accent-gradient text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] transition-all duration-300 border-none cursor-pointer font-display"
                    >
                      Explore Tours
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 4.5. Bike & Scooty Rentals Section */}
      <div className="py-20 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-2"
          >
            <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-3 py-1 rounded-full inline-block mb-1">Explore Rishikesh Solo</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-display tracking-tight leading-tight text-neutral-900">
              BIKE & SCOOTY RENTALS
            </h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto mt-4" />
          </motion.div>

          {/* Cards container with responsive horizontal scroll on mobile */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto pt-5 pb-4 md:pb-0 no-scrollbar snap-x snap-mandatory"
          >
            {(featuredBikes || rentalBikes).map((bike, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                onClick={() => setRoute('bikerent')}
                className="flex-shrink-0 w-[85%] sm:w-[60%] md:w-auto snap-center bg-white border border-gray-100/50 rounded-2xl overflow-hidden flex flex-col justify-between relative shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              >
                {bike.badge && (
                  <span className="absolute top-4 right-4 bg-black text-[#FF6B00] text-[10px] font-black tracking-wider py-1 px-3 rounded-full border border-[#FF6B00]/30 shadow-md z-10">
                    {bike.badge}
                  </span>
                )}

                <div className="h-48 bg-gray-100 overflow-hidden relative border-b border-black/5">
                  <img src={bike.img} alt={bike.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 bg-[#FF5F00] text-white text-xs font-black py-1 px-3 rounded-full shadow-[0_4px_10px_rgba(255,95,0,0.25)]">
                    FROM ₹{bike.price}/DAY
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      {bike.type}
                    </span>
                    <h3 className="font-bold text-base font-display text-black">{bike.name}</h3>
                  </div>

                  <div className="pt-3 border-t border-black/5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openBookingModal({
                          id: bike.id,
                          name: `${bike.name} Rental`,
                          price: bike.price,
                          category: 'bikerent',
                          slots: ['Full Day (09:00 AM - 09:00 PM)', '24 Hours Rent']
                        });
                      }}
                      className="w-full py-3 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] transition-all duration-300 hover:scale-[1.01] border-none cursor-pointer font-display"
                    >
                      Book Rental
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>



      {/* 6. Trust Section (Compact Infinite Running Ticker) */}
      <div className="py-6 border-y border-black/5 bg-[#FF5F00]/5 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: [0, "-50%"] }}
            transition={{ 
              ease: "linear", 
              duration: 25, 
              repeat: Infinity 
            }}
            className="flex items-center gap-12 pr-12 text-xs font-black tracking-widest uppercase"
          >
            {[1, 2].map((setIdx) => (
              <React.Fragment key={setIdx}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FF5F00]/15 rounded-full flex items-center justify-center text-[#FF5F00] flex-shrink-0 border border-[#FF5F00]/10">
                    <Lock size={14} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left font-sans">
                    <h4 className="font-bold text-[10px] font-display tracking-wider text-black uppercase leading-tight">FREE CANCELLATION</h4>
                    <p className="text-[9px] text-gray-500 font-semibold leading-none mt-0.5">100% refund up to 24h prior.</p>
                  </div>
                </div>
                <span className="text-black/10 text-lg font-bold">•</span>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FF5F00]/15 rounded-full flex items-center justify-center text-[#FF5F00] flex-shrink-0 border border-[#FF5F00]/10">
                    <CreditCard size={14} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left font-sans">
                    <h4 className="font-bold text-[10px] font-display tracking-wider text-black uppercase leading-tight">LOW ADVANCE PAYMENT</h4>
                    <p className="text-[9px] text-gray-500 font-semibold leading-none mt-0.5">Pay dynamic advance & rest at venue.</p>
                  </div>
                </div>
                <span className="text-black/10 text-lg font-bold">•</span>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FF5F00]/15 rounded-full flex items-center justify-center text-[#FF5F00] flex-shrink-0 border border-[#FF5F00]/10">
                    <Star size={14} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left font-sans">
                    <h4 className="font-bold text-[10px] font-display tracking-wider text-black uppercase leading-tight">VERIFIED OPERATORS</h4>
                    <p className="text-[9px] text-gray-500 font-semibold leading-none mt-0.5">Safety-first certified crews.</p>
                  </div>
                </div>
                <span className="text-black/10 text-lg font-bold">•</span>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FF5F00]/15 rounded-full flex items-center justify-center text-[#FF5F00] flex-shrink-0 border border-[#FF5F00]/10">
                    <PhoneCall size={14} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left font-sans">
                    <h4 className="font-bold text-[10px] font-display tracking-wider text-black uppercase leading-tight">24/7 WHATSAPP HELP</h4>
                    <p className="text-[9px] text-gray-500 font-semibold leading-none mt-0.5">Instant chat support anytime.</p>
                  </div>
                </div>
                <span className="text-black/10 text-lg font-bold">•</span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 6.5. FAQ Section */}
      <div className="w-full bg-gray-50/80 py-20 border-y border-black/5">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-2"
          >
            <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-3 py-1 rounded-full inline-block mb-1">GOT QUESTIONS?</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-display tracking-tight text-neutral-900 uppercase">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto mt-4" />
          </motion.div>

          <div className="space-y-4 max-w-3xl mx-auto font-sans">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 flex items-center justify-between text-left cursor-pointer group bg-transparent border-none"
                  >
                    <span className="font-extrabold text-sm sm:text-base text-slate-800 group-hover:text-[#FF6B00] transition-colors pr-4 uppercase tracking-tight">
                      {faq.q}
                    </span>
                    <ChevronDown 
                      size={20} 
                      className={`text-slate-400 group-hover:text-[#FF6B00] transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#FF6B00]' : ''}`} 
                    />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 pt-3 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed border-t border-slate-50 bg-slate-50/40 text-left">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* 7. Reviews Section (Infinite Translucent Marquee Slider - Luxury Dark Obsidian Edition) */}
      <div className="bg-[#0B0C10] py-20 overflow-hidden relative border-y border-white/5">
        {/* Glowing Sunset Ambient Glow Blobs */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[#FF5F00]/5 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[#FF3E00]/5 blur-[80px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 space-y-10 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-2"
          >
            <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-3 py-1 rounded-full inline-block font-display">Testimonials</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white uppercase">WHAT OUR CUSTOMERS SAY</h2>
            <div className="w-16 h-1 bg-[#FF6B00] mx-auto mt-4" />
          </motion.div>
        </div>

        {/* Infinite Horizontal Carousel */}
        <div className="w-full mt-10 flex overflow-hidden py-4 no-scrollbar relative select-none">
          {/* Left/Right fading gradients to look premium */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0B0C10] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0B0C10] to-transparent z-10 pointer-events-none" />

          <motion.div
            animate={{ x: [0, "-50%"] }}
            transition={{
              ease: "linear",
              duration: 35,
              repeat: Infinity
            }}
            className="flex whitespace-nowrap"
          >
            {/* Block 1 */}
            <div className="flex gap-6 shrink-0 pr-6">
              {reviews.map((rev, idx) => (
                <div 
                  key={idx}
                  className="w-[250px] sm:w-[280px] flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.15)]"
                >
                  <div className="space-y-3">
                    {/* User Profile header */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] flex items-center justify-center font-bold text-white font-display text-xs border border-white/10 shadow-inner">
                        {rev.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white font-display leading-tight">{rev.name}</h4>
                        <p className="text-[9px] text-white/50 font-semibold">{rev.location}</p>
                      </div>
                      {/* Stars */}
                      <div className="flex text-yellow-400 gap-0.5 ml-auto text-[10px]">
                        {[...Array(rev.stars)].map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <p className="text-[11px] sm:text-xs text-white font-medium leading-relaxed whitespace-normal">
                      "{rev.text}"
                    </p>
                  </div>

                  {/* Bottom tag */}
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase text-[#FF6B00] px-2.5 py-1 bg-[#FF6B00]/10 rounded-lg border border-[#FF6B00]/15 inline-block font-display">
                      {rev.activity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Block 2 (Duplicate for seamless loop) */}
            <div className="flex gap-6 shrink-0 pr-6" aria-hidden="true">
              {reviews.map((rev, idx) => (
                <div 
                  key={`dup-${idx}`}
                  className="w-[250px] sm:w-[280px] flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.15)]"
                >
                  <div className="space-y-3">
                    {/* User Profile header */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] flex items-center justify-center font-bold text-white font-display text-xs border border-white/10 shadow-inner">
                        {rev.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white font-display leading-tight">{rev.name}</h4>
                        <p className="text-[9px] text-white/50 font-semibold">{rev.location}</p>
                      </div>
                      {/* Stars */}
                      <div className="flex text-yellow-400 gap-0.5 ml-auto text-[10px]">
                        {[...Array(rev.stars)].map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <p className="text-[11px] sm:text-xs text-white font-medium leading-relaxed whitespace-normal">
                      "{rev.text}"
                    </p>
                  </div>

                  {/* Bottom tag */}
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase text-[#FF6B00] px-2.5 py-1 bg-[#FF6B00]/10 rounded-lg border border-[#FF6B00]/15 inline-block font-display">
                      {rev.activity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
