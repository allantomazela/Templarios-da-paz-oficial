// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL as string | undefined
)?.trim() ?? ''
const SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
)?.trim() ?? ''

let supabaseInstance: SupabaseClient<Database> | null = null

function createSupabaseClient(): SupabaseClient<Database> {
  if (!SUPABASE_URL) {
    throw new Error(
      'Missing env.VITE_SUPABASE_URL - Crie um arquivo .env na raiz do projeto com VITE_SUPABASE_URL',
    )
  }

  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing env.VITE_SUPABASE_PUBLISHABLE_KEY - Crie um arquivo .env na raiz do projeto com VITE_SUPABASE_PUBLISHABLE_KEY',
    )
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storageKey: 'sb-auth-token',
        },
        global: {
          headers: {
            'x-client-info': 'templarios-app',
          },
        },
      },
    )
  }

  return supabaseInstance
}

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = createSupabaseClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value
  },
})
