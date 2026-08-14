// api/vendor-update.js
// Vercel Serverless Function for Vendor Price & Shop Status Updates
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://xiqirxnnwljwtkabeukr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, table, id, payload } = req.body;

    if (!table || !id || !payload) {
      return res.status(400).json({ error: 'Missing required parameters: table, id, payload' });
    }

    const validTables = ['bikes', 'rafting', 'hotels', 'tours', 'vendors'];
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: `Invalid table: ${table}` });
    }

    // Perform database update using server client
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      console.error(`Error updating ${table} (id: ${id}):`, error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Successfully updated ${table} (id: ${id}):`, payload);
    return res.status(200).json({ success: true, updated: data });

  } catch (err) {
    console.error('vendor-update serverless error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
