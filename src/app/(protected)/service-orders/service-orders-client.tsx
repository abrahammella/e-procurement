'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, FileText, Edit, Trash2, Eye, Upload, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

interface ServiceOrder {
  id: string
  proposal_id: string
  po_number: string
  pdf_url: string | null
  status: 'emitida' | 'en_firma' | 'aprobada' | 'rechazada'
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
}

interface ServiceOrdersData {
  items: ServiceOrder[]
  total: number
}

interface ServiceOrdersClientProps {
  initialData: ServiceOrdersData
  userRole: string
}

const statusLabels = {
  emitida: 'Emitida',
  en_firma: 'En Firma',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

const statusColors = {
  emitida: 'bg-blue-100 text-blue-800',
  en_firma: 'bg-amber-100 text-amber-800',
  aprobada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
}

export default function ServiceOrdersClient({ 
  initialData, 
  userRole 
}: ServiceOrdersClientProps) {
  const [data, setData] = useState<ServiceOrdersData>(initialData)
  const [loading, setLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Form state
  const [formData, setFormData] = useState({
    proposal_id: '',
    po_number: '',
    pdf_url: '',
    status: 'emitida' as const
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
  const filteredData = data.items.filter(order => {
    const matchesSearch = order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.proposals.tenders.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.proposals.tenders.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Estadísticas
  const stats = {
    total: data.total,
    emitida: data.items.filter(o => o.status === 'emitida').length,
    en_firma: data.items.filter(o => o.status === 'en_firma').length,
    aprobada: data.items.filter(o => o.status === 'aprobada').length,
    rechazada: data.items.filter(o => o.status === 'rechazada').length,
  }

  // Manejar creación
  const handleCreate = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear orden de servicio')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: [result.data, ...prev.items],
        total: prev.total + 1
      }))

      toast({
        title: 'Orden creada',
        description: 'La orden de servicio ha sido creada exitosamente',
      })

      setIsCreateOpen(false)
      setFormData({
        proposal_id: '',
        po_number: '',
        pdf_url: '',
        status: 'emitida'
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear orden',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar actualización
  const handleUpdate = async () => {
    if (!selectedOrder) return

    try {
      setLoading(true)

      const response = await fetch('/api/service-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          ...formData
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar orden')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === selectedOrder.id ? { ...item, ...result.data } : item
        )
      }))

      toast({
        title: 'Orden actualizada',
        description: 'La orden de servicio ha sido actualizada exitosamente',
      })

      setIsEditOpen(false)
      setSelectedOrder(null)

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar orden',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de edición
  const openEditModal = (order: ServiceOrder) => {
    setSelectedOrder(order)
    setFormData({
      proposal_id: order.proposal_id,
      po_number: order.po_number,
      pdf_url: order.pdf_url || '',
      status: order.status
    })
    setIsEditOpen(true)
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
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Servicio</h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes de servicio para propuestas adjudicadas
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Orden de Servicio</DialogTitle>
              <DialogDescription>
                Crea una nueva orden de servicio para una propuesta adjudicada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">ID de Propuesta</label>
                <Input
                  placeholder="UUID de la propuesta adjudicada"
                  value={formData.proposal_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposal_id: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Número PO</label>
                <Input
                  placeholder="Ej: PO-2024-001"
                  value={formData.po_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, po_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL del PDF (opcional)</label>
                <Input
                  placeholder="https://..."
                  value={formData.pdf_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, pdf_url: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Orden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <CardTitle className="text-sm font-medium">Emitidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.emitida}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Firma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.en_firma}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aprobada}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rechazada}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número PO, licitación..."
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
                <SelectItem value="emitida">Emitida</SelectItem>
                <SelectItem value="en_firma">En Firma</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Órdenes de Servicio</CardTitle>
          <CardDescription>
            Órdenes de servicio generadas para propuestas adjudicadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número PO</TableHead>
                  <TableHead>Licitación</TableHead>
                  <TableHead>Propuesta</TableHead>
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
                        <p>No hay órdenes de servicio</p>
                        <p className="text-sm">
                          Las órdenes aparecerán aquí cuando se creen para propuestas adjudicadas
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.po_number}</div>
                        {order.pdf_url && (
                          <div className="text-sm text-muted-foreground">
                            <a 
                              href={order.pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              📄 Ver PDF
                            </a>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.proposals.tenders.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.proposals.tenders.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">
                            {formatCurrency(order.proposals.amount_rd)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.proposals.delivery_months} meses
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTender(order.proposals.tenders.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Licitación
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(order)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
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
            <DialogTitle>Editar Orden de Servicio</DialogTitle>
            <DialogDescription>
              Actualiza los datos de la orden de servicio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Número PO</label>
              <Input
                value={formData.po_number}
                onChange={(e) => setFormData(prev => ({ ...prev, po_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="en_firma">En Firma</SelectItem>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">URL del PDF</label>
              <Input
                value={formData.pdf_url}
                onChange={(e) => setFormData(prev => ({ ...prev, pdf_url: e.target.value }))}
              />
            </div>
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