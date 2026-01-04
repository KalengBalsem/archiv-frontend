import { createBrowserClient } from '@supabase/ssr'

// fetch the supabase url and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// make and export the supabase client (browser client for proper cookie handling)
export const supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)