'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Approval {
  id: string
  scope: 'apertura_tender' | 'comite_rfp' | 'comite_ejecutivo' | 'gerente_ti' | 'director_ti' | 'vp_ti'
  proposal_id: string | null
  tender_id: string | null
  approver_email: string
  decision: 'pending' | 'approved' | 'rejected'
  decided_at: string | null
  comment: string | null
  decided_by: string | null
  token: string
  expires_at: string
  proposals?: {
    id: string
    amount_rd: number
    delivery_months: number
    status: string
    tenders: {
      id: string
      code: string
      title: string
      status: string
      budget_rd: number
      deadline: string
    }
  }
  tenders?: {
    id: string
    code: string
    title: string
    status: string
    budget_rd: number
    deadline: string
    description: string | null
  }
}

interface ApprovalsData {
  items: Approval[]
  total: number
}

interface ApprovalsClientProps {
  initialData: ApprovalsData
  userRole: string
  userEmail: string
}

const scopeLabels = {
  apertura_tender: 'Apertura de Licitación',
  comite_rfp: 'Comité RFP',
  comite_ejecutivo: 'Comité Ejecutivo',
  gerente_ti: 'Gerente TI',
  director_ti: 'Director TI',
  vp_ti: 'VP Tecnología',
}

const decisionColors = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const decisionLabels = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

