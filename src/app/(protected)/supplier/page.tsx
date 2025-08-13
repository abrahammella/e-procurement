'use client'

import { SupplierRouteGuard } from '@/components/auth/RouteGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, FileText, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

function SupplierPageContent() {
  const { user, profile, userRole } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Panel de Proveedor</h1>
            <p className="text-xl text-gray-600 mt-2">
              Bienvenido, {profile?.full_name || user?.email}
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>

        {/* Supplier Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Información del Proveedor
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

        {/* Supplier Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Mis Propuestas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Gestionar y revisar tus propuestas enviadas.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Licitaciones Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Ver licitaciones abiertas y participar.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-600" />
                Perfil de Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Actualizar información de tu empresa.</p>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="bg-green-50 border-green-200 mt-8">
          <CardContent className="p-6 text-center">
            <Building2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              ¡Middleware Funcionando Correctamente!
            </h2>
            <p className="text-green-700">
              Esta página está protegida por el RouteGuard y solo es accesible para proveedores.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SupplierPage() {
  return (
    <SupplierRouteGuard>
      <SupplierPageContent />
    </SupplierRouteGuard>
  )
}
