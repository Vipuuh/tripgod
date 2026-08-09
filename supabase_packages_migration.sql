-- Supabase Migration: Create PACKAGES Table for TripGod

CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    badge TEXT DEFAULT '🔥 Bestseller', -- e.g., '👑 Bestseller', '⚡ Save ₹1,500', '🟢 Verified Combo'
    duration TEXT DEFAULT '2 Days / 1 Night',
    original_price NUMERIC NOT NULL,
    discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC NOT NULL DEFAULT 15.0, -- e.g., 20 for 20% or 1000 for ₹1000 Flat OFF
    final_price NUMERIC NOT NULL, -- Pre-computed or calculated final price
    images TEXT[] DEFAULT '{}'::TEXT[],
    
    -- Dynamic Included Activities/Services Array
    included_items JSONB DEFAULT '[]'::JSONB,
    -- Structure: [
    --   { "category": "Hotel", "name": "Luxury AC Room", "icon": "Hotel", "details": "1 Night Stay at Grand Tapovan with AC & Wi-Fi" },
    --   { "category": "Rafting", "name": "16 KM Rafting", "icon": "Waves", "details": "Shivpuri to Nim Beach + Cliff Jumping" },
    --   { "category": "Scooty", "name": "Honda Activa 6G", "icon": "Bike", "details": "24 Hours Rental with Helmet" }
    -- ]

    -- Dynamic Optional Add-Ons available on checkout
    optional_addons JSONB DEFAULT '[]'::JSONB,
    -- Structure: [
    --   { "id": "ganga_aarti", "name": "Ganga Aarti VIP Guided Pass", "price": 299 },
    --   { "id": "camping_night", "name": "Riverside Camping Night Upgrade", "price": 999 },
    --   { "id": "bungee_jump", "name": "83m Bungee Jumping Spot Booking", "price": 3100 }
    -- ]

    inclusions TEXT[] DEFAULT '{}'::TEXT[],
    exclusions TEXT[] DEFAULT '{}'::TEXT[],
    cancellation_policy TEXT DEFAULT 'Free cancellation up to 48 hours before check-in',
    whatsapp_number TEXT DEFAULT '919876543210',
    verified BOOLEAN DEFAULT true,
    rating NUMERIC DEFAULT 4.9,
    review_count INTEGER DEFAULT 120,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active packages
CREATE POLICY "Allow public read access to active packages"
ON packages FOR SELECT
USING (is_active = true);

-- Sample Initial Data for Rishikesh Combos
INSERT INTO packages (
    title,
    slug,
    tagline,
    badge,
    duration,
    original_price,
    discount_type,
    discount_value,
    final_price,
    images,
    included_items,
    optional_addons,
    inclusions,
    rating,
    review_count
) VALUES (
    'Rishikesh Weekend Thrill Combo',
    'rishikesh-weekend-thrill-combo',
    'Hotel Stay + 16KM Rafting + Honda Activa 6G',
    '👑 Bestseller',
    '2 Days / 1 Night',
    5200,
    'percentage',
    25,
    3900,
    ARRAY[
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80'
    ],
    '[
        {"category": "Hotel", "name": "Deluxe AC Room Stay", "icon": "Hotel", "details": "1 Night stay at Grand Tapovan with Mountain View, Wi-Fi & Breakfast"},
        {"category": "Rafting", "name": "16 KM Shivpuri Rafting", "icon": "Waves", "details": "Includes Cliff Jumping, Safety Gear, & Certified River Guide"},
        {"category": "Scooty", "name": "Honda Activa 6G (24 Hours)", "icon": "Bike", "details": "Unlimited KM, Helmet included, Pick up at Tapovan"}
    ]'::JSONB,
    '[
        {"id": "ganga_aarti", "name": "Ganga Aarti VIP Guided Pass", "price": 299},
        {"id": "camping", "name": "Riverside Camping Night Upgrade", "price": 999},
        {"id": "bungee", "name": "Jumpin Heights 83m Bungee Jump Slot", "price": 3100}
    ]'::JSONB,
    ARRAY['1 Night Deluxe Accommodation', '16 KM Shivpuri River Rafting', '24 Hours Scooty Rental', 'Buffet Breakfast', 'Free Cliff Jumping Experience'],
    4.9,
    142
), (
    'Ultimate Extreme Adventurer Package',
    'ultimate-extreme-adventurer-package',
    'Stay + Rafting + Scooty + Riverside Camping',
    '🔥 Flat ₹1,500 OFF',
    '3 Days / 2 Nights',
    7500,
    'flat',
    1500,
    6000,
    ARRAY[
        'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80'
    ],
    '[
        {"category": "Hotel", "name": "1 Night Boutique Hotel Stay", "icon": "Hotel", "details": "Luxury stay in Tapovan with pool & rooftop cafe"},
        {"category": "Camping", "name": "1 Night Riverside Luxury Camping", "icon": "Tent", "details": "Campfire, Evening Snacks, & Live Music"},
        {"category": "Rafting", "name": "26 KM Marine Drive Rafting", "icon": "Waves", "details": "Full day extreme rafting experience"},
        {"category": "Scooty", "name": "Jupiter / Activa Rental (48 Hours)", "icon": "Bike", "details": "Full 2 Days rental for Rishikesh exploration"}
    ]'::JSONB,
    '[
        {"id": "bungee", "name": "83m Bungee Jump Slot", "price": 3100},
        {"id": "ganga_aarti", "name": "Triveni Ghat Aarti VIP Pass", "price": 299}
    ]'::JSONB,
    ARRAY['1 Night Hotel + 1 Night Camping', '26 KM Extreme Rafting', '48 Hours Scooty Rental', 'Campfire & Evening Snacks', 'All Meals Included in Camp'],
    4.9,
    98
) ON CONFLICT (slug) DO NOTHING;