export default function ApprovalsClient({ 
  initialData, 
  userRole, 
  userEmail 
}: ApprovalsClientProps) {
  const [data, setData] = useState<ApprovalsData>(initialData)
  const [loading, setLoading] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [comment, setComment] = useState('')
  const { toast } = useToast()

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
    return format(date, "dd/MM/yyyy 'a las' h:mm a", { locale: es })
  }

  // Verificar si el token ha expirado
  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt)
  }

  // Manejar decisión de aprobación
  const handleDecision = async (approval: Approval, decision: 'approved' | 'rejected') => {
    try {
      setLoading(true)
      
      console.log('🚀 Enviando decisión:', {
        approval_id: approval.id,
        token: approval.token,
        decision,
        comment: comment.trim(),
        scope: approval.scope,
        tender_id: approval.tender_id
      })

      const requestBody = {
        token: approval.token,
        decision,
        comment: comment.trim() || undefined
      }
      
      console.log('📤 Request body:', requestBody)

      const response = await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      console.log('📥 Response status:', response.status)
      const result = await response.json()
      console.log('📥 Response data:', result)

      if (!response.ok) {
        throw new Error(result.error || `Error al ${decision === 'approved' ? 'aprobar' : 'rechazar'}`)
      }

      // Actualizar el estado local
      setData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === approval.id 
            ? { ...item, decision, decided_at: new Date().toISOString(), comment: comment.trim() || item.comment }
            : item
        )
      }))

      const itemType = approval.scope === 'apertura_tender' ? 'licitación' : 'propuesta'
      toast({
        title: decision === 'approved' ? `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} aprobada` : `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} rechazada`,
        description: `La decisión ha sido registrada exitosamente`,
      })

      // Limpiar el formulario
      setSelectedApproval(null)
      setComment('')

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar decisión',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Ver detalles del tender
  const handleViewTender = (approval: Approval) => {
    const tenderId = approval.scope === 'apertura_tender' ? approval.tender_id : approval.proposals?.tenders.id
    if (tenderId) {
      window.open(`/tenders/${tenderId}`, '_blank')
    }
  }

  // Obtener información del item a aprobar
  const getItemInfo = (approval: Approval) => {
    if (approval.scope === 'apertura_tender' && approval.tenders) {
      return {
        title: approval.tenders.title,
        code: approval.tenders.code,
        budget: approval.tenders.budget_rd,
        type: 'tender' as const
      }
    } else if (approval.proposals) {
      return {
        title: approval.proposals.tenders.title,
        code: approval.proposals.tenders.code,
        budget: approval.proposals.amount_rd,
        type: 'proposal' as const
      }
    }
    return null
  }

  // Estadísticas
  const stats = {
    total: data.total,
    pending: data.items.filter(a => a.decision === 'pending').length,
    approved: data.items.filter(a => a.decision === 'approved').length,
    rejected: data.items.filter(a => a.decision === 'rejected').length,
    expired: data.items.filter(a => a.decision === 'pending' && isExpired(a.expires_at)).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bandeja de Aprobaciones</h1>
        <p className="text-muted-foreground">
          {userRole === 'admin' 
            ? 'Gestiona todas las aprobaciones del sistema'
            : 'Revisa y decide sobre las propuestas asignadas a ti'
          }
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de aprobaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Aprobaciones</CardTitle>
          <CardDescription>
            {userRole === 'admin' 
              ? 'Todas las aprobaciones del sistema ordenadas por prioridad'
              : 'Aprobaciones asignadas a tu email'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Licitación</TableHead>
                  <TableHead>Ámbito</TableHead>
                  <TableHead>Propuesta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Clock className="mx-auto h-8 w-8 mb-2" />
                        <p>No tienes aprobaciones pendientes</p>
                        <p className="text-sm">
                          Las nuevas aprobaciones aparecerán aquí cuando sean asignadas
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((approval) => (
                    <TableRow key={approval.id} className={
                      approval.decision === 'pending' && isExpired(approval.expires_at) 
                        ? 'bg-red-50' 
                        : approval.decision === 'pending' 
                          ? 'bg-amber-50' 
                          : ''
                    }>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {approval.scope === 'apertura_tender' ? approval.tenders?.title : approval.proposals?.tenders.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {approval.scope === 'apertura_tender' ? approval.tenders?.code : approval.proposals?.tenders.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {scopeLabels[approval.scope]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {approval.scope === 'apertura_tender' ? (
                          <div>
                            <div className="font-semibold">
                              {approval.tenders && formatCurrency(approval.tenders.budget_rd)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Presupuesto disponible
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold">
                              {approval.proposals && formatCurrency(approval.proposals.amount_rd)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {approval.proposals && approval.proposals.delivery_months} meses
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={decisionColors[approval.decision]}>
                            {decisionLabels[approval.decision]}
                          </Badge>
                          {approval.decision === 'pending' && isExpired(approval.expires_at) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {approval.decision === 'pending' ? (
                          <div className={isExpired(approval.expires_at) ? 'text-red-600' : 'text-muted-foreground'}>
                            {formatDate(approval.expires_at)}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            {formatDate(approval.decided_at!)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTender(approval)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Licitación
                          </Button>
                          
                          {approval.decision === 'pending' && !isExpired(approval.expires_at) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApproval(approval)
                                    setComment('')
                                  }}
                                >
                                  Decidir
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Decisión de Aprobación</DialogTitle>
                                  <DialogDescription>
                                    {scopeLabels[approval.scope]} - {getItemInfo(approval)?.title}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  {approval.scope === 'apertura_tender' ? (
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Código:</strong><br />
                                        {approval.tenders?.code}
                                      </div>
                                      <div>
                                        <strong>Presupuesto:</strong><br />
                                        {approval.tenders && formatCurrency(approval.tenders.budget_rd)}
                                      </div>
                                      <div>
                                        <strong>Estado Actual:</strong><br />
                                        {approval.tenders?.status}
                                      </div>
                                      <div>
                                        <strong>Fecha Límite:</strong><br />
                                        {approval.tenders?.deadline && formatDate(approval.tenders.deadline)}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Licitación:</strong><br />
                                        {approval.proposals?.tenders.code}
                                      </div>
                                      <div>
                                        <strong>Presupuesto:</strong><br />
                                        {approval.proposals && formatCurrency(approval.proposals.tenders.budget_rd)}
                                      </div>
                                      <div>
                                        <strong>Propuesta:</strong><br />
                                        {approval.proposals && formatCurrency(approval.proposals.amount_rd)}
                                      </div>
                                      <div>
                                        <strong>Plazo:</strong><br />
                                        {approval.proposals?.delivery_months} meses
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <label className="text-sm font-medium">
                                      Comentarios (opcional):
                                    </label>
                                    <Textarea
                                      placeholder="Agrega comentarios sobre tu decisión..."
                                      value={comment}
                                      onChange={(e) => setComment(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>

                                <DialogFooter className="gap-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" disabled={loading}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Rechazar
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          ¿Rechazar {approval.scope === 'apertura_tender' ? 'licitación' : 'propuesta'}?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción rechazará {approval.scope === 'apertura_tender' ? 'la licitación y permanecerá en estado pendiente' : 'la propuesta'} y se notificará al sistema.
                                          Esta decisión no se puede revertir.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => selectedApproval && handleDecision(selectedApproval, 'rejected')}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Rechazar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>

                                  <Button
                                    onClick={() => selectedApproval && handleDecision(selectedApproval, 'approved')}
                                    disabled={loading}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Aprobar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}