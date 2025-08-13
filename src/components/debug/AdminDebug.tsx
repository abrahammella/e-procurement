'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function AdminDebug() {
  const { user, profile, loading, error, isAuthenticated, userRole } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Force a page reload to test auth state
    window.location.reload()
  }

  const checkLocalStorage = () => {
    const keys = Object.keys(localStorage)
    const authKeys = keys.filter(key => key.includes('supabase') || key.includes('auth'))
    return authKeys
  }

  const checkSessionStorage = () => {
    const keys = Object.keys(sessionStorage)
    const authKeys = keys.filter(key => key.includes('supabase') || key.includes('auth'))
    return authKeys
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">🔍 Debug de Autenticación Admin</h1>
          <p className="text-xl text-gray-600 mt-2">
            Diagnóstico del problema de "Verificando autenticación..."
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                 isAuthenticated ? <CheckCircle className="h-5 w-5 text-green-500" /> : 
                 <AlertCircle className="h-5 w-5 text-red-500" />}
                Estado de Autenticación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Loading:</span>
                  <Badge variant={loading ? "default" : "secondary"}>
                    {loading ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Autenticado:</span>
                  <Badge variant={isAuthenticated ? "default" : "destructive"}>
                    {isAuthenticated ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Error:</span>
                  <Badge variant={error ? "destructive" : "secondary"}>
                    {error ? "Sí" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Usuario:</span>
                  <Badge variant={user ? "default" : "secondary"}>
                    {user ? "Presente" : "Ausente"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="text-sm text-gray-600">{user?.email || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">ID:</span>
                  <span className="text-xs text-gray-600">{user?.id || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Perfil y Rol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Perfil:</span>
                  <Badge variant={profile ? "default" : "secondary"}>
                    {profile ? "Presente" : "Ausente"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Rol:</span>
                  <Badge variant="outline">{userRole || "N/A"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Nombre:</span>
                  <span className="text-sm text-gray-600">{profile?.full_name || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Debug Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🔍 Información Detallada de Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">❌ Error de Autenticación:</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* User Object */}
            <div>
              <h3 className="font-medium mb-2">👤 Objeto Usuario:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            {/* Profile Object */}
            <div>
              <h3 className="font-medium mb-2">📋 Objeto Perfil:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>

            {/* App Metadata */}
            <div>
              <h3 className="font-medium mb-2">🎭 App Metadata:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(user?.app_metadata, null, 2)}
              </pre>
            </div>

            {/* Local Storage */}
            <div>
              <h3 className="font-medium mb-2">💾 Local Storage (Auth Keys):</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(checkLocalStorage(), null, 2)}
              </pre>
            </div>

            {/* Session Storage */}
            <div>
              <h3 className="font-medium mb-2">🔐 Session Storage (Auth Keys):</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(checkSessionStorage(), null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Button onClick={handleRefresh} disabled={isRefreshing} size="lg">
            <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refrescando...' : 'Refrescar Página'}
          </Button>
          
          <div className="text-sm text-gray-500">
            <p>Última actualización: {new Date().toLocaleString()}</p>
            <p>Revisa la consola del navegador para logs detallados</p>
          </div>
        </div>
      </div>
    </div>
  )
}
