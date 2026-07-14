import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xiqirxnnwljwtkabeukr.supabase.co";
const supabaseKey = "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: vData, error: vErr } = await supabase.from('vendors').select('*').limit(1);
    if (vErr) console.error("Vendors Error:", vErr);
    else console.log("Vendors Columns:", Object.keys(vData[0] || {}));
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

run();
