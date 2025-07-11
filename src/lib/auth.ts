import { getSupabaseClient } from './supabase'

export interface AuthError {
  message: string
}

export const signUp = async (email: string, password: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) {
    throw { message: error.message } as AuthError
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