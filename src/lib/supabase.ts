import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export function getSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
} 