import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '../env'

// Note: This client uses the service role key and bypasses RLS.
// It should ONLY be used in server environments (Server Actions, Route Handlers, etc.)
// and never passed to the client.
export const createAdminClient = () => {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase Service Role Key is required to create an admin client.')
  }

  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
