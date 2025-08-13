'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  ShoppingCart,
  FileCheck,
  Calendar,
  Target,
  Receipt,
  Award,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// Admin View Component
function AdminView() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concursos Abiertos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RFPs Activos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1</span> esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propuestas Recibidas</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12</span> este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-5</span> esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Updates Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Últimas Actualizaciones</CardTitle>
          <CardDescription>Actividad reciente en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actividad</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Nuevo RFP creado</TableCell>
                <TableCell>admin@empresa.com</TableCell>
                <TableCell>
                  <Badge variant="default">Completado</Badge>
                </TableCell>
                <TableCell>Hace 2 horas</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Propuesta recibida</TableCell>
                <TableCell>proveedor@ejemplo.com</TableCell>
                <TableCell>
                  <Badge variant="secondary">En revisión</Badge>
                </TableCell>
                <TableCell>Hace 4 horas</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Concurso cerrado</TableCell>
                <TableCell>sistema</TableCell>
                <TableCell>
                  <Badge variant="destructive">Cerrado</Badge>
                </TableCell>
                <TableCell>Hace 1 día</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Análisis de Compras</CardTitle>
          <CardDescription>Métricas del último trimestre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Gráfico de análisis de compras</p>
              <p className="text-sm">Implementar con Chart.js o Recharts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <FileText className="h-6 w-6" />
              <span>Crear RFP</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Gestionar Proveedores</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <ShoppingCart className="h-6 w-6" />
              <span>Nuevo Concurso</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>Ver Reportes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Supplier View Component
function SupplierView() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licitaciones Abiertas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> nuevas esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Propuestas</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> enviadas este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propuestas Ganadas</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1</span> este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-600">$12,450</span> por cobrar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Próximos Deadlines</CardTitle>
          <CardDescription>Fechas importantes para tus propuestas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">RFP - Servicios de Limpieza</p>
                  <p className="text-sm text-yellow-700">Vence en 2 días</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700">
                Ver Detalles
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Concurso - Equipos de Oficina</p>
                  <p className="text-sm text-blue-700">Vence en 5 días</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                Ver Detalles
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Propuesta Aprobada</p>
                  <p className="text-sm text-green-700">Servicios de IT - Aprobada</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-green-300 text-green-700">
                Ver Detalles
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Mantente al día con las últimas novedades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nueva licitación disponible</p>
                <p className="text-xs text-gray-600">Se ha publicado una nueva licitación para servicios de mantenimiento</p>
                <p className="text-xs text-gray-500 mt-1">Hace 1 hora</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Propuesta evaluada</p>
                <p className="text-xs text-gray-600">Tu propuesta para el proyecto de construcción ha sido evaluada</p>
                <p className="text-xs text-gray-500 mt-1">Hace 3 horas</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Recordatorio de deadline</p>
                <p className="text-xs text-gray-600">No olvides enviar tu propuesta para el RFP de tecnología</p>
                <p className="text-xs text-gray-500 mt-1">Hace 5 horas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Dashboard Component
export default function DashboardPage() {
  const { user, profile, isAuthenticated, loading, userRole } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-navy-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-navy-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Requerido</h2>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para acceder al dashboard</p>
          <Button onClick={() => window.location.href = '/login'}>
            Ir al Login
          </Button>
        </div>
      </div>
    )
  }

  // Show profile loading if profile not yet loaded
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-navy-600">Cargando perfil de usuario...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {profile.full_name || user?.email?.split('@')[0] || 'Usuario'}
        </h1>
        <p className="text-gray-600 mt-2">
          {userRole === 'admin' ? 'Panel de Administración' : 'Panel de Proveedor'}
        </p>
      </div>

      {/* Role Indicator */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800">👤 Rol de Usuario</h3>
            <p className="text-xs text-blue-700 mt-1">
              Tu rol actual: <strong>{userRole === 'admin' ? 'Administrador' : 'Proveedor'}</strong>
            </p>
          </div>
          <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
            {userRole === 'admin' ? 'Admin' : 'Supplier'}
          </Badge>
        </div>
      </div>

      {/* Render appropriate view based on role */}
      {userRole === 'admin' ? <AdminView /> : <SupplierView />}
    </div>
  )
}
