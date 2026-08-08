-- Supabase Schema update for Store Lock / Maintenance Mode
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site_settings (so visitors can check maintenance status)
CREATE POLICY "Allow public read access to site_settings" 
  ON site_settings FOR SELECT 
  USING (true);

-- Allow authenticated users / admins full access to insert/update site_settings
CREATE POLICY "Allow all access to authenticated users for site_settings" 
  ON site_settings FOR ALL 
  USING (auth.role() = 'authenticated');

-- Insert default maintenance mode configuration if not exists
INSERT INTO site_settings (key, value)
VALUES (
  'maintenance_config',
  '{
    "enabled": false,
    "headline": "We are Upgrading TripGod! 🚀",
    "message": "We are currently making exciting upgrades and adding new adventure packages. We will be back online shortly!",
    "estimated_time": "Back online within 2 hours",
    "support_phone": "+91 98765 43210",
    "support_whatsapp": "+919876543210",
    "passcode": "tripgod2026"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
