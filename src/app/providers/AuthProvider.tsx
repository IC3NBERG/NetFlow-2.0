import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'

interface AuthContextValue {
  user: Profile | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile fetch failed:', error.message)
      setError('Impossibile caricare il profilo. Riprova.')
      setUser(null)
    } else if (data) {
      setUser(data as unknown as Profile)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const remember = localStorage.getItem('netflow_remember_me')
        if (remember !== 'true') {
          supabase.auth.signOut()
          setIsLoading(false)
        } else {
          fetchProfile(session.user.id)
        }
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  async function signIn(email: string, password: string, rememberMe: boolean = true) {
    setError(null)
    localStorage.setItem('netflow_remember_me', rememberMe ? 'true' : 'false')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      localStorage.removeItem('netflow_remember_me')
      setError(authError.message === 'Invalid login credentials'
        ? 'Email o password non validi'
        : authError.message)
      throw authError
    }
  }

  async function signUp(email: string, password: string) {
    setError(null)
    const { error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      setError(authError.message)
      throw authError
    }
  }

  async function signOut() {
    setError(null)
    localStorage.removeItem('netflow_remember_me')
    await supabase.auth.signOut()
    setUser(null)
  }

  async function refreshProfile() {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, error, signIn, signUp, signOut, refreshProfile, clearError }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
