'use client'

import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  country: string
  role: 'admin' | 'supplier'
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null
  })

  // Fetch user profile from profiles table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  // Get user role with fallback strategy
  const getUserRole = async (user: User): Promise<string> => {
    // First try to get role from app_metadata
    let role = user.app_metadata?.role as string
    
    // If no role in app_metadata, fetch from profiles table
    if (!role) {
      const profile = await fetchUserProfile(user.id)
      role = profile?.role || 'supplier'
    }
    
    return role
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Use getUser() instead of getSession() for better security
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        if (user) {
          // Get user role first
          const role = await getUserRole(user)
          
          // Fetch user profile
          const profile = await fetchUserProfile(user.id)
          
          setAuthState({
            user: user,
            session: null, // We'll get session separately if needed
            profile,
            loading: false,
            error: null
          })
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null
          })
        }
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
        
        if (session?.user) {
          // Get user role first
          const role = await getUserRole(session.user)
          
          // Fetch user profile on auth change
          const profile = await fetchUserProfile(session.user.id)
          
          setAuthState({
            user: session.user,
            session,
            profile,
            loading: false,
            error: null
          })
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      // Clear any stored data
      localStorage.removeItem('eproc_remembered_email')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return false
      }

      // Clear auth state immediately
      setAuthState({
        user: null,
        session: null,
        profile: null,
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
      
      // Use getUser() instead of refreshSession() for better security
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return false
      }

      if (user) {
        // Get updated user role
        const role = await getUserRole(user)
        
        // Fetch updated profile
        const profile = await fetchUserProfile(user.id)
        
        setAuthState({
          user: user,
          session: null, // We'll get session separately if needed
          profile,
          loading: false,
          error: null
        })
      } else {
        setAuthState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          error: null
        })
      }
      
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

  // Refresh user profile (useful for after profile updates)
  const refreshProfile = async () => {
    if (authState.user) {
      const profile = await fetchUserProfile(authState.user.id)
      setAuthState(prev => ({ ...prev, profile }))
    }
  }

  // Get session when needed for specific operations
  const getSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  return {
    ...authState,
    signOut,
    refreshSession,
    refreshProfile,
    getSession,
    isAuthenticated: !!authState.user,
    isAdmin: authState.profile?.role === 'admin',
    isSupplier: authState.profile?.role === 'supplier',
    userRole: authState.profile?.role || null
  }
}
