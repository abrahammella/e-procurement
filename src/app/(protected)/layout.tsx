'use client'

import { DashboardShell } from '@/components/layout/DashboardShell'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-navy-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, let middleware handle the redirect
  // Don't redirect from here to avoid conflicts
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-navy-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}
