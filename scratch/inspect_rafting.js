import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xiqirxnnwljwtkabeukr.supabase.co";
const supabaseKey = "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: rData, error: rErr } = await supabase.from('rafting').select('*').limit(1);
    if (rErr) console.error("Rafting Error:", rErr);
    else console.log("Rafting Columns:", Object.keys(rData[0] || {}));
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

run();
