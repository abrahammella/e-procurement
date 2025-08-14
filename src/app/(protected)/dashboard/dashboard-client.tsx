'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DashboardStats {
  totalTenders: number
  activeTenders: number
  totalProposals: number
  totalSuppliers: number
  totalBudget: number
  totalProposalsAmount: number
  totalInvoicesAmount: number
  paidInvoicesAmount: number
  tendersByStatus: Record<string, number>
  proposalsByStatus: Record<string, number>
  invoicesByStatus: Record<string, number>
  recentTenders: any[]
  recentProposals: any[]
  recentApprovals: any[]
  supplierStats?: {
    myProposals: number
    myProposalsAmount: number
    pendingApprovals: number
    myInvoices: number
    myInvoicesAmount: number
  }
}

interface DashboardClientProps {
  stats: DashboardStats
  userRole: string
  userName: string | null
}

const statusLabels = {
  // Tenders
  abierta: 'Abierta',
  cerrada: 'Cerrada',
  evaluacion: 'En Evaluación',
  adjudicada: 'Adjudicada',
  cancelada: 'Cancelada',
  
  // Proposals
  enviada: 'Enviada',
  revision: 'En Revisión',
  rechazada: 'Rechazada',
  
  // Invoices
  recibida: 'Recibida',
  validada: 'Validada',
  en_pago: 'En Pago',
  pagada: 'Pagada',
  
  // Approvals
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const statusColors = {
  abierta: 'bg-green-100 text-green-800',
  cerrada: 'bg-gray-100 text-gray-800',
  evaluacion: 'bg-yellow-100 text-yellow-800',
  adjudicada: 'bg-blue-100 text-blue-800',
  cancelada: 'bg-red-100 text-red-800',
  enviada: 'bg-blue-100 text-blue-800',
  revision: 'bg-yellow-100 text-yellow-800',
  rechazada: 'bg-red-100 text-red-800',
  recibida: 'bg-blue-100 text-blue-800',
  validada: 'bg-yellow-100 text-yellow-800',
  en_pago: 'bg-purple-100 text-purple-800',
  pagada: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function DashboardClient({ stats, userRole, userName }: DashboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP' 
    }).format(amount)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  // Calcular porcentajes y tendencias
  const budgetUtilization = stats.totalBudget > 0 
    ? (stats.totalProposalsAmount / stats.totalBudget) * 100 
    : 0

  const invoicePaymentRate = stats.totalInvoicesAmount > 0 
    ? (stats.paidInvoicesAmount / stats.totalInvoicesAmount) * 100 
    : 0

  const activeVsTotal = stats.totalTenders > 0 
    ? (stats.activeTenders / stats.totalTenders) * 100 
    : 0

  // Ver detalles
  const handleViewDetails = (type: string, id?: string) => {
    if (id) {
      window.open(`/${type}/${id}`, '_blank')
    } else {
      window.open(`/${type}`, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard {userRole === 'admin' ? 'Administrativo' : 'Proveedor'}
          </h1>
          <p className="text-muted-foreground">
            {userName ? `Bienvenido, ${userName}` : `Panel de control ${userRole}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Última actualización: {formatDate(new Date().toISOString())}
          </Badge>
        </div>
      </div>

      {/* KPIs Principales */}
      {userRole === 'admin' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Licitaciones Totales</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenders}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                {stats.activeTenders} activas ({activeVsTotal.toFixed(1)}%)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <BarChart3 className="mr-1 h-3 w-3 text-blue-500" />
                {budgetUtilization.toFixed(1)}% utilizado
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propuestas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProposals}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                {formatCurrency(stats.totalProposalsAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="mr-1 h-3 w-3 text-blue-500" />
                Registrados activos
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // KPIs para Suppliers
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Propuestas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.supplierStats?.myProposals || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <DollarSign className="mr-1 h-3 w-3 text-green-500" />
                {formatCurrency(stats.supplierStats?.myProposalsAmount || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobaciones Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.supplierStats?.pendingApprovals || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Requieren tu atención
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Facturas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.supplierStats?.myInvoices || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <DollarSign className="mr-1 h-3 w-3 text-green-500" />
                {formatCurrency(stats.supplierStats?.myInvoicesAmount || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Licitaciones Activas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeTenders}</div>
              <div className="text-xs text-muted-foreground">
                Disponibles para postular
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos y Análisis */}
      {userRole === 'admin' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Estado de Licitaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado de Licitaciones</CardTitle>
              <CardDescription>Distribución por estado actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.tendersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[status as keyof typeof statusColors]} variant="secondary">
                      {statusLabels[status as keyof typeof statusLabels] || status}
                    </Badge>
                  </div>
                  <div className="font-semibold">{count}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Estado de Propuestas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado de Propuestas</CardTitle>
              <CardDescription>Distribución por estado actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.proposalsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[status as keyof typeof statusColors]} variant="secondary">
                      {statusLabels[status as keyof typeof statusLabels] || status}
                    </Badge>
                  </div>
                  <div className="font-semibold">{count}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Métricas Financieras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métricas Financieras</CardTitle>
              <CardDescription>Resumen de montos y pagos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Utilización de Presupuesto</span>
                  <span>{budgetUtilization.toFixed(1)}%</span>
                </div>
                <Progress value={budgetUtilization} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tasa de Pago de Facturas</span>
                  <span>{invoicePaymentRate.toFixed(1)}%</span>
                </div>
                <Progress value={invoicePaymentRate} className="h-2" />
              </div>
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">Total Facturado</div>
                <div className="text-lg font-semibold">{formatCurrency(stats.totalInvoicesAmount)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actividad Reciente */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Licitaciones Recientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Licitaciones Recientes</CardTitle>
                <CardDescription>Últimas licitaciones publicadas</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleViewDetails('tenders')}>
                <Eye className="mr-2 h-4 w-4" />
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentTenders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No hay licitaciones recientes
                </div>
              ) : (
                stats.recentTenders.map((tender) => (
                  <div key={tender.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium">{tender.title}</div>
                      <div className="text-sm text-muted-foreground">{tender.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(tender.budget_rd)}</div>
                      <Badge className={statusColors[tender.status as keyof typeof statusColors]} variant="secondary">
                        {statusLabels[tender.status as keyof typeof statusLabels] || tender.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Propuestas Recientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {userRole === 'admin' ? 'Propuestas Recientes' : 'Mis Propuestas Recientes'}
                </CardTitle>
                <CardDescription>
                  {userRole === 'admin' ? 'Últimas propuestas recibidas' : 'Mis últimas postulaciones'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleViewDetails('proposals')}>
                <Eye className="mr-2 h-4 w-4" />
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentProposals.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No hay propuestas recientes
                </div>
              ) : (
                stats.recentProposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium">{proposal.tenders?.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {proposal.tenders?.code} • {proposal.suppliers?.company_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(proposal.amount_rd)}</div>
                      <Badge className={statusColors[proposal.status as keyof typeof statusColors]} variant="secondary">
                        {statusLabels[proposal.status as keyof typeof statusLabels] || proposal.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aprobaciones Recientes (solo admin) */}
      {userRole === 'admin' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Aprobaciones Recientes</CardTitle>
                <CardDescription>Últimas decisiones tomadas en el sistema</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleViewDetails('approvals')}>
                <Eye className="mr-2 h-4 w-4" />
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentApprovals.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay aprobaciones recientes
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Licitación</TableHead>
                    <TableHead>Ámbito</TableHead>
                    <TableHead>Decisión</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div className="font-medium">{approval.proposals?.tenders?.title}</div>
                        <div className="text-sm text-muted-foreground">{approval.proposals?.tenders?.code}</div>
                      </TableCell>
                      <TableCell>{approval.scope}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[approval.decision as keyof typeof statusColors]} variant="secondary">
                          {statusLabels[approval.decision as keyof typeof statusLabels] || approval.decision}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(approval.decided_at || approval.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}