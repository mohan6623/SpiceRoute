import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import * as auth from '../lib/authService'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user and session
    Promise.all([auth.getCurrentUser(), auth.getSession()]).then(([u, s]) => {
      setUser(u)
      setSession(s)
      setLoading(false)
    })

    // Subscribe to changes
    const subscription = auth.onAuthStateChange((u, s) => {
      setUser(u)
      setSession(s)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const result = await auth.signIn(email, password)
    return result.error
  }, [])

  const handleSignUp = useCallback(async (email: string, password: string) => {
    const result = await auth.signUp(email, password)
    return result.error
  }, [])

  const handleSignOut = useCallback(async () => {
    await auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
