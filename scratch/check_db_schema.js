import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xiqirxnnwljwtkabeukr.supabase.co";
const supabaseKey = "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const tables = ['vendors', 'bikes', 'tours', 'rafting'];
    for (const table of tables) {
      // We can inspect columns by fetching a single row, or using postgres RPC if available.
      // Since RPC is prohibited, let's see if we can do a select with empty query or check the error message.
      // Better: we can check what columns are returned when we select * on a table even if it's empty!
      // Wait, in inspect_vendors.js, data was [] so Object.keys(data[0]) threw or returned empty.
      // But we can get table columns by calling a query with a non-existent column and parsing the error message,
      // or we can select from information_schema via standard postgres rest interface? 
      // Wait, standard supabase REST API doesn't allow selecting from information_schema directly unless exposed.
      // Let's see if there's any row in vendors! Let's fetch all vendors.
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`Error fetching ${table}:`, error);
      } else {
        console.log(`Table ${table} has ${data.length} rows.`);
        if (data.length > 0) {
          console.log(`${table} Columns:`, Object.keys(data[0]));
        } else {
          // If 0 rows, let's try to insert a dummy row or fetch with an error to see if we can get info.
          console.log(`${table} is empty.`);
        }
      }
    }
  } catch (err) {
    console.error("Catch Error:", err);
  }
}

run();
