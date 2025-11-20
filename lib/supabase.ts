
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// 1. Try to get keys from environment variables
// 2. If missing, you can paste your Supabase URL and Key directly below
//    to connect your local instance.
// ------------------------------------------------------------------

const ENV_URL = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ENV_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// PASTE KEYS HERE IF NOT USING .ENV FILE
const MANUAL_URL = 'https://byquwouozgpowtoyemxe.supabase.co'; 
const MANUAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cXV3b3Vvemdwb3d0b3llbXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Njc4MjksImV4cCI6MjA3OTI0MzgyOX0.eM3yeooJij6RUSTfZSaBGrAuJ6Kvh-DUzViu2LunHzU';

const supabaseUrl = ENV_URL || MANUAL_URL;
const supabaseKey = ENV_KEY || MANUAL_KEY;

// Check if we have valid strings (not empty)
export const isSupabaseConfigured = 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.length > 0 && 
  supabaseUrl.startsWith('http') &&
  typeof supabaseKey === 'string' && 
  supabaseKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn("Supabase credentials missing. App running in OFFLINE MODE with mock data.");
  console.warn("To connect: Add VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY to .env or lib/supabase.ts");
}

// Fallback to a dummy URL if not configured to prevent crash during initialization,
// but isSupabaseConfigured will prevent actual calls.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://byquwouozgpowtoyemxe.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cXV3b3Vvemdwb3d0b3llbXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Njc4MjksImV4cCI6MjA3OTI0MzgyOX0.eM3yeooJij6RUSTfZSaBGrAuJ6Kvh-DUzViu2LunHzU'
);
