'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, FileText, Edit, Trash2, Eye, Upload, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface Invoice {
  id: string
  proposal_id: string
  service_order_id: string | null
  invoice_url: string
  amount_rd: number
  status: 'recibida' | 'validada' | 'en_pago' | 'pagada' | 'rechazada'
  created_at: string
  proposals: {
    id: string
    amount_rd: number
    delivery_months: number
    status: string
    supplier_id: string
    tenders: {
      id: string
      code: string
      title: string
      status: string
      budget_rd: number
    }
  }
  service_orders: {
    id: string
    po_number: string
    status: string
  } | null
}

interface InvoicesData {
  items: Invoice[]
  total: number
}

interface InvoicesClientProps {
  initialData: InvoicesData
  userRole: string
  supplierId: string | null
}

const statusLabels = {
  recibida: 'Recibida',
  validada: 'Validada',
  en_pago: 'En Pago',
  pagada: 'Pagada',
  rechazada: 'Rechazada',
}

const statusColors = {
  recibida: 'bg-blue-100 text-blue-800',
  validada: 'bg-amber-100 text-amber-800',
  en_pago: 'bg-purple-100 text-purple-800',
  pagada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
}

export default function InvoicesClient({ 
  initialData, 
  userRole,
  supplierId
}: InvoicesClientProps) {
  const [data, setData] = useState<InvoicesData>(initialData)
  const [loading, setLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Form state
  const [formData, setFormData] = useState({
    proposal_id: '',
    service_order_id: '',
    invoice_url: '',
    amount_rd: '',
    status: 'recibida' as const
  })

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

  // Filtrar datos
  const filteredData = data.items.filter(invoice => {
    const matchesSearch = invoice.proposals.tenders.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.proposals.tenders.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.service_orders?.po_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Estadísticas
  const stats = {
    total: data.total,
    recibida: data.items.filter(i => i.status === 'recibida').length,
    validada: data.items.filter(i => i.status === 'validada').length,
    en_pago: data.items.filter(i => i.status === 'en_pago').length,
    pagada: data.items.filter(i => i.status === 'pagada').length,
    rechazada: data.items.filter(i => i.status === 'rechazada').length,
    totalAmount: data.items.reduce((sum, i) => sum + i.amount_rd, 0),
    paidAmount: data.items.filter(i => i.status === 'pagada').reduce((sum, i) => sum + i.amount_rd, 0),
  }

  // Manejar creación
  const handleCreate = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount_rd: parseFloat(formData.amount_rd),
          service_order_id: formData.service_order_id || undefined
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear factura')
      }

      // Actualizar datos locales (necesitaríamos refetch para obtener los joins)
      window.location.reload()

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear factura',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar actualización
  const handleUpdate = async () => {
    if (!selectedInvoice) return

    try {
      setLoading(true)

      const updatePayload: any = {
        id: selectedInvoice.id
      }

      // Solo incluir campos que han cambiado
      if (formData.invoice_url !== selectedInvoice.invoice_url) {
        updatePayload.invoice_url = formData.invoice_url
      }
      if (parseFloat(formData.amount_rd) !== selectedInvoice.amount_rd) {
        updatePayload.amount_rd = parseFloat(formData.amount_rd)
      }
      if (formData.status !== selectedInvoice.status) {
        updatePayload.status = formData.status
      }

      const response = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar factura')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === selectedInvoice.id ? { ...item, ...result.data } : item
        )
      }))

      toast({
        title: 'Factura actualizada',
        description: 'La factura ha sido actualizada exitosamente',
      })

      setIsEditOpen(false)
      setSelectedInvoice(null)

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar factura',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar eliminación
  const handleDelete = async (invoice: Invoice) => {
    try {
      setLoading(true)

      const response = await fetch('/api/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoice.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar factura')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== invoice.id),
        total: prev.total - 1
      }))

      toast({
        title: 'Factura eliminada',
        description: 'La factura ha sido eliminada exitosamente',
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar factura',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de edición
  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setFormData({
      proposal_id: invoice.proposal_id,
      service_order_id: invoice.service_order_id || '',
      invoice_url: invoice.invoice_url,
      amount_rd: invoice.amount_rd.toString(),
      status: invoice.status
    })
    setIsEditOpen(true)
  }

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      proposal_id: '',
      service_order_id: '',
      invoice_url: '',
      amount_rd: '',
      status: 'recibida'
    })
  }

  // Ver tender
  const handleViewTender = (tenderId: string) => {
    window.open(`/tenders/${tenderId}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">
            {userRole === 'admin' 
              ? 'Gestiona todas las facturas del sistema'
              : 'Gestiona las facturas de tus propuestas adjudicadas'
            }
          </p>
        </div>
        {userRole === 'supplier' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Factura</DialogTitle>
                <DialogDescription>
                  Crea una nueva factura para una propuesta adjudicada
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>ID de Propuesta</Label>
                  <Input
                    placeholder="UUID de la propuesta adjudicada"
                    value={formData.proposal_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposal_id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>ID Orden de Servicio (opcional)</Label>
                  <Input
                    placeholder="UUID de la orden de servicio"
                    value={formData.service_order_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_order_id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>URL de la Factura</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.invoice_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_url: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Monto (RD$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount_rd}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_rd: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsCreateOpen(false); clearForm() }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Factura'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.pagada}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.paidAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.recibida + stats.validada + stats.en_pago}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por licitación, código, PO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="recibida">Recibida</SelectItem>
                <SelectItem value="validada">Validada</SelectItem>
                <SelectItem value="en_pago">En Pago</SelectItem>
                <SelectItem value="pagada">Pagada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de facturas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Facturas</CardTitle>
          <CardDescription>
            Facturas generadas para propuestas adjudicadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Licitación</TableHead>
                  <TableHead>Orden PO</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <FileText className="mx-auto h-8 w-8 mb-2" />
                        <p>No hay facturas</p>
                        <p className="text-sm">
                          Las facturas aparecerán aquí cuando se creen
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.proposals.tenders.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.proposals.tenders.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.service_orders ? (
                          <div className="font-medium">{invoice.service_orders.po_number}</div>
                        ) : (
                          <span className="text-muted-foreground">Sin orden</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatCurrency(invoice.amount_rd)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <a 
                            href={invoice.invoice_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            📄 Ver factura
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invoice.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTender(invoice.proposals.tenders.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Licitación
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(invoice)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          {invoice.status === 'recibida' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará permanentemente la factura.
                                    Solo se pueden eliminar facturas en estado "Recibida".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(invoice)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Modal de Edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Factura</DialogTitle>
            <DialogDescription>
              Actualiza los datos de la factura
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {userRole === 'supplier' && (
              <>
                <div>
                  <Label>URL de la Factura</Label>
                  <Input
                    value={formData.invoice_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_url: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Monto (RD$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount_rd}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_rd: e.target.value }))}
                  />
                </div>
              </>
            )}
            {userRole === 'admin' && (
              <div>
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recibida">Recibida</SelectItem>
                    <SelectItem value="validada">Validada</SelectItem>
                    <SelectItem value="en_pago">En Pago</SelectItem>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}