import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xiqirxnnwljwtkabeukr.supabase.co";
const supabaseKey = "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.from('tours').select('*').limit(1);
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Tours Row:", data[0]);
    }
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

run();
