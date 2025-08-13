'use client'

import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      } catch (error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Error al obtener la sesión', 
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return false
      }

      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      })
      
      return true
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Error al cerrar sesión', 
        loading: false 
      }))
      return false
    }
  }

  const refreshSession = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return false
      }

      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null
      })
      
      return true
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Error al refrescar la sesión', 
        loading: false 
      }))
      return false
    }
  }

  return {
    ...authState,
    signOut,
    refreshSession,
    isAuthenticated: !!authState.user,
    isAdmin: authState.user?.user_metadata?.role === 'admin',
    isSupplier: authState.user?.user_metadata?.role === 'supplier'
  }
}
