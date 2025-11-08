'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabaseClient } from '@/utils/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

// Define the shape of the context value
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create the provider component
// (Makes the Supabase session + user available everywhere. It's a small "manager" component that Talks to Supabase (to get the current user & session, Listens for changes (login/logout), Shares that info with the rest of your app)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for changes in auth state
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = { user, session, loading }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
