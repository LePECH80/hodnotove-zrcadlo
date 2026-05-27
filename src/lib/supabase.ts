import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Chybí Supabase environment variables. Zkopíruj .env.local.example → .env.local a vyplň hodnoty.')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}
