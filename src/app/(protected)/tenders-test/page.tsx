'use client'

import React, { useState, useEffect } from 'react'
import { AuthenticatedRouteGuard } from '@/components/auth/RouteGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface Tender {
  id: string
  code: string
  title: string
  description?: string
  status: 'abierto' | 'en_evaluacion' | 'cerrado' | 'adjudicado'
  budget_rd: number
  delivery_max_months: number
  deadline: string
  created_at: string
  created_by: string
}

interface TenderFormData {
  code: string
  title: string
  description: string
  budget_rd: string
  delivery_max_months: string
  deadline: string
  status?: 'abierto' | 'en_evaluacion' | 'cerrado' | 'adjudicado'
}

function TendersTestPageContent() {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTender, setEditingTender] = useState<Tender | null>(null)
  const [formData, setFormData] = useState<TenderFormData>({
    code: '',
    title: '',
    description: '',
    budget_rd: '',
    delivery_max_months: '',
    deadline: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Load tenders
  const loadTenders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchTerm) params.set('q', searchTerm)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '50')
      params.set('orderBy', 'created_at')
      params.set('orderDir', 'desc')

      const response = await fetch(`/api/tenders?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar licitaciones')
      }

      setTenders(result.data.items || [])
    } catch (err) {
      console.error('❌ Error loading tenders:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Create tender
  const handleCreate = async () => {
    if (!formData.code || !formData.title || !formData.budget_rd || !formData.delivery_max_months || !formData.deadline) {
      setError('Todos los campos son requeridos')
      return
    }

    try {
      setFormLoading(true)
      setError(null)

      const payload = {
        code: formData.code,
        title: formData.title,
        description: formData.description || undefined,
        budget_rd: parseFloat(formData.budget_rd),
        delivery_max_months: parseInt(formData.delivery_max_months),
        deadline: formData.deadline
      }

      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear licitación')
      }

      setSuccess(`Licitación creada exitosamente: ${formData.code}`)
      setShowCreateForm(false)
      resetForm()
      loadTenders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setFormLoading(false)
    }
  }

  // Update tender
  const handleUpdate = async () => {
    if (!editingTender) return

    try {
      setFormLoading(true)
      setError(null)

      const payload: any = { id: editingTender.id }
      
      if (formData.code !== editingTender.code) payload.code = formData.code
      if (formData.title !== editingTender.title) payload.title = formData.title
      if (formData.description !== (editingTender.description || '')) payload.description = formData.description
      if (parseFloat(formData.budget_rd) !== editingTender.budget_rd) payload.budget_rd = parseFloat(formData.budget_rd)
      if (parseInt(formData.delivery_max_months) !== editingTender.delivery_max_months) payload.delivery_max_months = parseInt(formData.delivery_max_months)
      if (formData.deadline !== editingTender.deadline) payload.deadline = formData.deadline
      if (formData.status && formData.status !== editingTender.status) payload.status = formData.status

      const response = await fetch('/api/tenders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar licitación')
      }

      setSuccess(`Licitación actualizada exitosamente: ${formData.code}`)
      setEditingTender(null)
      resetForm()
      loadTenders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setFormLoading(false)
    }
  }

  // Delete tender
  const handleDelete = async (tender: Tender) => {
    if (!confirm(`¿Estás seguro de eliminar la licitación "${tender.code}"?`)) {
      return
    }

    try {
      const response = await fetch('/api/tenders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tender.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar licitación')
      }

      setSuccess(`Licitación eliminada: ${tender.code}`)
      loadTenders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      budget_rd: '',
      delivery_max_months: '',
      deadline: ''
    })
  }

  const startEdit = (tender: Tender) => {
    setEditingTender(tender)
    setFormData({
      code: tender.code,
      title: tender.title,
      description: tender.description || '',
      budget_rd: tender.budget_rd.toString(),
      delivery_max_months: tender.delivery_max_months.toString(),
      deadline: tender.deadline.split('T')[0], // Format for date input
      status: tender.status
    })
  }

  const cancelEdit = () => {
    setEditingTender(null)
    setShowCreateForm(false)
    resetForm()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'abierto': return 'default'
      case 'en_evaluacion': return 'secondary'
      case 'cerrado': return 'outline'
      case 'adjudicado': return 'secondary'
      default: return 'outline'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO')
  }

  // Load data on component mount
  useEffect(() => {
    loadTenders()
  }, [])

  // Reload when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTenders()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prueba de API Tenders</h1>
            <p className="text-gray-600 mt-2">
              Interfaz para probar todas las funciones del API de licitaciones
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Licitación
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="border-green-200 bg-green-50 mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por código o título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="abierto">Abierto</option>
                  <option value="en_evaluacion">En Evaluación</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="adjudicado">Adjudicado</option>
                </select>
              </div>
              <Button variant="outline" onClick={loadTenders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Form */}
        {(showCreateForm || editingTender) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingTender ? 'Editar Licitación' : 'Nueva Licitación'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código*</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="LIC-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Compra de equipos IT"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_rd">Presupuesto (RD$)*</Label>
                  <Input
                    id="budget_rd"
                    type="number"
                    value={formData.budget_rd}
                    onChange={(e) => setFormData({ ...formData, budget_rd: e.target.value })}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_max_months">Meses de Entrega*</Label>
                  <Input
                    id="delivery_max_months"
                    type="number"
                    value={formData.delivery_max_months}
                    onChange={(e) => setFormData({ ...formData, delivery_max_months: e.target.value })}
                    placeholder="6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Fecha Límite*</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                {editingTender && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="abierto">Abierto</option>
                      <option value="en_evaluacion">En Evaluación</option>
                      <option value="cerrado">Cerrado</option>
                      <option value="adjudicado">Adjudicado</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada de la licitación..."
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={editingTender ? handleUpdate : handleCreate}
                  disabled={formLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {editingTender ? 'Actualizar' : 'Crear'}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tenders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Licitaciones ({tenders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Cargando licitaciones...</p>
              </div>
            ) : tenders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay licitaciones para mostrar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tenders.map((tender) => (
                  <div key={tender.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{tender.code}</h3>
                          <Badge variant={getStatusBadgeVariant(tender.status)}>
                            {tender.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-gray-900 mb-2">{tender.title}</p>
                        {tender.description && (
                          <p className="text-gray-600 mb-3 text-sm">{tender.description}</p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(tender.budget_rd)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {tender.delivery_max_months} meses
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(tender.deadline)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(tender)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(tender)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TendersTestPage() {
  return (
    <AuthenticatedRouteGuard>
      <TendersTestPageContent />
    </AuthenticatedRouteGuard>
  )
}