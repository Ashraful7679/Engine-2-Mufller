
import { createClient } from '@supabase/supabase-js';

// Check for environment variables
const envUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const envKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are provided and not empty placeholders
export const isSupabaseConfigured = !!(envUrl && envKey);

// If keys are missing, use placeholders to prevent the "supabaseUrl is required" crash.
// The app will load, but DB calls will fail and trigger the fallback logic in Stores.
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseKey = envKey || 'placeholder-key';

if (!isSupabaseConfigured) {
  console.log("Supabase credentials missing. Running in local demo mode.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
