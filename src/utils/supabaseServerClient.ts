// supabaseServerClient.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  // Prefer a server-only service role key for server-side operations that need elevated DB privileges.
  // IMPORTANT: Never expose the SERVICE_ROLE key to the browser or commit it to source control.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called in a context where cookies are read-only (like a Server Component render)
          }
        },
      },
    }
  )
}
