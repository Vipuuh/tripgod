import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xiqirxnnwljwtkabeukr.supabase.co";
const supabaseKey = "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: tData, error: tErr } = await supabase.from('tours').select('*').limit(1);
    if (tErr) console.error("Tours Error:", tErr);
    else console.log("Tours Columns:", Object.keys(tData[0] || {}));
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

run();
