'use client'

import { AdminRouteGuard } from '@/components/auth/RouteGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Users, Settings, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

function AdminPageContent() {
  const { user, profile, userRole } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-xl text-gray-600 mt-2">
              Bienvenido, {profile?.full_name || user?.email}
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>

        {/* Admin Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Información de Administrador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Email:</span>
              <span className="text-gray-600">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Rol:</span>
              <Badge variant="default">{userRole}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Estado:</span>
              <Badge variant="outline" className="text-green-600">Activo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Administrar usuarios, roles y permisos del sistema.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Configuración del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configurar parámetros y configuraciones del sistema.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configurar políticas de seguridad y auditoría.</p>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="bg-green-50 border-green-200 mt-8">
          <CardContent className="p-6 text-center">
            <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              ¡Middleware Funcionando Correctamente!
            </h2>
            <p className="text-green-700">
              Esta página está protegida por el RouteGuard y solo es accesible para administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AdminRouteGuard>
      <AdminPageContent />
    </AdminRouteGuard>
  )
}
