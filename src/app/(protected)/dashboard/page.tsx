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
  FileText, 
  DollarSign, 
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

// Temporary role flag - will be replaced with Supabase Auth later
const TEMP_ROLE: 'admin' | 'supplier' = 'supplier' // Change this to 'supplier' to see supplier view

// Admin View Component
function AdminView() {
  const adminStats = [
    {
      title: 'Concursos Abiertos',
      value: '18',
      change: '+8%',
      changeType: 'positive',
      icon: Target,
      description: 'Active tenders this month'
    },
    {
      title: 'RFPs Activos',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: FileText,
      description: 'Request for proposals'
    },
    {
      title: 'Propuestas Recibidas',
      value: '156',
      change: '+23%',
      changeType: 'positive',
      icon: FileCheck,
      description: 'Total proposals'
    },
    {
      title: 'Facturas Pendientes',
      value: '$45.2K',
      change: '-5%',
      changeType: 'negative',
      icon: Receipt,
      description: 'vs last month'
    }
  ]

  const recentUpdates = [
    {
      id: '1',
      action: 'Nuevo concurso publicado',
      project: '25 Hours Hotel FF&E',
      user: 'Admin User',
      time: '2 horas atrás',
      status: 'published'
    },
    {
      id: '2',
      action: 'Propuesta aprobada',
      project: 'Office Complex Renovation',
      user: 'Procurement Team',
      time: '4 horas atrás',
      status: 'approved'
    },
    {
      id: '3',
      action: 'RFP enviado a proveedores',
      project: 'Shopping Mall FF&E',
      user: 'Admin User',
      time: '6 horas atrás',
      status: 'sent'
    },
    {
      id: '4',
      action: 'Factura procesada',
      project: 'Hotel Renovation',
      user: 'Finance Team',
      time: '1 día atrás',
      status: 'processed'
    },
    {
      id: '5',
      action: 'Nuevo proveedor registrado',
      project: 'General',
      user: 'System',
      time: '2 días atrás',
      status: 'registered'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-purple-100 text-purple-800'
      case 'processed': return 'bg-gray-100 text-gray-800'
      case 'registered': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">Vista general del sistema de E-Procurement</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Nuevo Concurso
          </Button>
          <Button className="bg-navy-600 hover:bg-navy-700">
            <Users className="h-4 w-4 mr-2" />
            Gestionar Proveedores
          </Button>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-navy-50 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-navy-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Updates Table */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Últimas Actualizaciones</CardTitle>
                  <CardDescription>Actividad reciente del sistema</CardDescription>
                </div>
                <Button variant="outline" size="sm">Ver Todas</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acción</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUpdates.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell className="font-medium">{update.action}</TableCell>
                      <TableCell>{update.project}</TableCell>
                      <TableCell>{update.user}</TableCell>
                      <TableCell>{update.time}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(update.status)}>
                          {update.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Chart Placeholder */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Análisis de Propuestas</CardTitle>
              <CardDescription>Distribución por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-navy-600" />
                  </div>
                  <p className="text-sm text-gray-600">Gráfico de Propuestas</p>
                  <p className="text-xs text-gray-500">Placeholder para visualización</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Acceso directo a funciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Crear Concurso
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Publicar RFP
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Revisar Propuestas
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Receipt className="h-4 w-4 mr-2" />
                  Gestionar Facturas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Supplier View Component
function SupplierView() {
  const supplierStats = [
    {
      title: 'Licitaciones Abiertas',
      value: '12',
      change: '+3',
      changeType: 'positive',
      icon: Target,
      description: 'Available for bidding'
    },
    {
      title: 'Mis Propuestas',
      value: '8',
      change: '+2',
      changeType: 'positive',
      icon: FileCheck,
      description: 'Submitted proposals'
    },
    {
      title: 'Propuestas Ganadas',
      value: '3',
      change: '+1',
      changeType: 'positive',
      icon: Award,
      description: 'Won contracts'
    },
    {
      title: 'Facturas Pendientes',
      value: '$12.8K',
      change: '-$2.1K',
      changeType: 'negative',
      icon: Receipt,
      description: 'vs last month'
    }
  ]

  const upcomingDeadlines = [
    {
      id: '1',
      project: '25 Hours Hotel FF&E',
      type: 'RFP Submission',
      deadline: '2024-01-15',
      daysLeft: 3,
      priority: 'high'
    },
    {
      id: '2',
      project: 'Office Complex Renovation',
      type: 'Proposal Review',
      deadline: '2024-01-20',
      daysLeft: 8,
      priority: 'medium'
    },
    {
      id: '3',
      project: 'Shopping Mall FF&E',
      type: 'Contract Signing',
      deadline: '2024-01-25',
      daysLeft: 13,
      priority: 'low'
    },
    {
      id: '4',
      project: 'Hotel Renovation',
      type: 'Document Submission',
      deadline: '2024-01-30',
      daysLeft: 18,
      priority: 'low'
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysLeftColor = (days: number) => {
    if (days <= 3) return 'text-red-600'
    if (days <= 7) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Proveedor</h1>
          <p className="text-gray-600 mt-1">Bienvenido de vuelta a tu panel de proveedor</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Ver Licitaciones
          </Button>
          <Button className="bg-navy-600 hover:bg-navy-700">
            <FileCheck className="h-4 w-4 mr-2" />
            Nueva Propuesta
          </Button>
        </div>
      </div>

      {/* Supplier Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {supplierStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-navy-50 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-navy-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Próximos Deadlines</CardTitle>
                <CardDescription>Fechas importantes a considerar</CardDescription>
              </div>
              <Button variant="outline" size="sm">Ver Calendario</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{deadline.project}</h3>
                      <Badge className={getPriorityColor(deadline.priority)}>
                        {deadline.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>{deadline.type}</span>
                      <span>Fecha: {deadline.deadline}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm font-medium ${getDaysLeftColor(deadline.daysLeft)}`}>
                        {deadline.daysLeft} días restantes
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Acceso directo a funciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Ver Licitaciones
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Mis Propuestas
                </Button>
                <Button variant="outline" className="h-4 w-4 mr-2">
                  <Receipt className="h-4 w-4 mr-2" />
                  Mis Facturas
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendario
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Alertas importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Deadline próximo</p>
                    <p className="text-xs text-red-700">RFP para 25 Hours Hotel vence en 3 días</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Propuesta aprobada</p>
                    <p className="text-xs text-blue-700">Tu propuesta para Office Complex fue aceptada</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Pago recibido</p>
                    <p className="text-xs text-green-700">Factura #INV-2024-001 pagada</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function DashboardPage() {
  return (
    <div>
      {/* Role Toggle - Temporary for development */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-yellow-800">🔧 Modo de Desarrollo</h3>
            <p className="text-xs text-yellow-700 mt-1">
              Cambia TEMP_ROLE en el código para ver diferentes vistas. 
              Actual: <strong>{TEMP_ROLE}</strong>
            </p>
          </div>
          <div className="text-xs text-yellow-600">
            <p>admin → AdminView</p>
            <p>supplier → SupplierView</p>
          </div>
        </div>
      </div>

      {/* Render appropriate view based on role */}
      {TEMP_ROLE === 'admin' ? <AdminView /> : <SupplierView />}
    </div>
  )
}
