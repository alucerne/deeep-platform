import { getSupabaseClient } from './supabase'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  api_key: string | null
  customer_link: string | null
  created_at: string
  updated_at: string
}

export interface DeeepApiKey {
  id: string
  user_id: string
  email: string
  api_key: string
  customer_link: string | null
  created_at: string
}

export async function createUserProfile(
  userId: string,
  email: string,
  apiKey: string,
  customerLink: string
): Promise<UserProfile> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      email,
      api_key: apiKey,
      customer_link: customerLink
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`)
  }

  return data
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to get user profile: ${error.message}`)
  }

  return data
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'api_key' | 'customer_link'>>
): Promise<UserProfile> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`)
  }

  return data
}

export async function createDeeepApiKey(
  userId: string,
  email: string,
  apiKey: string,
  customerLink?: string
): Promise<DeeepApiKey> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('deeep_api_keys')
    .insert({
      user_id: userId,
      email,
      api_key: apiKey,
      customer_link: customerLink
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create DEEEP API key: ${error.message}`)
  }

  return data
}

export async function getDeeepApiKeys(userId: string): Promise<DeeepApiKey[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('deeep_api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get DEEEP API keys: ${error.message}`)
  }

  return data || []
}

export async function getLatestDeeepApiKey(userId: string): Promise<DeeepApiKey | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('deeep_api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to get latest DEEEP API key: ${error.message}`)
  }

  return data
} 