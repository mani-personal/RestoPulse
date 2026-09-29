import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Export a standard factory function
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Lazy-initialized singleton client proxy for browserDb to prevent prerender crashes
let cachedClient: SupabaseClient | null = null

export const browserDb = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!cachedClient) {
      if (!supabaseUrl || !supabaseAnonKey) {
        // Return a dummy safe client during static build phase if env vars are missing
        if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
          cachedClient = createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key')
        } else {
          cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey)
        }
      }
    }
    return (cachedClient as any)[prop]
  }
})
