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
      console.log('🔍 Fetching profile for user:', userId)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error fetching profile:', error)
        return null
      }

      console.log('✅ Profile fetched successfully:', profile)
      return profile
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error)
      return null
    }
  }

  // Get user role with fallback strategy
  const getUserRole = async (user: User): Promise<string> => {
    try {
      console.log('🔍 Getting role for user:', user.id)
      
      // First try to get role from app_metadata
      let role = user.app_metadata?.role as string
      console.log('🎭 Role from app_metadata:', role)
      
      // If no role in app_metadata, fetch from profiles table
      if (!role) {
        console.log('🔍 No role in app_metadata, fetching from profile...')
        const profile = await fetchUserProfile(user.id)
        role = profile?.role || 'supplier'
        console.log('🎭 Role from profile:', role)
      }
      
      console.log('✅ Final role determined:', role)
      return role
    } catch (error) {
      console.error('❌ Error getting user role:', error)
      return 'supplier' // Default fallback
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...')
        
        // Use getUser() instead of getSession() for better security
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('❌ Error getting user:', error)
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        if (user) {
          console.log('✅ User found:', user.id, user.email)
          
          try {
            // Get user role first
            const role = await getUserRole(user)
            console.log('🎭 User role:', role)
            
            // Fetch user profile
            const profile = await fetchUserProfile(user.id)
            console.log('👤 User profile:', profile)
            
            setAuthState({
              user: user,
              session: null, // We'll get session separately if needed
              profile,
              loading: false,
              error: null
            })
            
            console.log('✅ Auth state updated successfully')
          } catch (profileError) {
            console.error('❌ Error fetching profile/role:', profileError)
            // Set state with user but no profile
            setAuthState({
              user: user,
              session: null,
              profile: null,
              loading: false,
              error: 'Error al obtener el perfil del usuario'
            })
          }
        } else {
          console.log('ℹ️ No user found')
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Error al obtener la sesión', 
          loading: false 
        }))
      }
    }

    // Add timeout protection
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ getInitialSession timeout, forcing loading to false')
      setAuthState(prev => ({ ...prev, loading: false }))
    }, 10000) // 10 seconds timeout

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id)
        
        if (session?.user) {
          try {
            // Get user role first
            const role = await getUserRole(session.user)
            console.log('🎭 User role on auth change:', role)
            
            // Fetch user profile on auth change
            const profile = await fetchUserProfile(session.user.id)
            console.log('👤 User profile on auth change:', profile)
            
            setAuthState({
              user: session.user,
              session,
              profile,
              loading: false,
              error: null
            })
            
            console.log('✅ Auth state updated on auth change')
          } catch (profileError) {
            console.error('❌ Error fetching profile/role on auth change:', profileError)
            // Set state with user but no profile
            setAuthState({
              user: session.user,
              session,
              profile: null,
              loading: false,
              error: 'Error al obtener el perfil del usuario'
            })
          }
        } else {
          console.log('ℹ️ No session on auth change')
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

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      console.log('🚪 useAuth: Iniciando logout...')
      setAuthState(prev => ({ ...prev, loading: true }))
      
      // Clear any stored data
      localStorage.removeItem('eproc_remembered_email')
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ useAuth: Error en logout de Supabase:', error)
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return false
      }

      console.log('✅ useAuth: Logout de Supabase exitoso')
      
      // Clear auth state immediately
      setAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null
      })
      
      console.log('✅ useAuth: Estado de autenticación limpiado')
      return true
      
    } catch (error) {
      console.error('❌ useAuth: Error inesperado en logout:', error)
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

  // Handle intelligent redirect after login
  const handlePostLoginRedirect = async (redirectPath?: string) => {
    try {
      if (!authState.user) {
        console.log('❌ No user authenticated for redirect')
        return '/dashboard'
      }

      const userRole = authState.profile?.role || 'supplier'
      console.log('🎭 User role for redirect:', userRole)
      console.log('🎯 Redirect path:', redirectPath)

      // If redirect path is specified and valid, check if user has access
      if (redirectPath) {
        // Check if user has permission for the redirect path
        if (redirectPath.startsWith('/admin') && userRole === 'admin') {
          console.log('✅ Admin user, redirecting to admin panel')
          return redirectPath
        }

        if (redirectPath.startsWith('/supplier') && userRole === 'supplier') {
          console.log('✅ Supplier user, redirecting to supplier panel')
          return redirectPath
        }

        // If user doesn't have permission, fall back to dashboard
        if (redirectPath.startsWith('/admin') || redirectPath.startsWith('/supplier')) {
          console.log('⚠️ User does not have permission for redirect path, using dashboard')
          return '/dashboard'
        }

        // For other protected routes, allow if it's a valid path
        if (redirectPath.startsWith('/dashboard') || redirectPath.startsWith('/profile') || redirectPath.startsWith('/settings')) {
          return redirectPath
        }
      }

      // Default: always redirect to dashboard
      // Users can navigate to their specific role panels from there
      console.log('🎯 Using default dashboard redirect')
      return '/dashboard'
    } catch (error) {
      console.error('❌ Error in handlePostLoginRedirect:', error)
      return '/dashboard'
    }
  }

  return {
    ...authState,
    signOut,
    refreshSession,
    refreshProfile,
    getSession,
    handlePostLoginRedirect,
    isAuthenticated: !!authState.user,
    isAdmin: authState.profile?.role === 'admin',
    isSupplier: authState.profile?.role === 'supplier',
    userRole: authState.profile?.role || null
  }
}
