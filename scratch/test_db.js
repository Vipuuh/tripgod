import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xiqirxnnwljwtkabeukr.supabase.co";
const supabaseKey = "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.from('rafting').select('*').limit(1);
    if (error) {
      console.error("DB Error:", error);
    } else {
      console.log("Success! Columns:", Object.keys(data[0] || {}));
      console.log("Sample Data:", data[0]);
    }
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

run();
