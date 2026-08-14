-- =========================================================================
-- TripGod Vendor App RLS & Policy Fix Script
-- Run this script in your Supabase SQL Editor to enable Vendor App updates.
-- =========================================================================

-- 1. Ensure net_price and commission_amount columns exist across all catalog tables
ALTER TABLE IF EXISTS bikes ADD COLUMN IF NOT EXISTS net_price NUMERIC;
ALTER TABLE IF EXISTS bikes ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;
ALTER TABLE IF EXISTS bikes ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS rafting ADD COLUMN IF NOT EXISTS net_price NUMERIC;
ALTER TABLE IF EXISTS rafting ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;
ALTER TABLE IF EXISTS rafting ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS hotels ADD COLUMN IF NOT EXISTS net_price NUMERIC;
ALTER TABLE IF EXISTS hotels ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;
ALTER TABLE IF EXISTS hotels ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS tours ADD COLUMN IF NOT EXISTS net_price NUMERIC;
ALTER TABLE IF EXISTS tours ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;
ALTER TABLE IF EXISTS tours ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- 2. Allow public update policies so vendor app updates save directly to Supabase
DROP POLICY IF EXISTS "Allow public update on bikes" ON bikes;
CREATE POLICY "Allow public update on bikes" ON bikes FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on hotels" ON hotels;
CREATE POLICY "Allow public update on hotels" ON hotels FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on rafting" ON rafting;
CREATE POLICY "Allow public update on rafting" ON rafting FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on tours" ON tours;
CREATE POLICY "Allow public update on tours" ON tours FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on vendors" ON vendors;
CREATE POLICY "Allow public update on vendors" ON vendors FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';
