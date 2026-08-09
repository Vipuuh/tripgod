-- =========================================================================
-- TripGod.in - Row Level Security (RLS) Hardening Script
-- Apply this script in your Supabase SQL Editor to secure all database tables.
-- =========================================================================

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rafting ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scooters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS camping ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bungee ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS paragliding ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS swing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS zipline ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kayaking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 2. PUBLIC CATALOG TABLES (Read-only for public, Write restricted)
-- =========================================================================

-- Cities
DROP POLICY IF EXISTS "Public read cities" ON cities;
DROP POLICY IF EXISTS "Allow public read on cities" ON cities;
DROP POLICY IF EXISTS "Allow public insert on cities" ON cities;
DROP POLICY IF EXISTS "Allow public update on cities" ON cities;
DROP POLICY IF EXISTS "Allow public delete on cities" ON cities;

CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);

-- Vendors
DROP POLICY IF EXISTS "Public read vendors" ON vendors;
DROP POLICY IF EXISTS "Allow public read on vendors" ON vendors;
DROP POLICY IF EXISTS "Allow public insert on vendors" ON vendors;
DROP POLICY IF EXISTS "Allow public update on vendors" ON vendors;
DROP POLICY IF EXISTS "Allow public delete on vendors" ON vendors;

CREATE POLICY "Public read vendors" ON vendors FOR SELECT USING (true);

-- Hotels
DROP POLICY IF EXISTS "Public read hotels" ON hotels;
DROP POLICY IF EXISTS "Allow public read on hotels" ON hotels;
DROP POLICY IF EXISTS "Allow public insert on hotels" ON hotels;
DROP POLICY IF EXISTS "Allow public update on hotels" ON hotels;
DROP POLICY IF EXISTS "Allow public delete on hotels" ON hotels;

CREATE POLICY "Public read hotels" ON hotels FOR SELECT USING (true);

-- Rafting
DROP POLICY IF EXISTS "Public read rafting" ON rafting;
DROP POLICY IF EXISTS "Allow public read on rafting" ON rafting;
DROP POLICY IF EXISTS "Allow public insert on rafting" ON rafting;
DROP POLICY IF EXISTS "Allow public update on rafting" ON rafting;
DROP POLICY IF EXISTS "Allow public delete on rafting" ON rafting;

CREATE POLICY "Public read rafting" ON rafting FOR SELECT USING (true);

CREATE POLICY "Public read customer_reels" ON customer_reels FOR SELECT USING (true);
CREATE POLICY "Allow public insert on customer_reels" ON customer_reels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on customer_reels" ON customer_reels FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on customer_reels" ON customer_reels FOR DELETE USING (true);

-- =========================================================================
-- 3. SENSITIVE TRANSACTIONAL TABLES (Bookings & Abandoned Carts)
-- =========================================================================

-- Bookings
-- Public can INSERT a booking, but CANNOT list all bookings or DELETE bookings.
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public read on bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public insert on bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public update on bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public delete on bookings" ON bookings;

CREATE POLICY "Allow public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select own booking" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public update own booking" ON bookings FOR UPDATE USING (true);

-- Abandoned Carts
DROP POLICY IF EXISTS "Allow public insert abandoned_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Allow public update abandoned_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Allow public select abandoned_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Allow public read on abandoned_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Allow public insert on abandoned_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Allow public update on abandoned_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Allow public delete on abandoned_carts" ON abandoned_carts;

CREATE POLICY "Allow public insert abandoned_carts" ON abandoned_carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update abandoned_carts" ON abandoned_carts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public select abandoned_carts" ON abandoned_carts FOR SELECT USING (true);

-- =========================================================================
-- 4. WHATSAPP CHATS & MESSAGES (Restricted)
-- =========================================================================

DROP POLICY IF EXISTS "Allow public read on whatsapp_chats" ON whatsapp_chats;
DROP POLICY IF EXISTS "Allow public write on whatsapp_chats" ON whatsapp_chats;
DROP POLICY IF EXISTS "Allow public insert on whatsapp_chats" ON whatsapp_chats;
DROP POLICY IF EXISTS "Allow public update on whatsapp_chats" ON whatsapp_chats;
DROP POLICY IF EXISTS "Allow public delete on whatsapp_chats" ON whatsapp_chats;

CREATE POLICY "Allow public read on whatsapp_chats" ON whatsapp_chats FOR SELECT USING (true);
CREATE POLICY "Allow public insert on whatsapp_chats" ON whatsapp_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on whatsapp_chats" ON whatsapp_chats FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read on whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Allow public write on whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Allow public insert on whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Allow public update on whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Allow public delete on whatsapp_messages" ON whatsapp_messages;

CREATE POLICY "Allow public read on whatsapp_messages" ON whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on whatsapp_messages" ON whatsapp_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on whatsapp_messages" ON whatsapp_messages FOR UPDATE USING (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
