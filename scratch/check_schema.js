import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tntbngylkucfymqifkyq.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudGJuZ3lsa3VjZnltcWlma3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU5MjkxNzUsImV4cCI6MjAzMTUwNTE3NX0.4XwB5m..."; // truncated, let's look up in the project.
// Wait, we can load it from .env or config.
