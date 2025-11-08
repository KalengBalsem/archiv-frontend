import { createClient } from '@supabase/supabase-js';

// fetch the supabase url and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// make and export the supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);