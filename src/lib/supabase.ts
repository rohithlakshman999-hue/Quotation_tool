import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Debugging for Vercel deployment:
console.log("Supabase URL Configured:", !!supabaseUrl, supabaseUrl ? "(hidden)" : "MISSING");
console.log("Supabase Key Configured:", !!supabaseAnonKey, supabaseAnonKey ? "(hidden)" : "MISSING");

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && supabaseAnonKey.length > 10;

// Only create the real client if credentials are valid; otherwise create a dummy that will never be used
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);
