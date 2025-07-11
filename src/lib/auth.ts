import { getSupabaseClient } from './supabase'
import { createDeeepUser, DeeepApiError } from './deeep-api'
import { createDeeepApiKey } from './database'

export interface AuthError {
  message: string
}

export const signUp = async (email: string, password: string) => {
  const supabase = getSupabaseClient()
  
  // Step 1: Create Supabase auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    throw { message: error.message } as AuthError
  }

  // Step 2: Call DEEEP API to generate API key
  try {
    const deeepResponse = await createDeeepUser(email)
    
    // Step 3: Create DEEEP API key record in database
    if (data.user) {
      await createDeeepApiKey(
        data.user.id,
        email,
        deeepResponse.api_key,
        deeepResponse.customer_link
      )
    }
  } catch (deeepError) {
    // If DEEEP API fails, we should clean up the auth user
    // For now, we'll throw the error and let the user retry
    if (deeepError instanceof DeeepApiError) {
      throw { message: `Failed to create DEEEP account: ${deeepError.message}` } as AuthError
    }
    throw { message: 'Failed to create user account. Please try again.' } as AuthError
  }

  return data
}

export const signIn = async (email: string, password: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    throw { message: error.message } as AuthError
  }
  return data
}

export const signOut = async () => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw { message: error.message } as AuthError
  }
}

export const getCurrentUser = async () => {
  const supabase = getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
} 