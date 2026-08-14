import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, Calendar, Users, 
  Percent, Plus, Check, X, Star, MapPin, ChevronLeft, Building2, Waves, Bike, Tent, AlertCircle
} from 'lucide-react';
import { supabase } from '../supabase';
import VendorImageCarousel from '../components/VendorImageCarousel';

// Helper to convert raw address text into clean short landmark badges like "📍 Tapovan", "📍 Janki Setu", "📍 Triveni Ghat"
const toShortLandmark = (fullAddress, fallback = 'Tapovan') => {
  const cleanFallback = String(fallback || 'Tapovan').replace(/📍/g, '').trim();
  if (!fullAddress) return `📍 ${cleanFallback}`;
  
  const sanitized = String(fullAddress).replace(/📍/g, '').trim();
  const lower = sanitized.toLowerCase();

  if (lower.includes('janki setu')) return '📍 Janki Setu';
  if (lower.includes('tapovan')) return '📍 Tapovan';
  if (lower.includes('ramjhula') || lower.includes('ram jhula')) return '📍 Ram Jhula';
  if (lower.includes('laxman') || lower.includes('lakshman')) return '📍 Laxman Jhula';
  if (lower.includes('triveni')) return '📍 Triveni Ghat';
  if (lower.includes('swarg') || lower.includes('geeta')) return '📍 Swarg Ashram';
  if (lower.includes('shivpuri')) return '📍 Shivpuri';
  if (lower.includes('brahmpuri')) return '📍 Brahmpuri';
  if (lower.includes('gangakshetra')) return '📍 Gangakshetra';

  const clean = sanitized.replace(/\d+/g, '').replace(/pincode|uttarakhand|india/gi, '').split(',')[0].trim();
  return `📍 ${clean || cleanFallback}`;
};

// Robust image URL parser (handles JSON string arrays like '["https://..."]', plain strings, delimiter strings, or arrays)
const parseImageUrl = (imgVal) => {
  if (!imgVal) return null;
  if (Array.isArray(imgVal)) {
    for (const item of imgVal) {
      const parsed = parseImageUrl(item);
      if (parsed) return parsed;
    }
    return null;
  }
  if (typeof imgVal === 'string') {
    let trimmed = imgVal.trim();
    if (!trimmed) return null;

    // Handle stringified JSON arrays/objects
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseImageUrl(parsed);
      } catch (e) {
        // ignore parse error
      }
    }

    // Handle delimiter separated strings (e.g. url1|||url2)
    if (trimmed.includes('|||')) {
      const parts = trimmed.split('|||').map(s => s.trim()).filter(Boolean);
      return parseImageUrl(parts);
    }

    if (trimmed.length < 2) return null;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return `/${trimmed}`;
  }
  return null;
};

// Robust helper to extract ALL real uploaded shop photos from vendor record and associated database packages
const getRealVendorImages = (v, dbItemsForVendor = [], defaultFallback = '') => {
  const images = [];

  const addValid = (val) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(item => addValid(item));
      return;
    }
    if (typeof val === 'string') {
      let trimmed = val.trim();
      if (!trimmed) return;
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          const parsed = JSON.parse(trimmed);
          addValid(parsed);
          return;
        } catch (e) {}
      }
      if (trimmed.includes('|||')) {
        trimmed.split('|||').forEach(p => addValid(p));
        return;
      }
      const parsed = parseImageUrl(trimmed);
      if (parsed && !images.includes(parsed)) {
        images.push(parsed);
      }
    }
  };

  if (v) {
    addValid(v.shop_images);
    addValid(v.shop_image);
    addValid(v.shop_photo);
    addValid(v.photos);
    addValid(v.images);
    addValid(v.vendor_image);
    addValid(v.logo);
    addValid(v.banner);
  }

  // Also check items from dbRafting / dbBikes matching vendor
  if (dbItemsForVendor && dbItemsForVendor.length > 0) {
    dbItemsForVendor.forEach(item => {
      addValid(item.images);
      addValid(item.image);
      addValid(item.shop_image);
      addValid(item.vendor_image);
    });
  }

  if (images.length === 0 && defaultFallback) {
    images.push(defaultFallback);
  }

  return images;
};

// Fallback Preset Stretches & Vehicles for Vendors
const DEFAULT_RAFTING_STRETCHES = [
  { id: '12km', name: '12 KM Brahmpuri Rafting', price: 599 },
  { id: '16km', name: '16 KM Shivpuri Rafting', price: 899 },
  { id: '24km', name: '24 KM Marine Drive Rafting', price: 1499 },
  { id: '36km', name: '36 KM Kaudiyala Extreme', price: 2499 }
];

const DEFAULT_BIKE_VEHICLES = [
  { id: 'activa6g', name: 'Honda Activa 6G', price: 500 },
  { id: 'access125', name: 'Suzuki Access 125', price: 550 },
  { id: 'jupiter125', name: 'TVS Jupiter 125', price: 500 },
  { id: 'bullet350', name: 'Royal Enfield Classic 350', price: 1200 }
];

