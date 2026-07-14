import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xiqirxnnwljwtkabeukr.supabase.co";
const supabaseKey = "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const checks = [
      { table: 'vendors', columns: ['star_rating', 'reviews_count', 'rating'] },
      { table: 'bikes', columns: ['rating', 'reviews_count', 'reviewsCount', 'safety_rating', 'upi_discount', 'full_payment_upi_discount'] },
      { table: 'tours', columns: ['rating', 'reviews_count', 'reviewsCount', 'safety_rating', 'upi_discount', 'full_payment_upi_discount'] }
    ];

    for (const check of checks) {
      console.log(`Checking ${check.table}...`);
      for (const col of check.columns) {
        const { error } = await supabase.from(check.table).select(col).limit(1);
        if (error) {
          console.log(`  Column ${col}: NOT FOUND (Error: ${error.message})`);
        } else {
          console.log(`  Column ${col}: EXISTS!`);
        }
      }
    }
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

run();
