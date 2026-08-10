import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, Calendar, Users, 
  Percent, Plus, Check, X, Star, MapPin, ChevronLeft, Building2, Waves, Bike, Tent, AlertCircle
} from 'lucide-react';
import { supabase } from '../supabase';
import VendorImageCarousel from '../components/VendorImageCarousel';

// Helper to convert raw address text into clean short landmark badges like "📍 Tapovan", "📍 Janki Setu", "📍 Triveni Ghat"
const toShortLandmark = (fullAddress, fallback = 'Tapovan') => {
  if (!fullAddress) return `📍 ${fallback}`;
  const lower = fullAddress.toLowerCase();

  if (lower.includes('janki setu')) return '📍 Janki Setu';
  if (lower.includes('tapovan')) return '📍 Tapovan';
  if (lower.includes('ramjhula') || lower.includes('ram jhula')) return '📍 Ram Jhula';
  if (lower.includes('laxman') || lower.includes('lakshman')) return '📍 Laxman Jhula';
  if (lower.includes('triveni')) return '📍 Triveni Ghat';
  if (lower.includes('swarg') || lower.includes('geeta')) return '📍 Swarg Ashram';
  if (lower.includes('shivpuri')) return '📍 Shivpuri';
  if (lower.includes('brahmpuri')) return '📍 Brahmpuri';
  if (lower.includes('gangakshetra')) return '📍 Gangakshetra';

  const clean = fullAddress.replace(/\d+/g, '').replace(/pincode|uttarakhand|india/gi, '').split(',')[0].trim();
  return `📍 ${clean || fallback}`;
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

  // Vendor Selections Map (vendorId -> selectedStretchId / selectedVehicleId)
  const [raftingStretchMap, setRaftingStretchMap] = useState({});
  const [bikeVehicleMap, setBikeVehicleMap] = useState({});

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
  const discountAmountPerPerson = Math.round((rawSubtotalPerPerson * discountPercent) / 100);
  const finalPricePerPerson = rawSubtotalPerPerson - discountAmountPerPerson;

  const grandTotal = finalPricePerPerson * persons;
  const totalSaved = discountAmountPerPerson * persons;
  const handleProceedBooking = () => {
    if (cartItems.length === 0) return;

    // 1. Raw Sum of required backend fixed advances (e.g. ₹199 + ₹200 = ₹399)
    const rawTotalAdvancePerPerson = cartItems.reduce((sum, item) => {
      const itemAdv = item.fixedAdvance !== undefined && item.fixedAdvance !== null && Number(item.fixedAdvance) >= 0
        ? Number(item.fixedAdvance)
        : Math.round(Number(item.price || 0) * 0.1);
      return sum + itemAdv;
    }, 0);

    // 2. Combo Discount amount (e.g. 5% of raw subtotal ₹1699 = ₹85)
    const discountAmountPerPerson = Math.round((rawSubtotalPerPerson * discountPercent) / 100);

    // 3. Hotel GST (12% of hotel price = ₹120)
    const hotelGstPerPerson = cartItems.reduce((sum, item) => {
      if (item.category === 'Hotel' || item.category === 'hotel') {
        const gst = item.gstAmount !== undefined ? item.gstAmount : Math.round(Number(item.price || 0) * 0.12);
        return sum + gst;
      }
      return sum;
    }, 0);

    // 4. Exact User Formula: Online Advance = (Sum of Advances ₹399) - (Discount Amount ₹85) + (Hotel GST ₹120) = ₹434
    const finalAdvancePerPerson = Math.max(1, rawTotalAdvancePerPerson - discountAmountPerPerson + hotelGstPerPerson);
    const totalAdvance = finalAdvancePerPerson * persons;

    // 5. Total Vendor Base Payout at Venue (e.g. Hotel ₹800 + Scooty ₹500 = ₹1,300)
    const totalVendorPayoutPerPerson = cartItems.reduce((sum, item) => {
      const vRate = item.vendorRate !== undefined && item.vendorRate !== null 
        ? Number(item.vendorRate) 
        : Math.max(0, Number(item.price || 0) - Number(item.fixedAdvance || 0));
      return sum + vRate;
    }, 0);
    const totalVendorPayout = totalVendorPayoutPerPerson * persons;

    // 6. Grand Total Price (incl. GST & Combo Discount)
    const finalPriceWithGstPerPerson = rawSubtotalPerPerson - discountAmountPerPerson + hotelGstPerPerson;
    const grandTotalWithGst = finalPriceWithGstPerPerson * persons;
    const totalHotelGst = hotelGstPerPerson * persons;

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
      rawTotal: rawSubtotalPerPerson * persons,
      totalSaved,
      totalHotelGst,
      rawTotalAdvancePerPerson: rawTotalAdvancePerPerson * persons,
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
    
    const roomPrice = Number(h.price || 0);
    let comm = 0;
    if (h.commission_value !== null && h.commission_value !== undefined && h.commission_value !== '') {
      comm = h.commission_type === 'percentage' 
        ? Math.round((roomPrice * Number(h.commission_value)) / 100)
        : Number(h.commission_value);
    } else if (h.commission_amount !== null && h.commission_amount !== undefined && h.commission_amount !== '') {
      comm = Number(h.commission_amount);
    } else if (h.commission_percentage) {
      comm = Math.round((roomPrice * Number(h.commission_percentage)) / 100);
    } else {
      comm = 199;
    }

    let fixAdv = 0;
    if (h.fixed_advance_amount !== null && h.fixed_advance_amount !== undefined && h.fixed_advance_amount !== '') {
      fixAdv = Number(h.fixed_advance_amount);
    } else {
      fixAdv = comm > 0 ? comm : 199;
    }

    const displayPrice = h.final_price ? Number(h.final_price) : (roomPrice + comm > roomPrice ? roomPrice + comm : roomPrice);
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
      vendorRate: roomPrice,
      roomPrice: roomPrice,
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

  // 2. Build Vendor Rafting Cards from Real Database Vendors & Rafting Items
  const raftingVendorsMap = new Map();

  effectiveVendors.forEach(v => {
    const cat = (v.service_category || v.category || '').toLowerCase();
    if (cat.includes('rafting') || cat.includes('multi-service') || cat.includes('all services') || cat.includes('adventure') || !cat) {
      raftingVendorsMap.set(String(v.id), v);
    }
  });

  dbRafting.forEach(rItem => {
    if (rItem.vendor_id && !raftingVendorsMap.has(String(rItem.vendor_id))) {
      const foundV = dbVendors.find(v => String(v.id) === String(rItem.vendor_id));
      if (foundV) {
        raftingVendorsMap.set(String(foundV.id), foundV);
      } else {
        const vName = rItem.vendor_name || rItem.operator_name || `Rafting Crew ${rItem.vendor_id}`;
        raftingVendorsMap.set(String(rItem.vendor_id), {
          id: rItem.vendor_id,
          name: vName,
          company_name: vName,
          landmark: rItem.landmark || rItem.address || 'Tapovan',
          star_rating: rItem.rating || 4.5,
          status: rItem.is_active === false ? 'INACTIVE' : (rItem.status || 'ACTIVE'),
          shop_image: rItem.images ? parseImageUrl(rItem.images) : null
        });
      }
    }
  });

  const dbVendorRaftingCards = Array.from(raftingVendorsMap.values()).map(v => {
    const vName = v.company_name || v.name || 'Rishikesh Rafting Crew';
    const landmark = toShortLandmark(v.landmark || v.vendor_address || v.address, 'Tapovan');

    const vendorRaftingItems = dbRafting.filter(r => 
      String(r.vendor_id) === String(v.id) || 
      (r.vendor_name && r.vendor_name.toLowerCase() === vName.toLowerCase()) ||
      (r.operator_name && r.operator_name.toLowerCase() === vName.toLowerCase())
    );

    const isVendorInactive = v.status === 'INACTIVE' || 
                             v.status === 'Inactive' || 
                             v.status === 'OFF' || 
                             v.status === 'Disabled' || 
                             v.status === 'MONSOON_OFF' || 
                             v.is_active === false || 
                             v.is_closed === true;

    // Check if there are rafting packages in DB, and whether ANY of them is active
    const hasActiveRaftingItems = vendorRaftingItems.length === 0 || vendorRaftingItems.some(r => 
      r.is_active !== false && 
      r.is_closed !== true && 
      r.coming_soon !== true && 
      (!r.status || r.status.toLowerCase() === 'active')
    );

    const isOffline = isVendorInactive || !hasActiveRaftingItems;

    let offlineReason = 'UNAVAILABLE';
    if (v.offline_reason || v.status_reason) {
      offlineReason = v.offline_reason || v.status_reason;
    } else if (v.status === 'MONSOON_OFF' || (v.status && v.status.toLowerCase().includes('monsoon'))) {
      offlineReason = 'MONSOON PAUSE';
    } else if (isOffline) {
      offlineReason = 'MONSOON / BACKEND PAUSE';
    }

    const vendorImages = getRealVendorImages(
      v, 
      vendorRaftingItems, 
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600'
    );
    const primaryImg = vendorImages[0] || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600';
    const rating = getRealVendorRating(v);

    const selectedStretchId = raftingStretchMap[v.id] || '16km';
    const stretchObj = DEFAULT_RAFTING_STRETCHES.find(s => s.id === selectedStretchId) || DEFAULT_RAFTING_STRETCHES[1];

    return {
      cartKey: `v-rafting-${v.id}-${stretchObj.id}`,
      id: v.id,
      category: 'Rafting',
      name: stretchObj.name,
      vendorName: vName,
      price: stretchObj.price,
      landmarkLocation: landmark,
      fullAddress: v.vendor_address || v.address || `${landmark}, Rishikesh`,
      image: primaryImg,
      images: vendorImages,
      rating,
      description: `${vName} offers certified river rafting guides, safety life jackets, helmet & cliff jumping in Rishikesh.`,
      isOffline,
      offlineReason,
      isRaftingVendor: true,
      stretches: DEFAULT_RAFTING_STRETCHES,
      currentStretchId: stretchObj.id
    };
  });

  // 3. Build Vendor Scooty / Bike Rental Cards from Real Database Vendors & Bike Items
  const bikeVendorsMap = new Map();

  effectiveVendors.forEach(v => {
    const cat = (v.service_category || v.category || '').toLowerCase();
    if (cat.includes('bike') || cat.includes('scooty') || cat.includes('multi-service') || cat.includes('all services') || !cat) {
      bikeVendorsMap.set(String(v.id), v);
    }
  });

  dbBikes.forEach(bItem => {
    if (bItem.vendor_id && !bikeVendorsMap.has(String(bItem.vendor_id))) {
      const foundV = dbVendors.find(v => String(v.id) === String(bItem.vendor_id));
      if (foundV) {
        bikeVendorsMap.set(String(foundV.id), foundV);
      } else {
        const vName = bItem.vendor_name || bItem.operator_name || `Bike Rental ${bItem.vendor_id}`;
        bikeVendorsMap.set(String(bItem.vendor_id), {
          id: bItem.vendor_id,
          name: vName,
          company_name: vName,
          landmark: bItem.landmark || bItem.address || 'Janki Setu',
          star_rating: bItem.rating || 4.5,
          status: bItem.is_active === false ? 'INACTIVE' : (bItem.status || 'ACTIVE'),
          shop_image: bItem.images ? parseImageUrl(bItem.images) : null
        });
      }
    }
  });
  const getBikeCustomerDetails = (b, v) => {
    if (!b) return { finalPrice: 700, fixedAdvance: 200, vendorRate: 500 };
    const p = Number(b.price || 0);
    const net = Number(b.net_price || 0);
    
    // Fixed advance explicit check
    let fixAdv = 0;
    if (b.fixed_advance_amount !== null && b.fixed_advance_amount !== undefined && b.fixed_advance_amount !== '') {
      fixAdv = Number(b.fixed_advance_amount);
    } else if (v && (v.fixed_advance_amount !== null && v.fixed_advance_amount !== undefined && v.fixed_advance_amount !== '')) {
      fixAdv = Number(v.fixed_advance_amount);
    }

    // Profit / Commission amount check
    let comm = 0;
    if (b.commission_amount !== null && b.commission_amount !== undefined && b.commission_amount !== '') {
      comm = Number(b.commission_amount);
    } else if (b.commission_percentage && net > 0) {
      comm = Math.round((net * Number(b.commission_percentage)) / 100);
    } else if (v && (v.commission_amount !== null && v.commission_amount !== undefined && v.commission_amount !== '')) {
      comm = Number(v.commission_amount);
    } else {
      comm = 200; // standard default profit per scooty
    }

    const calculatedTotal = net > 0 ? (net + comm) : (p > 0 && p !== net ? p : p + comm);
    const finalPrice = Math.max(p, calculatedTotal, 700);
    const advanceVal = fixAdv > 0 ? fixAdv : (comm > 0 ? comm : Math.round(finalPrice * 0.1));
    const vRate = net > 0 ? net : Math.max(0, finalPrice - comm);

    return { finalPrice, fixedAdvance: advanceVal, vendorRate: vRate };
  };

  const dbVendorBikeCards = Array.from(bikeVendorsMap.values()).map(v => {
    const vName = v.company_name || v.name || 'Rishikesh Bike Rental';
    const landmark = toShortLandmark(v.landmark || v.vendor_address || v.address, 'Janki Setu');

    const vendorBikeItems = dbBikes.filter(b => 
      String(b.vendor_id) === String(v.id) || 
      (b.vendor_name && b.vendor_name.toLowerCase() === vName.toLowerCase()) ||
      (b.operator_name && b.operator_name.toLowerCase() === vName.toLowerCase())
    );

    // Build real vehicles list for this vendor from DB (calculating vendor rate + profit commission)
    let vendorVehicles = vendorBikeItems.map(b => {
      const details = getBikeCustomerDetails(b, v);
      return {
        id: String(b.id),
        name: b.name,
        price: details.finalPrice,
        fixedAdvance: details.fixedAdvance,
        vendorRate: details.vendorRate,
        is_active: b.is_active !== false && b.is_closed !== true && b.status !== 'INACTIVE'
      };
    });

    if (vendorVehicles.length === 0) {
      const comm = v.commission_amount !== null && v.commission_amount !== undefined 
        ? Number(v.commission_amount) 
        : 200;
      const fixAdv = v.fixed_advance_amount !== null && v.fixed_advance_amount !== undefined && v.fixed_advance_amount !== ''
        ? Number(v.fixed_advance_amount)
        : comm;
      const activaPrice = 500 + comm; // e.g. 500 vendor rate + 200 profit = 700

      vendorVehicles = [
        { id: 'activa6g', name: 'Honda Activa 6G', price: activaPrice, fixedAdvance: fixAdv, vendorRate: 500, is_active: true },
        { id: 'jupiter125', name: 'TVS Jupiter 125', price: activaPrice + 50, fixedAdvance: fixAdv, vendorRate: 550, is_active: true },
        { id: 'burgman125', name: 'Suzuki Burgman 125', price: activaPrice + 150, fixedAdvance: fixAdv, vendorRate: 650, is_active: true },
        { id: 'classic350', name: 'Royal Enfield Classic 350', price: 1200, fixedAdvance: 300, vendorRate: 900, is_active: true },
        { id: 'himalayan', name: 'Royal Enfield Himalayan 450', price: 1600, fixedAdvance: 400, vendorRate: 1200, is_active: true }
      ];
    }

    const isVendorInactive = v.status === 'INACTIVE' || 
                             v.status === 'Inactive' || 
                             v.status === 'OFF' || 
                             v.status === 'Disabled' || 
                             v.is_active === false || 
                             v.is_closed === true;

    const hasActiveBikeItems = vendorBikeItems.length === 0 || vendorBikeItems.some(b => 
      b.is_active !== false && 
      b.is_closed !== true && 
      b.coming_soon !== true && 
      (!b.status || b.status.toLowerCase() === 'active')
    );

    const isOffline = isVendorInactive || !hasActiveBikeItems;
    const offlineReason = v.offline_reason || v.status_reason || (isOffline ? 'OFFLINE IN BACKEND' : 'AVAILABLE');

    const vendorImages = getRealVendorImages(
      v, 
      vendorBikeItems, 
      '/classic-rent.png'
    );
    const primaryImg = vendorImages[0] || '/classic-rent.png';
    const rating = getRealVendorRating(v);

    const selectedVehId = bikeVehicleMap[v.id] || vendorVehicles[0].id;
    const vehicleObj = vendorVehicles.find(veh => String(veh.id) === String(selectedVehId)) || vendorVehicles[0];

    const fullAddr = v.vendor_address || v.address || `${landmark}, Rishikesh`;

    return {
      cartKey: `v-bike-${v.id}-${vehicleObj.id}`,
      id: v.id,
      category: 'Scooty',
      name: vehicleObj.name,
      vendorName: vName,
      price: vehicleObj.price,
      vendorRate: vehicleObj.vendorRate || (vehicleObj.price - (vehicleObj.fixedAdvance || 200)),
      fixedAdvance: vehicleObj.fixedAdvance || 200,
      landmarkLocation: landmark,
      fullAddress: fullAddr,
      mapLink: `https://maps.google.com/?q=${encodeURIComponent(fullAddr)}`,
      image: primaryImg,
      images: vendorImages,
      rating,
      description: `${vName} provides clean, well-serviced scooters & motorbikes with helmet and quick document verification.`,
      isOffline,
      offlineReason,
      isBikeVendor: true,
      vehicles: vendorVehicles,
      currentVehicleId: vehicleObj.id
    };
  });
      category: 'Scooty',
      name: vehicleObj.name,
      vendorName: vName,
      price: vehicleObj.price,
      fixedAdvance: vehicleObj.fixedAdvance || 200,
      landmarkLocation: landmark,
      fullAddress: v.vendor_address || v.address || `${landmark}, Rishikesh`,
      image: primaryImg,
      images: vendorImages,
      rating,
      description: `${vName} provides clean, well-serviced scooters & motorbikes with helmet and quick document verification.`,
      isOffline,
      offlineReason,
      isBikeVendor: true,
      vehicles: vendorVehicles,
      currentVehicleId: vehicleObj.id
    };
  });

  // 4. Build Vendor Camping Cards from Real Database Vendors
  const campingVendorsMap = new Map();

  effectiveVendors.forEach(v => {
    const cat = (v.service_category || v.category || '').toLowerCase();
    if (cat.includes('camping')) {
      campingVendorsMap.set(String(v.id), v);
    }
  });

  const dbVendorCampingCards = Array.from(campingVendorsMap.values()).map(v => {
    const isOffline = v.status === 'INACTIVE' || 
                      v.status === 'Inactive' || 
                      v.status === 'OFF' || 
                      v.status === 'Disabled' || 
                      v.is_active === false || 
                      v.is_closed === true;
    const offlineReason = v.offline_reason || v.status_reason || (isOffline ? 'OFFLINE IN BACKEND' : 'AVAILABLE');
    const vName = v.company_name || v.name || 'Shivpuri Campsite';
    const landmark = toShortLandmark(v.landmark || v.vendor_address || v.address, 'Shivpuri');

    const vendorImages = getRealVendorImages(
      v, 
      [], 
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600'
    );
    const primaryImg = vendorImages[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600';
    const rating = getRealVendorRating(v);

    return {
      cartKey: `v-camping-${v.id}`,
      id: v.id,
      category: 'Camping',
      name: 'Riverside Camping Stay',
      vendorName: vName,
      price: v.price ? Number(v.price) : 999,
      landmarkLocation: landmark,
      fullAddress: v.vendor_address || v.address || `${landmark}, Rishikesh`,
      image: primaryImg,
      images: vendorImages,
      rating,
      description: `${vName} offers riverside Swiss tent stays with bonfire, evening snacks, live music & buffet dinner.`,
      isOffline,
      offlineReason
    };
  });

  const allDisplayItems = [
    ...hotelsCardList,
    ...dbVendorRaftingCards,
    ...dbVendorBikeCards,
    ...dbVendorCampingCards
  ];

  const filteredDisplayItems = activeCategory === 'all' 
    ? allDisplayItems 
    : allDisplayItems.filter(i => i.category.toLowerCase() === activeCategory.toLowerCase());

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
              Select Hotels, Rafting & Scooty below • Auto-unlock 5%, 10%, 15% OFF • Instant WhatsApp Location Vouchers!
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
            { id: 'camping', label: 'Camping & Extras' }
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
              New vendors for {activeCategory === 'camping' ? 'Camping & Extras' : activeCategory} will appear here dynamically as soon as they onboard.
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
                        {item.category}
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

                  {/* Card Text Content: Vendor Shop Name First! */}
                  <div className="p-2.5 sm:p-3 space-y-1">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-[#FF5F00] transition line-clamp-1 leading-tight">
                      {item.vendorName || item.name}
                    </h3>
                    
                    {/* Clean Short Landmark Address */}
                    <div className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <span>{item.landmarkLocation}</span>
                    </div>

                    {/* Rafting Vendor Stretch Selector Dropdown */}
                    {item.isRaftingVendor && item.stretches && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1"
                      >
                        <select
                          value={item.currentStretchId}
                          onChange={(e) => {
                            const newStretchId = e.target.value;
                            setRaftingStretchMap(prev => ({ ...prev, [item.id]: newStretchId }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-900 outline-none cursor-pointer"
                        >
                          {item.stretches.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} — ₹{s.price}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Bike Vendor Vehicle Model Selector Dropdown */}
                    {item.isBikeVendor && item.vehicles && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1"
                      >
                        <select
                          value={item.currentVehicleId}
                          onChange={(e) => {
                            const newVehId = e.target.value;
                            setBikeVehicleMap(prev => ({ ...prev, [item.id]: newVehId }));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-900 outline-none cursor-pointer"
                        >
                          {item.vehicles.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.name} — ₹{v.price}/day
                            </option>
                          ))}
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
                  {activeDetailItem.category}
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
                {activeDetailItem.vendorName || activeDetailItem.name}
              </h3>
              <p className="text-xs text-[#FF5F00] font-bold mt-0.5">
                {activeDetailItem.name}
              </p>
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
