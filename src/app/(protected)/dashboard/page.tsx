'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogOut, User, Shield, CheckCircle, Building2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, profile, loading, error, isAuthenticated, userRole, signOut } = useAuth()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acceso Denegado</CardTitle>
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

        {/* Actions */}
        <div className="text-center space-y-4">
          <Button onClick={handleSignOut} variant="outline" size="lg">
            <LogOut className="h-5 w-5 mr-2" />
            Cerrar Sesión
          </Button>
          
          {/* Navigation Links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button 
              onClick={() => router.push('/admin')} 
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Shield className="h-5 w-5 mr-2" />
              Panel de Admin
            </Button>
            
            <Button 
              onClick={() => router.push('/supplier')} 
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              <Building2 className="h-5 w-5 mr-2" />
              Panel de Supplier
            </Button>
            
            <Button 
              onClick={() => router.push('/redirect-debug')} 
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              Debug Redirect
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
