'use client'

import { AuthenticatedRouteGuard } from '@/components/auth/RouteGuard'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogOut, User, Shield, CheckCircle, Building2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

function DashboardPageContent() {
  const { user, profile, userRole, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      console.log('🚪 Iniciando logout...')
      
      // Cerrar sesión en Supabase
      const success = await signOut()
      
      if (success) {
        console.log('✅ Logout exitoso, redirigiendo a login...')
        
        // Redirigir al login después del logout exitoso
        router.push('/login')
      } else {
        console.error('❌ Error en logout')
        // Aún así, redirigir al login
        router.push('/login')
      }
    } catch (error) {
      console.error('❌ Error en logout:', error)
      // En caso de error, también redirigir al login
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h1 className="text-4xl font-bold text-gray-900">¡Redirección Exitosa!</h1>
          </div>
          <p className="text-xl text-gray-600">
            Has llegado al dashboard correctamente
          </p>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">ID:</span>
                <span className="text-gray-600 text-sm">{user?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Estado:</span>
                <Badge variant="default">Autenticado</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Perfil del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Nombre:</span>
                <span className="text-gray-600">{profile?.full_name || 'No definido'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Rol:</span>
                <Badge variant="outline">{profile?.role || userRole || 'No definido'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Teléfono:</span>
                <span className="text-gray-600">{profile?.phone || 'No definido'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="bg-green-50 border-green-200 mb-8">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              ¡Problema de Redirección Resuelto!
            </h2>
            <p className="text-green-700">
              El usuario se autentica correctamente y llega al dashboard sin problemas.
            </p>
          </CardContent>
        </Card>

        {/* Role-specific Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Acceso por Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {userRole === 'admin' && (
                <Button 
                  onClick={() => router.push('/admin')} 
                  variant="default"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Ir al Panel de Administrador
                </Button>
              )}
              
              {userRole === 'supplier' && (
                <Button 
                  onClick={() => router.push('/supplier')} 
                  variant="default"
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  Ir al Panel de Proveedor
                </Button>
              )}
              
              {!userRole && (
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Rol no definido. Contacta al administrador.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Button onClick={handleSignOut} variant="outline" size="lg">
            <LogOut className="h-5 w-5 mr-2" />
            Cerrar Sesión
          </Button>
          
          {/* Debug Navigation (for testing) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button 
              onClick={() => router.push('/admin')} 
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Probar Admin (Debug)
            </Button>
            
            <Button 
              onClick={() => router.push('/supplier')} 
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Probar Supplier (Debug)
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>URL actual: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          <p>Pathname: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthenticatedRouteGuard>
      <DashboardPageContent />
    </AuthenticatedRouteGuard>
  )
}