// Initial Fallback Vendors if Database is empty
const FALLBACK_VENDORS = [
  {
    id: 'v-fallback-hbevergreen',
    company_name: 'HB Evergreen Adventure',
    category: 'Multi-Service / All Services',
    landmark: 'Janki Setu',
    star_rating: 4.5,
    status: 'ACTIVE',
    shop_images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600']
  },
  {
    id: 'v-fallback-brothers',
    company_name: 'Brothers Adventure tour & travels',
    category: 'Bike Rental',
    landmark: 'Rishikesh Bus Stand',
    star_rating: 4.4,
    status: 'ACTIVE',
    shop_images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600', '/classic-rent.png']
  },
  {
    id: 'v-fallback-hikenride',
    company_name: 'Hike N Ride',
    category: 'Bike Rental',
    landmark: 'Janki Setu',
    star_rating: 4.6,
    status: 'ACTIVE',
    shop_images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600', '/scooty-rent.jpg']
  },
  {
    id: 'v-fallback-hillbrook',
    company_name: 'Hill Brook Adventure',
    category: 'Multi-Service / All Services',
    landmark: 'Laxman Jhula',
    star_rating: 4.7,
    status: 'ACTIVE',
    shop_images: ['https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=600', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600']
  }
];

export default function CustomComboPage({ onClose, onBookCustomCombo }) {
  // Database State Lists
  const [hotels, setHotels] = useState([]);
  const [dbVendors, setDbVendors] = useState([]);
  const [dbRafting, setDbRafting] = useState([]);
  const [dbBikes, setDbBikes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState('all');

  // Vendor Selections Map
  const [raftingStretchMap, setRaftingStretchMap] = useState({});
  const [bikeVehicleMap, setBikeVehicleMap] = useState({});
  const [raftingVendorSelectionMap, setRaftingVendorSelectionMap] = useState({});
  const [bikeVendorSelectionMap, setBikeVendorSelectionMap] = useState({});

  // Active Service Details Drawer State
  const [activeDetailItem, setActiveDetailItem] = useState(null);

  // Dynamic Discount Tier Rules (Editable via Admin or Default)
  const [discountRules, setDiscountRules] = useState(() => {
    try {
      const saved = localStorage.getItem('tripgod_combo_discount_rules');
      return saved ? JSON.parse(saved) : { tier2: 5, tier3: 10, tier4: 15, tier5: 20 };
    } catch {
      return { tier2: 5, tier3: 10, tier4: 15, tier5: 20 };
    }
  });

  // Selected Cart Items Array
  const [cartItems, setCartItems] = useState([]);

  // Booking Preferences
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [persons, setPersons] = useState(2);

  useEffect(() => {
    fetchSupabaseData();
  }, []);

  const fetchSupabaseData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      const [
        { data: hData },
        { data: vData },
        { data: rData },
        { data: bData }
      ] = await Promise.all([
        supabase.from('hotels').select('*').order('name'),
        supabase.from('vendors').select('*').order('name'),
        supabase.from('rafting').select('*').order('price'),
        supabase.from('bikes').select('*').order('price')
      ]);

      if (hData) setHotels(hData);
      if (vData && vData.length > 0) setDbVendors(vData);
      if (rData) setDbRafting(rData);
      if (bData) setDbBikes(bData);
    } catch (err) {
      console.error('Error loading Supabase items for combo builder:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract REAL uploaded shop image from vendor object (set during onboarding)
  const getRealVendorImage = (v, defaultImg) => {
    if (!v) return defaultImg;
    const url = parseImageUrl(v.shop_image) ||
                parseImageUrl(v.shop_images) ||
                parseImageUrl(v.photos) ||
                parseImageUrl(v.images) ||
                parseImageUrl(v.shop_photo) ||
                parseImageUrl(v.logo) ||
                parseImageUrl(v.banner);

    return url || defaultImg;
  };

  // Helper to extract REAL rating from vendor object (set during onboarding)
  const getRealVendorRating = (v) => {
    if (!v) return '4.5';
    const r = v.star_rating || v.rating || v.vendor_rating;
    if (r && !isNaN(r)) return Number(r).toFixed(1);
    return '4.5';
  };

  // Toggle Item in Cart
  const toggleCartItem = (itemPayload) => {
    if (itemPayload.isOffline) return; // Cannot add offline vendor
    setCartItems(prev => {
      const exists = prev.some(i => i.cartKey === itemPayload.cartKey);
      if (exists) {
        return prev.filter(i => i.cartKey !== itemPayload.cartKey);
      } else {
        return [...prev, itemPayload];
      }
    });
  };

  const isItemInCart = (cartKey) => {
    return cartItems.some(i => i.cartKey === cartKey);
  };

  // Cart calculations
  const cartCount = cartItems.length;
  let discountPercent = 0;
  if (cartCount === 2) discountPercent = discountRules.tier2 || 5;
  else if (cartCount === 3) discountPercent = discountRules.tier3 || 10;
  else if (cartCount === 4) discountPercent = discountRules.tier4 || 15;
  else if (cartCount >= 5) discountPercent = discountRules.tier5 || 20;

  const rawSubtotalPerPerson = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const rawSubtotalAll = rawSubtotalPerPerson * persons;
  
  const rawDiscountCalc = (rawSubtotalAll * discountPercent) / 100;
  const totalSaved = discountPercent > 0 && rawSubtotalAll > 0 
    ? Math.max(1, Math.round(rawDiscountCalc)) 
    : 0;

  const discountAmountPerPerson = persons > 0 ? (totalSaved / persons) : 0;
  const finalPricePerPerson = rawSubtotalPerPerson - discountAmountPerPerson;
  const grandTotal = rawSubtotalAll - totalSaved;

  const handleProceedBooking = () => {
    if (cartItems.length === 0) return;

    // 1. Raw Sum of required backend fixed advances
    const rawTotalAdvancePerPerson = cartItems.reduce((sum, item) => {
      const itemAdv = item.fixedAdvance !== undefined && item.fixedAdvance !== null && Number(item.fixedAdvance) >= 0
        ? Number(item.fixedAdvance)
        : Math.round(Number(item.price || 0) * 0.1);
      return sum + itemAdv;
    }, 0);

    // 2. Hotel GST
    const hotelGstPerPerson = cartItems.reduce((sum, item) => {
      if (item.category === 'Hotel' || item.category === 'hotel') {
        const gst = item.gstAmount !== undefined ? item.gstAmount : Math.round(Number(item.price || 0) * 0.12);
        return sum + gst;
      }
      return sum;
    }, 0);

    const totalHotelGst = hotelGstPerPerson * persons;
    const rawTotalAdvanceAll = rawTotalAdvancePerPerson * persons;

    // 3. Online Advance = Total Advance for all persons - Total Discount + Total Hotel GST
    const totalAdvance = Math.max(1, rawTotalAdvanceAll - totalSaved + totalHotelGst);

    // 4. Total Vendor Base Payout at Venue
    const totalVendorPayoutPerPerson = cartItems.reduce((sum, item) => {
      const vRate = item.vendorRate !== undefined && item.vendorRate !== null 
        ? Number(item.vendorRate) 
        : Math.max(0, Number(item.price || 0) - Number(item.fixedAdvance || 0));
      return sum + vRate;
    }, 0);
    const totalVendorPayout = totalVendorPayoutPerPerson * persons;

    // 5. Grand Total Price for all persons
    const grandTotalWithGst = Math.max(0, rawSubtotalAll - totalSaved + totalHotelGst);
    const finalPriceWithGstPerPerson = persons > 0 ? (grandTotalWithGst / persons) : 0;

    const payload = {
      id: `custom-combo-${Date.now()}`,
      title: `Custom Rishikesh Combo (${cartCount} Services)`,
      name: `Custom Rishikesh Combo (${cartCount} Services)`,
      type: 'custom_combo',
      category: 'combo',
      price: finalPriceWithGstPerPerson,
      totalPrice: grandTotalWithGst,
      advance_amount: totalAdvance,
      persons,
      guests: persons,
      travelDate,
      items: cartItems.map(item => ({
        ...item,
        vendorRate: item.vendorRate !== undefined ? item.vendorRate : Math.max(0, Number(item.price || 0) - Number(item.fixedAdvance || 0)),
        mapLink: item.mapLink || `https://maps.google.com/?q=${encodeURIComponent((item.fullAddress || item.vendorName || item.name) + ' Rishikesh')}`
      })),
      discountPercent,
      rawTotal: rawSubtotalAll,
      totalSaved,
      totalHotelGst,
      rawTotalAdvancePerPerson: rawTotalAdvanceAll,
      finalAdvancePerPerson: totalAdvance,
      totalVendorPayout
    };

    if (onBookCustomCombo) {
      onBookCustomCombo(payload);
    }
  };

  const handleWhatsAppBooking = () => {
    let msg = `Hi TripGod! I built a Custom Bundle on your website:\n\n`;
    cartItems.forEach((item, i) => {
      msg += `${i + 1}. [${item.category}] Vendor: ${item.vendorName} (${item.name}) — ₹${item.price}\n`;
    });
    msg += `\n📅 Travel Date: ${travelDate}\n👥 Guests: ${persons} Persons\n🔥 Combo Discount: ${discountPercent}% OFF (Saved ₹${totalSaved})\n💰 Total Amount: ₹${grandTotal.toLocaleString('en-IN')}`;

    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 1. Build Hotel Display List
  const hotelsCardList = hotels.map(h => {
    const isOffline = h.is_active === false || 
                      h.is_closed === true || 
                      h.coming_soon === true || 
                      (h.status && h.status.toLowerCase() !== 'active');
    const offlineReason = h.status_reason || h.offline_reason || (h.coming_soon ? 'COMING SOON' : 'CLOSED / OFFLINE');
    const hotelImages = getRealVendorImages(h, [], 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=600');
    
    // h.price in database is ALREADY the final customer display price (e.g. 999)
    const displayPrice = Number(h.price || 0);
    let comm = 0;
    if (h.commission_value !== null && h.commission_value !== undefined && h.commission_value !== '') {
      comm = h.commission_type === 'percentage' 
        ? Math.round((displayPrice * Number(h.commission_value)) / 100)
        : Number(h.commission_value);
    } else if (h.commission_amount !== null && h.commission_amount !== undefined && h.commission_amount !== '') {
      comm = Number(h.commission_amount);
    } else if (h.commission_percentage) {
      comm = Math.round((displayPrice * Number(h.commission_percentage)) / 100);
    } else {
      comm = 199;
    }

    let fixAdv = 0;
    if (h.fixed_advance_amount !== null && h.fixed_advance_amount !== undefined && h.fixed_advance_amount !== '') {
      fixAdv = Number(h.fixed_advance_amount);
    } else {
      fixAdv = comm > 0 ? comm : 199;
    }

    const roomVendorRate = Math.max(0, displayPrice - comm);
    const advanceVal = fixAdv > 0 ? fixAdv : (comm > 0 ? comm : Math.round(displayPrice * 0.1));
    const gstVal = Math.round(displayPrice * 0.12);
    const addressStr = h.address || 'Tapovan, Rishikesh';

    return {
      cartKey: `hotel-${h.id}`,
      id: h.id,
      category: 'Hotel',
      name: h.name,
      vendorName: h.name,
      price: displayPrice,
      vendorRate: roomVendorRate,
      roomPrice: roomVendorRate,
      fixedAdvance: advanceVal,
      commission_amount: comm,
      gstAmount: gstVal,
      landmarkLocation: toShortLandmark(addressStr, 'Tapovan'),
      fullAddress: addressStr,
      mapLink: `https://maps.google.com/?q=${encodeURIComponent(addressStr)}`,
      image: hotelImages[0],
      images: hotelImages,
      rating: h.rating || 4.5,
      isOffline,
      offlineReason,
      description: h.description || 'Deluxe AC room stay with mountain view, hot water & Wi-Fi.'
    };
  });

  // Effective Vendor List (Uses Real Database Vendors)
  const effectiveVendors = dbVendors.length > 0 ? dbVendors : FALLBACK_VENDORS;

  // 2. Build Super Clear Rafting Stretch Cards (Grouped by Stretch: 16KM, 24KM, 12KM, 36KM)
  const raftingVendorsMap = new Map();
  effectiveVendors.forEach(v => {
    const cat = (v.service_category || v.category || '').toLowerCase();
    if (cat.includes('rafting') || cat.includes('multi-service') || cat.includes('all services') || cat.includes('adventure') || !cat) {
      raftingVendorsMap.set(String(v.id), v);
    }
  });

  const raftingVendorsList = Array.from(raftingVendorsMap.values());
  const activeRaftingVendors = raftingVendorsList.filter(v => 
    v.status !== 'INACTIVE' && v.status !== 'OFF' && v.is_active !== false && v.is_closed !== true
  );
  const displayRaftingVendors = activeRaftingVendors.length > 0 ? activeRaftingVendors : raftingVendorsList;

  // Helper to extract real uploaded rafting image from backend dbRafting packages
  const getRaftingStretchImage = (stretchId, defaultFallbackImg) => {
    const match = dbRafting.find(r => {
      const act = (r.activity_type || 'rafting').toLowerCase();
      if (act !== 'rafting' && act !== '') return false;
      const rName = (r.name || '').toLowerCase();
      const dist = String(r.distance_km || '');
      if (stretchId === '12km') return rName.includes('12') || dist === '12';
      if (stretchId === '16km') return rName.includes('16') || rName.includes('14') || rName.includes('shivpuri') || dist === '16' || dist === '14';
      if (stretchId === '24km') return rName.includes('24') || rName.includes('18') || rName.includes('marine') || dist === '24' || dist === '18';
      if (stretchId === '36km') return rName.includes('36') || rName.includes('kaudiyala') || dist === '36';
      return false;
    });

    if (match) {
      const img = parseImageUrl(match.images) || parseImageUrl(match.image) || parseImageUrl(match.shop_image);
      if (img) return img;
    }

    const anyRafting = dbRafting.find(r => {
      const act = (r.activity_type || 'rafting').toLowerCase();
      return (act === 'rafting' || act === '') && (r.images || r.image);
    });
    if (anyRafting) {
      const img = parseImageUrl(anyRafting.images) || parseImageUrl(anyRafting.image);
      if (img) return img;
    }

    return defaultFallbackImg;
  };

  const RAFTING_STRETCH_DEFINITIONS = [
    {
      id: '12km',
      name: '12 KM Brahmpuri Rafting (Family & Kids)',
      price: 599,
      fixedAdvance: 150,
      vendorRate: 449,
      badge: 'RAFTING',
      image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=600',
      description: 'Gentle 12 KM rafting stretch from Brahmpuri to Neem Beach suitable for families, first-timers & kids.'
    },
    {
      id: '14km',
      name: '14 KM Club House Rafting (Popular)',
      price: 699,
      fixedAdvance: 200,
      vendorRate: 499,
      badge: 'RAFTING',
      image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=600',
      description: '14 KM river rafting route from Club House to Nim Beach featuring Grade II & III rapids.'
    },
    {
      id: '18km',
      name: '18 KM Shivpuri Rafting (Most Popular)',
      price: 999,
      fixedAdvance: 200,
      vendorRate: 799,
      badge: 'RAFTING',
      image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=600',
      description: 'The most famous 18 KM Shivpuri to Nim Beach rafting stretch featuring Roller Coaster, Golf Course rapids & cliff jumping.'
    },
    {
      id: '26km',
      name: '26 KM Marine Drive Rafting (Extreme)',
      price: 1499,
      fixedAdvance: 300,
      vendorRate: 1199,
      badge: 'RAFTING',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600',
      description: 'Thrilling 26 KM long stretch from Marine Drive featuring 16 major Grade III/IV rapids, bodysurfing & cliff jumping.'
    }
  ];

  const dbVendorRaftingCards = RAFTING_STRETCH_DEFINITIONS.map(stretchDef => {
    // 1. Filter DB rafting packages from dbRafting for this specific stretch
    const stretchDbRaftingItems = dbRafting.filter(r => {
      const act = (r.activity_type || 'rafting').toLowerCase();
      if (act !== 'rafting' && act !== '') return false;

      const rName = (r.name || '').toLowerCase();
      const route = (r.route || '').toLowerCase();
      const distNum = r.distance_km ? parseInt(String(r.distance_km), 10) : 0;
      const distStr = String(r.distance_km || '');

      if (stretchDef.id === '12km') {
        return distNum === 12 || distStr === '12' || rName.includes('12') || rName.includes('brahmpuri') || route.includes('brahmpuri');
      }
      if (stretchDef.id === '14km') {
        return distNum === 14 || distNum === 16 || distStr === '14' || distStr === '16' || rName.includes('14') || rName.includes('16') || rName.includes('club') || route.includes('club');
      }
      if (stretchDef.id === '18km') {
        return distNum === 18 || distStr === '18' || rName.includes('18') || rName.includes('shivpuri') || route.includes('shivpuri');
      }
      if (stretchDef.id === '26km') {
        return distNum === 26 || distNum === 24 || distStr === '26' || distStr === '24' || rName.includes('26') || rName.includes('24') || rName.includes('marine') || route.includes('marine');
      }
      return false;
    });

    // 2. Build available vendors list dynamically for ALL vendors associated with this stretch in DB
    const availableVendorsForStretch = [];

    if (stretchDbRaftingItems.length > 0) {
      stretchDbRaftingItems.forEach((rItem, idx) => {
        const vId = rItem.vendor_id ? String(rItem.vendor_id) : `v-item-${rItem.id || idx}`;
        const matchingVendor = effectiveVendors.find(v => String(v.id) === vId || (v.company_name && rItem.vendor_name && v.company_name.toLowerCase() === rItem.vendor_name.toLowerCase()));

        const vName = matchingVendor?.company_name || matchingVendor?.name || rItem.vendor_name || rItem.operator_name || 'Rafting Crew';
        const vLandmark = toShortLandmark(matchingVendor?.landmark || matchingVendor?.address || rItem.landmark || rItem.address, 'Janki Setu');
        const itemPrice = Number(rItem.price || rItem.net_price || stretchDef.price);

        const isItemClosed = !!(
          rItem.is_closed === true || 
          rItem.is_closed === 1 || 
          rItem.is_closed === 'true' || 
          rItem.is_active === false || 
          rItem.status === 'CLOSED' || 
          rItem.status === 'INACTIVE' || 
          rItem.status === 'OFF' ||
          matchingVendor?.is_closed === true ||
          matchingVendor?.status === 'INACTIVE' ||
          matchingVendor?.status === 'OFF' ||
          matchingVendor?.is_active === false
        );

        const reason = rItem.closed_reason || rItem.closure_reason || rItem.offline_reason || rItem.status_reason || matchingVendor?.status_reason || matchingVendor?.offline_reason || 'TEMPORARILY CLOSED';

        const existingIdx = availableVendorsForStretch.findIndex(v => String(v.id) === vId || v.company_name === vName);
        if (existingIdx === -1) {
          availableVendorsForStretch.push({
            id: vId,
            company_name: vName,
            name: vName,
            landmark: vLandmark,
            price: itemPrice > 0 ? itemPrice : stretchDef.price,
            vendorRate: Number(rItem.vendor_rate || rItem.net_price || (itemPrice ? Math.max(0, itemPrice - 200) : stretchDef.vendorRate)),
            fixedAdvance: Number(rItem.fixed_advance_amount || rItem.advance_amount || stretchDef.fixedAdvance),
            is_closed: isItemClosed,
            closed_reason: reason,
            fullVendorObj: matchingVendor || { id: vId, company_name: vName, landmark: vLandmark }
          });
        }
      });
    }

    // Fallback ONLY if dbRafting has no items for this stretch
    if (availableVendorsForStretch.length === 0) {
      displayRaftingVendors.forEach(v => {
        const isVClosed = v.is_closed === true || v.status === 'INACTIVE' || v.status === 'OFF' || v.is_active === false;
        availableVendorsForStretch.push({
          id: String(v.id),
          company_name: v.company_name || v.name,
          name: v.company_name || v.name,
          landmark: toShortLandmark(v.landmark || v.address, 'Janki Setu'),
          price: stretchDef.price,
          vendorRate: stretchDef.vendorRate,
          fixedAdvance: stretchDef.fixedAdvance,
          is_closed: isVClosed,
          closed_reason: v.offline_reason || v.status_reason || 'TEMPORARILY CLOSED',
          fullVendorObj: v
        });
      });
    }

    const selectedVendorId = raftingVendorSelectionMap[stretchDef.id] || (availableVendorsForStretch[0]?.id || 'v-default');
    const selectedVendorData = availableVendorsForStretch.find(v => String(v.id) === String(selectedVendorId)) || availableVendorsForStretch[0] || {};
    const selectedVendor = selectedVendorData.fullVendorObj || {};

    // Is stretch offline?
    // Stretch is offline if ALL vendors for this stretch are closed OR if the selected vendor is closed
    const isStretchAllClosed = availableVendorsForStretch.length > 0 && availableVendorsForStretch.every(v => v.is_closed);
    const isSelectedVendorClosed = !!selectedVendorData.is_closed;

    const isOffline = isStretchAllClosed || isSelectedVendorClosed;

    const closedPkg = stretchDbRaftingItems.find(r => r.closure_reason || r.closed_reason || r.offline_reason || r.status_reason) || dbRafting.find(r => r.closure_reason || r.closed_reason || r.offline_reason);
    let offlineReason = selectedVendorData.closed_reason || 'TEMPORARILY CLOSED';
    if (closedPkg && (closedPkg.closed_reason || closedPkg.closure_reason || closedPkg.offline_reason || closedPkg.status_reason)) {
      offlineReason = closedPkg.closed_reason || closedPkg.closure_reason || closedPkg.offline_reason || closedPkg.status_reason;
    }

    const vName = selectedVendorData.company_name || selectedVendor.company_name || selectedVendor.name || 'HB Evergreen Adventure';
    const landmark = selectedVendorData.landmark || toShortLandmark(selectedVendor.landmark || selectedVendor.vendor_address || selectedVendor.address, 'Janki Setu');

    const realRaftImg = getRaftingStretchImage(stretchDef.id, stretchDef.image);
    const vendorImages = getRealVendorImages(selectedVendor, stretchDbRaftingItems, realRaftImg);
    const cardImages = [realRaftImg, ...vendorImages.filter(img => img !== realRaftImg)];

    return {
      cartKey: `rafting-stretch-${stretchDef.id}-v-${selectedVendorData.id || 'default'}`,
      id: selectedVendorData.id || stretchDef.id,
      category: 'Rafting',
      categoryBadge: 'RAFTING',
      name: stretchDef.name,
      vendorName: vName,
      price: selectedVendorData.price || stretchDef.price,
      vendorRate: selectedVendorData.vendorRate || stretchDef.vendorRate,
      fixedAdvance: selectedVendorData.fixedAdvance || stretchDef.fixedAdvance,
      landmarkLocation: landmark,
      fullAddress: selectedVendor.vendor_address || selectedVendor.address || `${landmark}, Rishikesh`,
      image: realRaftImg,
      images: cardImages,
      rating: getRealVendorRating(selectedVendor),
      description: stretchDef.description,
      isOffline,
      offlineReason,
      isRaftingStretchCard: true,
      stretchId: stretchDef.id,
      selectedVendorId: selectedVendorData.id,
      availableVendors: availableVendorsForStretch
    };
  });

  // 3. Build Super Clear Vehicle-Model-First Scooty & Bike Cards (All 11 Models)
  const bikeVendorsMap = new Map();
  effectiveVendors.forEach(v => {
    const cat = (v.service_category || v.category || '').toLowerCase();
    if (cat.includes('bike') || cat.includes('scooty') || cat.includes('multi-service') || cat.includes('all services') || !cat) {
      bikeVendorsMap.set(String(v.id), v);
    }
  });

  const bikeVendorsList = Array.from(bikeVendorsMap.values());
  const activeBikeVendors = bikeVendorsList.filter(v => 
    v.status !== 'INACTIVE' && v.status !== 'OFF' && v.is_active !== false && v.is_closed !== true
  );
  const displayBikeVendors = activeBikeVendors.length > 0 ? activeBikeVendors : bikeVendorsList;

  const getBikeCustomerDetails = (b, v) => {
    if (!b) return { finalPrice: 700, fixedAdvance: 200, vendorRate: 500 };
    const p = Number(b.price || 0);
    const net = Number(b.net_price || 0);
    
    let fixAdv = 0;
    if (b.fixed_advance_amount !== null && b.fixed_advance_amount !== undefined && b.fixed_advance_amount !== '') {
      fixAdv = Number(b.fixed_advance_amount);
    } else if (v && (v.fixed_advance_amount !== null && v.fixed_advance_amount !== undefined && v.fixed_advance_amount !== '')) {
      fixAdv = Number(v.fixed_advance_amount);
    }

    let comm = 0;
    if (b.commission_amount !== null && b.commission_amount !== undefined && b.commission_amount !== '') {
      comm = Number(b.commission_amount);
    } else if (b.commission_percentage && net > 0) {
      comm = Math.round((net * Number(b.commission_percentage)) / 100);
    } else if (v && (v.commission_amount !== null && v.commission_amount !== undefined && v.commission_amount !== '')) {
      comm = Number(v.commission_amount);
    } else {
      comm = 200;
    }

    const calculatedTotal = net > 0 ? (net + comm) : (p > 0 && p !== net ? p : p + comm);
    const rawTotal = Math.max(p, calculatedTotal);
    const finalPrice = rawTotal > 0 ? rawTotal : 700;
    const advanceVal = fixAdv > 0 ? fixAdv : (comm > 0 ? comm : Math.round(finalPrice * 0.1));
    const vRate = net > 0 ? net : Math.max(0, finalPrice - comm);

    return { finalPrice, fixedAdvance: advanceVal, vendorRate: vRate };
  };

  // Group real bikes from Supabase dbBikes table by normalized vehicle model name
  const dbBikeModelsGroupMap = new Map();

  dbBikes.forEach(b => {
    if (b.is_active === false || b.is_closed === true || b.status === 'INACTIVE') return;
    const rawName = (b.name || '').trim();
    if (!rawName) return;

    const normKey = rawName.toLowerCase();
    if (!dbBikeModelsGroupMap.has(normKey)) {
      dbBikeModelsGroupMap.set(normKey, {
        name: rawName,
        items: [b]
      });
    } else {
      dbBikeModelsGroupMap.get(normKey).items.push(b);
    }
  });

  // If dbBikes has items, use DB models exclusively! If empty, fallback to standard active DB models
  let vehicleModelList = Array.from(dbBikeModelsGroupMap.values()).map(group => {
    const nameLower = group.name.toLowerCase();
    
    // Find uploaded image from DB items
    let dbImg = null;
    for (const item of group.items) {
      const parsed = parseImageUrl(item.images) || parseImageUrl(item.image) || parseImageUrl(item.photo);
      if (parsed) { dbImg = parsed; break; }
    }

    let defaultImg = 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600';
    let badge = 'SCOOTY';
    if (nameLower.includes('classic') || nameLower.includes('bullet') || nameLower.includes('hunter')) {
      defaultImg = '/classic-rent.png';
      badge = 'BIKE';
    } else if (nameLower.includes('himalayan') || nameLower.includes('xpulse') || nameLower.includes('bike') || nameLower.includes('royalenfield')) {
      defaultImg = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600';
      badge = 'BIKE';
    } else if (nameLower.includes('access') || nameLower.includes('burgman')) {
      defaultImg = '/scooty-rent.jpg';
    }

    const minPrice = Math.min(...group.items.map(b => getBikeCustomerDetails(b).finalPrice));

    return {
      id: group.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: group.name,
      price: minPrice > 0 && isFinite(minPrice) ? minPrice : 700,
      badge,
      image: dbImg || defaultImg,
      dbItems: group.items,
      description: `${group.name} available for rent in Rishikesh with helmets included and quick document verification.`
    };
  });

  // Fallback if dbBikes was empty
  if (vehicleModelList.length === 0) {
    vehicleModelList = [
      { id: 'activa6g', name: 'Honda Activa 6G (110cc)', price: 700, badge: 'SCOOTY', image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600', description: 'Reliable, gearless automatic 110cc scooter with helmet & quick verification.' },
      { id: 'activa125', name: 'Honda Activa 125', price: 700, badge: 'SCOOTY', image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600', description: 'Powerful 125cc gearless automatic scooter for effortless double riding.' },
      { id: 'access125', name: 'Suzuki Access 125', price: 750, badge: 'SCOOTY', image: '/scooty-rent.jpg', description: 'Popular 125cc power scooter with smooth acceleration.' },
      { id: 'burgman125', name: 'Suzuki Burgman Street 125', price: 850, badge: 'SCOOTY', image: '/scooty-rent.jpg', description: 'Maxi-style premium scooter with front windscreen.' },
      { id: 'classic350', name: 'Royal Enfield Classic 350', price: 1200, badge: 'BIKE', image: '/classic-rent.png', description: 'Iconic 350cc cruiser motorcycle for roaring mountain road trips.' },
      { id: 'bullet350', name: 'Royal Enfield Bullet 350', price: 1300, badge: 'BIKE', image: '/classic-rent.png', description: 'Legendary Bullet 350 with classic thump engine sound.' },
      { id: 'himalayan450', name: 'Royal Enfield Himalayan 450', price: 1600, badge: 'BIKE', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600', description: 'Next-gen liquid-cooled Sherpa 450 adventure bike for long Himalayan tours.' }
    ];
  }

  const dbVendorBikeCards = vehicleModelList.map(vehDef => {
    // Build available vendors list dynamically for this bike model from linked DB items
    const modelVendorMap = new Map();

    if (vehDef.dbItems && vehDef.dbItems.length > 0) {
      vehDef.dbItems.forEach(bItem => {
        const vId = String(bItem.vendor_id);
        const matchingVendor = displayBikeVendors.find(v => String(v.id) === vId);
        const details = getBikeCustomerDetails(bItem, matchingVendor);
        const vName = (matchingVendor?.company_name || matchingVendor?.name || bItem.vendor_name || bItem.operator_name || 'Bike Rental');
        const vLandmark = toShortLandmark(matchingVendor?.landmark || matchingVendor?.address || bItem.landmark || bItem.address, 'Janki Setu');

        if (!modelVendorMap.has(vId)) {
          modelVendorMap.set(vId, {
            id: vId,
            company_name: vName,
            name: vName,
            landmark: vLandmark,
            price: details.finalPrice,
            fixedAdvance: details.fixedAdvance,
            vendorRate: details.vendorRate,
            fullVendorObj: matchingVendor
          });
        }
      });
    }

    let availableVendorsForModel = Array.from(modelVendorMap.values());
    if (availableVendorsForModel.length === 0) {
      availableVendorsForModel = displayBikeVendors.map(v => ({
        id: v.id,
        company_name: v.company_name || v.name,
        name: v.company_name || v.name,
        landmark: toShortLandmark(v.landmark || v.address, 'Janki Setu'),
        price: vehDef.price || 700,
        fixedAdvance: 200,
        vendorRate: (vehDef.price || 700) - 200,
        fullVendorObj: v
      }));
    }

    const selectedVendorId = bikeVendorSelectionMap[vehDef.id] || (availableVendorsForModel[0]?.id || 'v-bike-default');
    const selectedVendorData = availableVendorsForModel.find(v => String(v.id) === String(selectedVendorId)) || availableVendorsForModel[0] || {};
    const selectedVendor = selectedVendorData.fullVendorObj || displayBikeVendors[0] || {};

    const vName = selectedVendorData.company_name || selectedVendor.company_name || selectedVendor.name || 'Hike N Ride';
    const landmark = selectedVendorData.landmark || toShortLandmark(selectedVendor.landmark || selectedVendor.vendor_address || selectedVendor.address, 'Janki Setu');

    const isOffline = selectedVendor.status === 'INACTIVE' || 
                      selectedVendor.status === 'OFF' || 
                      selectedVendor.is_active === false || 
                      selectedVendor.is_closed === true;

    const offlineReason = selectedVendor.offline_reason || selectedVendor.status_reason || (isOffline ? 'OFFLINE IN BACKEND' : 'AVAILABLE');

    const vendorImages = getRealVendorImages(selectedVendor, [], vehDef.image);
    const cardImages = [vehDef.image, ...vendorImages.filter(img => img !== vehDef.image)];

    return {
      cartKey: `scooty-veh-${vehDef.id}-v-${selectedVendor.id || 'default'}`,
      id: selectedVendor.id || vehDef.id,
      category: 'Scooty',
      categoryBadge: vehDef.badge,
      name: vehDef.name,
      vendorName: vName,
      price: selectedVendorData.price || vehDef.price || 700,
      vendorRate: selectedVendorData.vendorRate || (vehDef.price ? vehDef.price - 200 : 500),
      fixedAdvance: selectedVendorData.fixedAdvance || 200,
      landmarkLocation: landmark,
      fullAddress: selectedVendor.vendor_address || selectedVendor.address || `${landmark}, Rishikesh`,
      image: vehDef.image,
      images: cardImages,
      rating: getRealVendorRating(selectedVendor),
      description: vehDef.description,
      isOffline,
      offlineReason,
      isBikeModelCard: true,
      vehicleId: vehDef.id,
      selectedVendorId: selectedVendor.id,
      availableVendors: availableVendorsForModel
    };
  });

  // 4. Build Vendor Bungee, Zipline, Giant Swing, Camping & Adventure Cards from Real Database Items
  const dbAdventureItems = dbRafting.filter(r => {
    const act = (r.activity_type || '').toLowerCase();
    const nameLower = (r.name || '').toLowerCase();
    return (act && act !== 'rafting') ||
           ['bungee', 'zipline', 'swing', 'paragliding', 'camping'].includes(act) ||
           nameLower.includes('bungee') ||
           nameLower.includes('zipline') ||
           nameLower.includes('swing') ||
           nameLower.includes('paragliding') ||
           nameLower.includes('camping');
  });

  const dbVendorBungeeCards = dbAdventureItems.map(item => {
    const v = dbVendors.find(vend => String(vend.id) === String(item.vendor_id)) || {};
    const vName = v.company_name || v.name || item.vendor_name || item.operator_name || 'Rishikesh Adventure Crew';
    const landmark = toShortLandmark(item.landmark || v.landmark || v.vendor_address || v.address, 'Shivpuri');

    const actType = (item.activity_type || '').toLowerCase();
    const nameLower = (item.name || '').toLowerCase();
    let badge = 'BUNGEE & OTHER';
    let activityDefaultImg = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600';

    if (actType.includes('bungee') || nameLower.includes('bungee')) {
      badge = 'BUNGEE';
      activityDefaultImg = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600';
    } else if (actType.includes('zipline') || nameLower.includes('zip')) {
      badge = 'ZIPLINE';
      activityDefaultImg = '/zipline-hero.jpg';
    } else if (actType.includes('swing') || nameLower.includes('swing')) {
      badge = 'GIANT SWING';
      activityDefaultImg = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600';
    } else if (actType.includes('paragliding') || nameLower.includes('para')) {
      badge = 'PARAGLIDING';
      activityDefaultImg = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600';
    } else if (actType.includes('camping') || nameLower.includes('camp')) {
      badge = 'CAMPING';
      activityDefaultImg = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600';
    }

    // Extract REAL uploaded package photo FIRST
    const packageImages = [];
    const addImg = (val) => {
      if (!val) return;
      if (Array.isArray(val)) { val.forEach(i => addImg(i)); return; }
      if (typeof val === 'string') {
        let trimmed = val.trim();
        if (!trimmed) return;
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try { addImg(JSON.parse(trimmed)); return; } catch (e) {}
        }
        if (trimmed.includes('|||')) {
          trimmed.split('|||').forEach(p => addImg(p));
          return;
        }
        const parsed = parseImageUrl(trimmed);
        if (parsed && !packageImages.includes(parsed)) packageImages.push(parsed);
      }
    };

    // 1. Original package uploaded images FIRST
    addImg(item.images);
    addImg(item.image);
    addImg(item.photo);
    addImg(item.shop_image);

    // 2. Vendor shop images SECOND
    if (v) {
      addImg(v.shop_images);
      addImg(v.shop_image);
      addImg(v.photos);
      addImg(v.images);
    }

    // 3. Fallback only if no uploaded photos exist anywhere
    if (packageImages.length === 0 && activityDefaultImg) {
      packageImages.push(activityDefaultImg);
    }

    const primaryImg = packageImages[0] || activityDefaultImg;

    const displayPrice = Number(item.price || 0);
    const advanceVal = Number(item.fixed_advance_amount || item.advance_amount || Math.round(displayPrice * 0.1) || 300);
    const vendorRateVal = Number(item.vendor_rate || item.net_price || Math.max(0, displayPrice - advanceVal));

    const isOffline = item.is_active === false || item.is_closed === true || v.status === 'INACTIVE' || v.is_active === false;
    const offlineReason = item.offline_reason || v.offline_reason || (isOffline ? 'OFFLINE IN BACKEND' : 'AVAILABLE');

    return {
      cartKey: `v-bungee-extra-${item.id}`,
      id: item.id,
      category: 'Bungee & Other',
      categoryBadge: badge,
      name: item.name,
      vendorName: vName,
      price: displayPrice,
      vendorRate: vendorRateVal,
      fixedAdvance: advanceVal,
      landmarkLocation: landmark,
      fullAddress: v.vendor_address || v.address || `${landmark}, Rishikesh`,
      image: primaryImg,
      images: packageImages,
      rating: getRealVendorRating(v),
      description: item.description || `${vName} offers safety-certified ${badge.toLowerCase()} adventure experience in Rishikesh.`,
      isOffline,
      offlineReason
    };
  });

  const allDisplayItems = [
    ...hotelsCardList,
    ...dbVendorRaftingCards,
    ...dbVendorBikeCards,
    ...dbVendorBungeeCards
  ];

  const filteredDisplayItems = activeCategory === 'all' 
    ? allDisplayItems 
    : allDisplayItems.filter(i => {
        if (activeCategory === 'bungee' || activeCategory === 'camping' || activeCategory === 'bungee_other') {
          const catLower = (i.category || '').toLowerCase();
          const badgeLower = (i.categoryBadge || '').toLowerCase();
          return catLower.includes('bungee') || 
                 catLower.includes('other') || 
                 catLower.includes('camping') || 
                 badgeLower.includes('bungee') || 
                 badgeLower.includes('zipline') || 
                 badgeLower.includes('swing') || 
                 badgeLower.includes('paragliding') || 
                 badgeLower.includes('camping');
        }
        return i.category.toLowerCase() === activeCategory.toLowerCase();
      });

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 overflow-y-auto font-sans animate-fadeIn">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-0.5 rounded-full bg-[#FF5F00] text-white text-[10px] font-black uppercase tracking-wider">
            TRIPGOD STORE
          </div>
          <span className="text-xs text-slate-600 font-bold hidden sm:inline">
            Build Your Custom Rishikesh Combo
          </span>
        </div>

        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 pb-36">
        
        {/* CLEAN WHITE TOP HERO BANNER (Zero Black) */}
        <div className="bg-[#FFF8F5] text-slate-900 rounded-2xl p-4 sm:p-5 mb-5 border border-[#FF5F00]/25 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF5F00]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#FF5F00]" />
              BUY MORE, SAVE MORE
            </div>
            <h1 className="text-lg sm:text-2xl font-black font-display tracking-tight leading-tight text-slate-900">
              Add 2+ Services to Cart & <span className="text-[#FF5F00]">Unlock Up To 20% OFF</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium line-clamp-1">
              Select Hotels, Rafting, Scooty & Bungee below • Auto-unlock 5%, 10%, 15% OFF • Instant WhatsApp Location Vouchers!
            </p>
          </div>

          {/* Compact Unlock Progress Tracker (Clean Text, No Broken Emojis) */}
          <div className="mt-3 pt-3 border-t border-[#FF5F00]/15 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-900 flex items-center gap-1 text-[11px]">
                <Percent className="w-3.5 h-3.5 text-[#FF5F00]" />
                Cart Tier: <strong className="text-[#FF5F00]">{discountPercent}% OFF APPLIED</strong>
              </span>

              <span className="text-[10px] font-extrabold text-[#FF5F00] bg-[#FF5F00]/10 border border-[#FF5F00]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FF5F00]" />
                {cartCount === 0 && "Add 2 items to unlock 5% OFF!"}
                {cartCount === 1 && "Add 1 more item for 5% OFF!"}
                {cartCount === 2 && "Add 1 more item for 10% OFF!"}
                {cartCount === 3 && "Add 1 more item for 15% OFF!"}
                {cartCount >= 4 && "MAX DISCOUNT TIER UNLOCKED!"}
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF5F00] via-amber-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (cartCount / 4) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-4 text-center text-[9px] font-bold text-slate-500 pt-0.5">
              <span className={cartCount >= 1 ? "text-slate-900 font-black" : ""}>1 (0%)</span>
              <span className={cartCount >= 2 ? "text-[#FF5F00] font-black" : ""}>2 ({discountRules.tier2}% OFF)</span>
              <span className={cartCount >= 3 ? "text-[#FF5F00] font-black" : ""}>3 ({discountRules.tier3}% OFF)</span>
              <span className={cartCount >= 4 ? "text-emerald-600 font-black" : ""}>4+ ({discountRules.tier4}% OFF)</span>
            </div>
          </div>
        </div>

        {/* Premium Quick Filter Pills (No Emojis) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar mb-4">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'hotel', label: 'Hotels & Stays' },
            { id: 'rafting', label: 'River Rafting' },
            { id: 'scooty', label: 'Scooty Rentals' },
            { id: 'bungee', label: 'Bungee & Other' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer border ${
                activeCategory === tab.id 
                  ? 'bg-[#FF5F00] text-white border-[#FF5F00] shadow-md shadow-orange-500/20' 
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-xs'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty State Banner if no vendors for selected category */}
        {filteredDisplayItems.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-xs">
            <AlertCircle className="w-8 h-8 text-[#FF5F00] mx-auto opacity-80" />
            <h3 className="text-base font-extrabold text-slate-900">No Listings Available Yet</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              New vendors for {activeCategory === 'bungee' || activeCategory === 'camping' ? 'Bungee & Other' : activeCategory} will appear here dynamically as soon as they onboard.
            </p>
          </div>
        ) : (
          /* 2-COLUMN CARDS GRID (Vendor First Layout: Card Title = Vendor Shop Name) */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {filteredDisplayItems.map(item => {
              const inCart = isItemInCart(item.cartKey);

            return (
              <div 
                key={item.cartKey}
                className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-[0_2px_15px_rgba(0,0,0,0.03)] ${
                  inCart 
                    ? 'border-[#FF5F00] ring-2 ring-[#FF5F00]/20 scale-[1.01]' 
                    : item.isOffline
                    ? 'border-slate-200 opacity-75 grayscale-30'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Card Top Details (Click Opens Detail Drawer) */}
                <div 
                  onClick={() => setActiveDetailItem(item)}
                  className="cursor-pointer flex-1"
                >
                  {/* Card Image: Vendor Shop Image Carousel with Badges */}
                  <div className="relative h-32 sm:h-40 w-full bg-slate-900 overflow-hidden group">
                    <VendorImageCarousel
                      images={item.images && item.images.length > 0 ? item.images : [item.image]}
                      alt={item.vendorName || item.name}
                      className="w-full h-full relative overflow-hidden bg-slate-900 group"
                      imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      showBadgeCount={true}
                      showControls={true}
                      showDots={false}
                    >
                      <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900/90 text-white backdrop-blur-xs z-10 pointer-events-none">
                        {item.categoryBadge || item.category}
                      </span>

                      {/* Offline Badge vs Real Rating Badge */}
                      {item.isOffline ? (
                        <span className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs z-10 pointer-events-none uppercase tracking-wider">
                          🔴 {item.offlineReason || 'PAUSED IN BACKEND'}
                        </span>
                      ) : (
                        <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-extrabold text-slate-900 flex items-center gap-0.5 shadow-xs z-10 pointer-events-none">
                          ⭐ {item.rating}
                        </span>
                      )}
                    </VendorImageCarousel>
                  </div>

                  {/* Card Text Content: Activity / Package Name FIRST as Main Title */}
                  <div className="p-2.5 sm:p-3 space-y-1">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-[#FF5F00] transition line-clamp-1 leading-tight" title={item.name || item.vendorName}>
                      {item.name || item.vendorName}
                    </h3>
                    
                    {item.vendorName && item.vendorName !== item.name && (
                      <div className="text-[10px] text-slate-500 font-bold line-clamp-1">
                        by <span className="text-slate-700 font-extrabold">{item.vendorName}</span>
                      </div>
                    )}
                    
                    {/* Clean Short Landmark Address */}
                    <div className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <span>{item.landmarkLocation}</span>
                    </div>

                    {/* Rafting Stretch Card Crew Selector Dropdown */}
                    {item.isRaftingStretchCard && item.availableVendors && item.availableVendors.length > 0 && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1 space-y-0.5"
                      >
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Select Crew & Location:
                        </span>
                        <select
                          value={item.selectedVendorId}
                          onChange={(e) => {
                            const newVendorId = e.target.value;
                            setRaftingVendorSelectionMap(prev => ({ ...prev, [item.stretchId]: newVendorId }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-900 outline-none cursor-pointer"
                        >
                          {item.availableVendors.map(v => {
                            const vL = toShortLandmark(v.landmark || v.vendor_address || v.address, 'Janki Setu');
                            const vN = v.company_name || v.name;
                            return (
                              <option key={v.id} value={v.id}>
                                {vL} — {vN}{v.is_closed ? ' (CLOSED)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    {/* Bike Model Card Pickup Location Selector Dropdown */}
                    {item.isBikeModelCard && item.availableVendors && item.availableVendors.length > 0 && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1 space-y-0.5"
                      >
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Select Pickup Location:
                        </span>
                        <select
                          value={item.selectedVendorId}
                          onChange={(e) => {
                            const newVendorId = e.target.value;
                            setBikeVendorSelectionMap(prev => ({ ...prev, [item.vehicleId]: newVendorId }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-900 outline-none cursor-pointer"
                        >
                          {item.availableVendors.map(v => {
                            const vL = toShortLandmark(v.landmark || v.vendor_address || v.address, 'Janki Setu');
                            const vN = v.company_name || v.name;
                            return (
                              <option key={v.id} value={v.id}>
                                {vL} — {vN}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    <div className="pt-1 flex items-baseline gap-1">
                      <span className="text-[10px] text-slate-400 font-medium">Rate:</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 font-display">₹{item.price}</span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {item.category === 'Hotel' ? '/night' : item.category === 'Scooty' ? '/day' : '/person'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ADD TO COMBO CART Button (Disabled if Offline in Backend) */}
                <div className="p-2 sm:p-2.5 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    disabled={item.isOffline}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.isOffline) return;
                      toggleCartItem(item);
                    }}
                    className={`w-full py-2 sm:py-2.5 rounded-xl font-extrabold text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                      item.isOffline
                        ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                        : inCart 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                        : 'bg-[#FF5F00] hover:bg-[#FF3E00] text-white shadow-md shadow-orange-500/20'
                    }`}
                  >
                    {item.isOffline ? (
                      <span className="truncate">🚫 {item.offlineReason || 'UNAVAILABLE'}</span>
                    ) : inCart ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> <span className="truncate">ADDED</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[3]" /> <span className="truncate">ADD TO CART</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}

      </div>

      {/* SERVICE DETAILS DRAWER / MODAL */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl relative">
            
            {/* Header & Back Button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button 
                onClick={() => setActiveDetailItem(null)}
                className="flex items-center gap-1 text-xs font-bold text-[#FF5F00] hover:underline cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Store
              </button>

              <button 
                onClick={() => setActiveDetailItem(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo & Category Badge Carousel */}
            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-slate-900">
              <VendorImageCarousel
                images={activeDetailItem.images && activeDetailItem.images.length > 0 ? activeDetailItem.images : [activeDetailItem.image]}
                alt={activeDetailItem.vendorName || activeDetailItem.name}
                className="w-full h-full relative overflow-hidden bg-slate-900 group"
                imageClassName="w-full h-full object-cover"
                showBadgeCount={true}
                showControls={true}
                showDots={true}
              >
                <span className="absolute top-3 left-3 text-xs font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-lg z-10 pointer-events-none">
                  {activeDetailItem.categoryBadge || activeDetailItem.category}
                </span>

                {activeDetailItem.isOffline && (
                  <span className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-lg z-10 pointer-events-none uppercase tracking-wider">
                    🔴 {activeDetailItem.offlineReason || 'PAUSED IN BACKEND'}
                  </span>
                )}
              </VendorImageCarousel>
            </div>

            {/* Title & Short Landmark Address */}
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">
                {activeDetailItem.name || activeDetailItem.vendorName}
              </h3>
              {activeDetailItem.vendorName && activeDetailItem.vendorName !== activeDetailItem.name && (
                <p className="text-xs text-[#FF5F00] font-bold mt-0.5">
                  by {activeDetailItem.vendorName}
                </p>
              )}
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF5F00]" />
                {activeDetailItem.fullAddress}
              </p>
            </div>

            {/* Description & Overview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-[#FF5F00]">Service & Operator Overview</h4>
              <p className="text-slate-600 leading-relaxed font-medium">
                {activeDetailItem.description}
              </p>
            </div>

            {/* Price & Add to Cart Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Selected Rate</span>
                <span className="text-xl font-black text-slate-900 font-display">₹{activeDetailItem.price}</span>
              </div>

              <button
                type="button"
                disabled={activeDetailItem.isOffline}
                onClick={() => {
                  if (!activeDetailItem.isOffline) {
                    toggleCartItem(activeDetailItem);
                    setActiveDetailItem(null);
                  }
                }}
                className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  activeDetailItem.isOffline
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : isItemInCart(activeDetailItem.cartKey)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FF5F00] text-white shadow-md shadow-orange-500/20'
                }`}
              >
                {activeDetailItem.isOffline ? `🚫 ${activeDetailItem.offlineReason || 'UNAVAILABLE'}` : isItemInCart(activeDetailItem.cartKey) ? '✓ In Cart' : '+ Add to Cart'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-3.5 sm:p-5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Cart Pricing Summary */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 rounded-xl bg-[#FF5F00]/10 border border-[#FF5F00]/20 text-[#FF5F00] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700">🛒 {cartCount} Services</span>
                  {discountPercent > 0 && (
                    <span className="text-[10px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-md">
                      🔥 {discountPercent}% OFF APPLIED
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 line-through font-medium">
                    ₹{(rawSubtotalPerPerson * persons).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                    Saved ₹{totalSaved.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls & Checkout Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-2 rounded-xl border border-slate-200">
                <Users className="w-3.5 h-3.5 text-[#FF5F00]" />
                <select 
                  value={persons} 
                  onChange={(e) => setPersons(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                    <option key={n} value={n}>{n} Pax</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppBooking}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition cursor-pointer"
                title="Inquire on WhatsApp"
              >
                💬
              </button>

              <button
                type="button"
                onClick={handleProceedBooking}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] hover:scale-105 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#FF5F00]/20 transition flex items-center justify-center gap-1.5 border-none cursor-pointer"
              >
                <span>PROCEED TO BOOK</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
