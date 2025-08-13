'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Building2, User, AlertCircle, Loader2 } from 'lucide-react'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'supplier'
  fallbackPath?: string
}

export function RouteGuard({ 
  children, 
  requiredRole, 
  fallbackPath = '/dashboard' 
}: RouteGuardProps) {
  const { user, profile, loading, isAuthenticated, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Si no está autenticado, redirigir a login
      if (!isAuthenticated) {
        console.log('🚫 RouteGuard: User not authenticated, redirecting to login')
        router.push('/login')
        return
      }

      // Si se requiere un rol específico, verificar
      if (requiredRole && userRole !== requiredRole) {
        console.log(`🚫 RouteGuard: User role ${userRole} cannot access ${requiredRole} route`)
        router.push(fallbackPath)
        return
      }
    }
  }, [loading, isAuthenticated, userRole, requiredRole, router, fallbackPath])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar mensaje de acceso denegado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">No tienes acceso a esta página.</p>
            <Button onClick={() => router.push('/login')}>
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole && userRole !== requiredRole) {
    const roleNames = {
      admin: 'Administrador',
      supplier: 'Proveedor'
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
              {requiredRole === 'admin' ? <Shield className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
              Acceso Restringido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Solo los {roleNames[requiredRole]} pueden acceder a esta página.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Tu rol actual: <span className="font-medium">{userRole || 'No definido'}</span>
            </p>
            <Button onClick={() => router.push(fallbackPath)}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Usuario autenticado con permisos correctos
  return <>{children}</>
}

// Componentes específicos para cada tipo de ruta
export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="admin" fallbackPath="/dashboard">
      {children}
    </RouteGuard>
  )
}

export function SupplierRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="supplier" fallbackPath="/dashboard">
      {children}
    </RouteGuard>
  )
}

export function AuthenticatedRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      {children}
    </RouteGuard>
  )
}
