'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, LogOut, User, Shield } from 'lucide-react'

export function AuthDebug() {
  const { user, profile, loading, error, isAuthenticated, userRole, signOut } = useAuth()

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Cargando autenticación...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Debug de Autenticación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de autenticación */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Estado:</span>
          <Badge variant={isAuthenticated ? "default" : "destructive"}>
            {isAuthenticated ? "Autenticado" : "No autenticado"}
          </Badge>
        </div>

        {/* Error si existe */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-800 font-medium">Error:</span>
            <span className="text-red-700 ml-2">{error}</span>
          </div>
        )}

        {/* Información del usuario */}
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Usuario:</span>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Email confirmado:</strong> {user.email_confirmed_at ? "Sí" : "No"}</p>
              <p><strong>Último sign in:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A"}</p>
            </div>
          </div>
        )}

        {/* Información del perfil */}
        {profile && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Perfil:</span>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <p><strong>Nombre:</strong> {profile.full_name}</p>
              <p><strong>Rol:</strong> 
                <Badge variant="outline" className="ml-2">
                  {profile.role}
                </Badge>
              </p>
              <p><strong>Teléfono:</strong> {profile.phone || "N/A"}</p>
              <p><strong>País:</strong> {profile.country || "N/A"}</p>
              <p><strong>Rol detectado:</strong> 
                <Badge variant="outline" className="ml-2">
                  {userRole}
                </Badge>
              </p>
            </div>
          </div>
        )}

        {/* Información del navegador */}
        <div className="space-y-3">
          <div className="font-medium">Información del Navegador:</div>
          <div className="ml-6 space-y-1 text-sm">
            <p><strong>URL actual:</strong> {window.location.href}</p>
            <p><strong>Pathname:</strong> {window.location.pathname}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Cookies habilitadas:</strong> {navigator.cookieEnabled ? "Sí" : "No"}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
          {isAuthenticated && (
            <Button onClick={handleSignOut} variant="destructive" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          )}
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground pt-4 border-t">
          <p>• Este componente solo debe usarse en desarrollo</p>
          <p>• Útil para diagnosticar problemas de autenticación</p>
          <p>• Verifica la consola del navegador para logs adicionales</p>
        </div>
      </CardContent>
    </Card>
  )
}
