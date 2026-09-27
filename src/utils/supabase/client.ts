import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Password-recovery links are commonly opened in a browser other than the
 * one that requested them (for example, email in Safari after requesting from
 * Brave). Use Supabase's client-only implicit flow for that isolated journey:
 * it returns tokens in the URL fragment rather than requiring a PKCE verifier
 * stored by the requesting browser. Normal app auth remains on the SSR PKCE
 * client above.
 */
export function createRecoveryClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
      },
    },
  )
}
