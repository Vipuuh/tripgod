-- Supabase Database Schema for TripGod.in

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create CITIES Table
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create VENDORS Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- e.g., 'Hotel', 'Rafting', 'Bike Rental', 'Tour', 'Camping'
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    address TEXT NOT NULL,
    commission_percentage NUMERIC DEFAULT 10.0 NOT NULL,
    status TEXT DEFAULT 'Active' NOT NULL, -- 'Active' or 'Inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create HOTELS Table
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    address TEXT NOT NULL,
    maps_link TEXT,
    whatsapp_number TEXT,
    check_in TEXT DEFAULT '12:00 PM',
    check_out TEXT DEFAULT '11:00 AM',
    cancellation_policy TEXT NOT NULL,
    images TEXT[] DEFAULT '{}'::TEXT[],
    amenities JSONB DEFAULT '{}'::JSONB, -- e.g., {wifi: true, ac: true}
    rules JSONB DEFAULT '{}'::JSONB, -- e.g., {unmarried_couples: true, pets: false}
    landmarks TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create RAFTING Table
CREATE TABLE IF NOT EXISTS rafting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    route TEXT NOT NULL, -- e.g., 'Shivpuri to Nim Beach'
    distance_km NUMERIC NOT NULL,
    duration TEXT NOT NULL, -- e.g., '2-3 Hours'
    pickup_included BOOLEAN DEFAULT false NOT NULL,
    drop_included BOOLEAN DEFAULT false NOT NULL,
    age_limit INTEGER DEFAULT 12 NOT NULL,
    images TEXT[] DEFAULT '{}'::TEXT[],
    inclusions TEXT[] DEFAULT '{}'::TEXT[],
    exclusions TEXT[] DEFAULT '{}'::TEXT[],
    cancellation_policy TEXT NOT NULL,
    whatsapp_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create BIKES Table
CREATE TABLE IF NOT EXISTS bikes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL, -- Daily Rental Price
    deposit NUMERIC DEFAULT 0 NOT NULL, -- Security Deposit
    documents TEXT[] DEFAULT '{}'::TEXT[], -- Required Documents, e.g., ['Aadhar Card', 'Driving License']
    pickup_location TEXT NOT NULL,
    images TEXT[] DEFAULT '{}'::TEXT[],
    whatsapp_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create TOURS Table
CREATE TABLE IF NOT EXISTS tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration TEXT NOT NULL, -- e.g., '3 Days / 2 Nights'
    itinerary JSONB DEFAULT '[]'::JSONB, -- Array of objects: [{day: 1, title: 'Arrival', description: '...'}]
    inclusions TEXT[] DEFAULT '{}'::TEXT[],
    exclusions TEXT[] DEFAULT '{}'::TEXT[],
    cancellation_policy TEXT NOT NULL,
    contact_number TEXT,
    images TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create BOOKINGS Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    service_type TEXT NOT NULL, -- 'Hotel', 'Rafting', 'Bike Rental', 'Tour', 'Camping'
    service_id UUID NOT NULL,
    booking_date DATE DEFAULT CURRENT_DATE NOT NULL,
    travel_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending' (advance paid), 'completed' (serviced), 'cancelled'
    payment_type TEXT DEFAULT 'advance_10' NOT NULL, -- 'advance_10', 'full_online', 'offline'
    amount_paid NUMERIC NOT NULL, -- Advance paid online
    remaining_amount NUMERIC NOT NULL, -- To be collected offline by vendor
    commission_earned NUMERIC DEFAULT 0.0 NOT NULL, -- Calculated commission
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- Enable Row Level Security (RLS) on all tables
-- =========================================================================
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rafting ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS Policies
-- =========================================================================

-- Public Read Policies (Allow everyone to view listings and cities)
CREATE POLICY "Allow public read on cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Allow public read on hotels" ON hotels FOR SELECT USING (true);
CREATE POLICY "Allow public read on rafting" ON rafting FOR SELECT USING (true);
CREATE POLICY "Allow public read on bikes" ON bikes FOR SELECT USING (true);
CREATE POLICY "Allow public read on tours" ON tours FOR SELECT USING (true);

-- Booking Insertion Policy (Allow anyone to place a booking)
CREATE POLICY "Allow public insert on bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Admin Full Access Policies (Allow authenticated admin to perform all CRUD operations)
CREATE POLICY "Allow admin write on cities" ON cities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write on vendors" ON vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write on hotels" ON hotels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write on rafting" ON rafting FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write on bikes" ON bikes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write on tours" ON tours FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write on bookings" ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================================
-- Storage Bucket and Policies (For 'media' bucket)
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public select on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin insert on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update on media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete on media" ON storage.objects;

CREATE POLICY "Allow public select on media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "Allow admin insert on media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Allow admin update on media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media');
CREATE POLICY "Allow admin delete on media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');

-- =========================================================================
-- Schema Extensions (June 2026 Redesign)
-- =========================================================================
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS is_limited_offer BOOLEAN DEFAULT false;

ALTER TABLE rafting ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE rafting ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC;
ALTER TABLE rafting ADD COLUMN IF NOT EXISTS is_limited_offer BOOLEAN DEFAULT false;

ALTER TABLE bikes ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE bikes ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC;
ALTER TABLE bikes ADD COLUMN IF NOT EXISTS is_limited_offer BOOLEAN DEFAULT false;

ALTER TABLE tours ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS is_limited_offer BOOLEAN DEFAULT false;

-- =========================================================================
-- Schema Extensions (Operator Selection Module — June 2026)
-- =========================================================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shop_image TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS star_rating NUMERIC DEFAULT 4.5;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS landmark TEXT;

-- =========================================================================
-- Schema Extensions (Adventure Packages — June 2026)
-- =========================================================================
ALTER TABLE rafting ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'rafting';

-- =========================================================================
-- Schema Extensions (Premium Hotels Detail Page — June 2026)
-- =========================================================================
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.5;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 100;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS rooms_left INTEGER DEFAULT 5;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS high_demand BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS attractions JSONB DEFAULT '[]'::JSONB;

-- =========================================================================
-- Schema Extensions (Premium Hotels Redesign OTA Standards — June 2026)
-- =========================================================================
ALTER TABLE hotels DROP COLUMN IF EXISTS why_guests_love;
ALTER TABLE hotels ADD COLUMN why_guests_love JSONB DEFAULT '[]'::JSONB;

ALTER TABLE hotels ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS bookings_count INTEGER DEFAULT 18;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS popular_badge_text TEXT DEFAULT '18 bookings this week';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'Hotel';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'Deluxe Double Room';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS best_for TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS perfect_for TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS social_proof JSONB DEFAULT '{"trusted_count": "10,000+", "top_rated_text": "Top Rated In Tapovan"}'::JSONB;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::JSONB;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '+919837371137';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS featured_image TEXT;


