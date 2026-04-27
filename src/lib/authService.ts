import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  session: Session | null
  error: string | null
}

/** Sign up with email and password */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) return { user: null, session: null, error: error.message }
  return { user: data.user, session: data.session, error: null }
}

/** Sign in with email and password */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) return { user: null, session: null, error: error.message }
  return { user: data.user, session: data.session, error: null }
}

/** Sign out the current user */
export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut()
  return { error: error?.message ?? null }
}

/** Get the current session */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Get the current user */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  return data.user
}

/** Subscribe to auth state changes */
export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return data.subscription
}
