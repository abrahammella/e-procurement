'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  Mail,
  Calendar,
  Award,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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

interface Supplier {
  id: string
  name: string
  rnc: string | null
  status: 'activo' | 'inactivo' | 'suspendido'
  certified: boolean
  certifications: string[]
  experience_years: number
  support_months: number
  contact_email: string | null
  created_at: string
  totalProposals?: number
  activeProposals?: number
}

interface SuppliersData {
  items: Supplier[]
  total: number
}

interface SuppliersClientProps {
  initialData: SuppliersData
  userRole: string
}

const statusLabels = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  suspendido: 'Suspendido',
}

const statusColors = {
  activo: 'bg-green-100 text-green-800',
  inactivo: 'bg-gray-100 text-gray-800',
  suspendido: 'bg-red-100 text-red-800',
}

const predefinedCertifications = [
  'ISO 9001',
  'ISO 14001',
  'ISO 45001',
  'SOC 2',
  'ITIL',
  'PMP',
  'COBIT',
  'Gobierno Digital',
  'Seguridad Informática',
  'Desarrollo de Software'
]

export default function SuppliersClient({ 
  initialData, 
  userRole 
}: SuppliersClientProps) {
  const [data, setData] = useState<SuppliersData>(initialData)
  const [loading, setLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [certifiedFilter, setCertifiedFilter] = useState<string>('all')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rnc: '',
    status: 'activo' as const,
    certified: false,
    certifications: [] as string[],
    experience_years: 0,
    support_months: 0,
    contact_email: ''
  })

  const { toast } = useToast()

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  // Filtrar datos
  const filteredData = data.items.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.rnc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.contact_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
    const matchesCertified = certifiedFilter === 'all' || 
                            (certifiedFilter === 'certified' && supplier.certified) ||
                            (certifiedFilter === 'not_certified' && !supplier.certified)
    
    return matchesSearch && matchesStatus && matchesCertified
  })

  // Estadísticas
  const stats = {
    total: data.total,
    activo: data.items.filter(s => s.status === 'activo').length,
    certified: data.items.filter(s => s.certified).length,
    withProposals: data.items.filter(s => (s.totalProposals || 0) > 0).length,
    avgExperience: data.items.length > 0 
      ? Math.round(data.items.reduce((sum, s) => sum + s.experience_years, 0) / data.items.length)
      : 0,
  }

  // Manejar creación
  const handleCreate = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rnc: formData.rnc || null,
          contact_email: formData.contact_email || null
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear proveedor')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: [{ ...result.data, totalProposals: 0, activeProposals: 0 }, ...prev.items],
        total: prev.total + 1
      }))

      toast({
        title: 'Proveedor creado',
        description: 'El proveedor ha sido creado exitosamente',
      })

      setIsCreateOpen(false)
      clearForm()

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear proveedor',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar actualización
  const handleUpdate = async () => {
    if (!selectedSupplier) return

    try {
      setLoading(true)

      const response = await fetch('/api/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSupplier.id,
          ...formData,
          rnc: formData.rnc || null,
          contact_email: formData.contact_email || null
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar proveedor')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === selectedSupplier.id 
            ? { ...item, ...result.data }
            : item
        )
      }))

      toast({
        title: 'Proveedor actualizado',
        description: 'El proveedor ha sido actualizado exitosamente',
      })

      setIsEditOpen(false)
      setSelectedSupplier(null)
      clearForm()

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar proveedor',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar eliminación
  const handleDelete = async (supplier: Supplier) => {
    try {
      setLoading(true)

      const response = await fetch('/api/suppliers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: supplier.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar proveedor')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== supplier.id),
        total: prev.total - 1
      }))

      toast({
        title: 'Proveedor eliminado',
        description: 'El proveedor ha sido eliminado exitosamente',
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar proveedor',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de edición
  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      rnc: supplier.rnc || '',
      status: supplier.status,
      certified: supplier.certified,
      certifications: supplier.certifications,
      experience_years: supplier.experience_years,
      support_months: supplier.support_months,
      contact_email: supplier.contact_email || ''
    })
    setIsEditOpen(true)
  }

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      name: '',
      rnc: '',
      status: 'activo',
      certified: false,
      certifications: [],
      experience_years: 0,
      support_months: 0,
      contact_email: ''
    })
  }

  // Manejar cambio de certificaciones
  const handleCertificationChange = (certification: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      certifications: checked 
        ? [...prev.certifications, certification]
        : prev.certifications.filter(c => c !== certification)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Proveedores</h1>
          <p className="text-muted-foreground">
            Administra los proveedores registrados en el sistema
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Proveedor</DialogTitle>
              <DialogDescription>
                Registra un nuevo proveedor en el sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre de la Empresa *</Label>
                  <Input
                    placeholder="Ej: Tecnología Digital S.A."
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>RNC</Label>
                  <Input
                    placeholder="Ej: 101-12345-6"
                    value={formData.rnc}
                    onChange={(e) => setFormData(prev => ({ ...prev, rnc: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Email de Contacto</Label>
                <Input
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Estado</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="suspendido">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Años de Experiencia</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Meses de Soporte</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.support_months}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_months: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certified"
                  checked={formData.certified}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, certified: !!checked }))}
                />
                <Label htmlFor="certified">Proveedor Certificado</Label>
              </div>
              <div>
                <Label>Certificaciones</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {predefinedCertifications.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert}
                        checked={formData.certifications.includes(cert)}
                        onCheckedChange={(checked) => handleCertificationChange(cert, !!checked)}
                      />
                      <Label htmlFor={cert} className="text-sm">{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); clearForm() }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Proveedor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activo}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificados</CardTitle>
            <Award className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.certified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Propuestas</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.withProposals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experiencia Promedio</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.avgExperience} años</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, RNC o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={certifiedFilter} onValueChange={setCertifiedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por certificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="certified">Certificados</SelectItem>
                <SelectItem value="not_certified">No Certificados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de proveedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Proveedores registrados en el sistema con sus estadísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Experiencia</TableHead>
                  <TableHead>Certificaciones</TableHead>
                  <TableHead>Propuestas</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Building2 className="mx-auto h-8 w-8 mb-2" />
                        <p>No hay proveedores</p>
                        <p className="text-sm">
                          Los proveedores aparecerán aquí cuando se registren
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.rnc && `RNC: ${supplier.rnc}`}
                          </div>
                          {supplier.contact_email && (
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <Mail className="mr-1 h-3 w-3" />
                              {supplier.contact_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[supplier.status]}>
                            {statusLabels[supplier.status]}
                          </Badge>
                          {supplier.certified && (
                            <Badge variant="outline" className="text-blue-600">
                              <Award className="mr-1 h-3 w-3" />
                              Certificado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{supplier.experience_years} años</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.support_months} meses soporte
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.certifications.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Ninguna</span>
                          ) : (
                            <>
                              {supplier.certifications.slice(0, 2).map((cert) => (
                                <Badge key={cert} variant="outline" className="mr-1 text-xs">
                                  {cert}
                                </Badge>
                              ))}
                              {supplier.certifications.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{supplier.certifications.length - 2} más
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{supplier.totalProposals || 0} total</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.activeProposals || 0} activas
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(supplier.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(supplier)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          {(supplier.totalProposals || 0) === 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará permanentemente el proveedor.
                                    Solo se pueden eliminar proveedores sin propuestas asociadas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(supplier)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {(supplier.totalProposals || 0) > 0 && (
                            <Button variant="outline" size="sm" disabled>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Tiene propuestas
                            </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>
              Actualiza la información del proveedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre de la Empresa</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>RNC</Label>
                <Input
                  value={formData.rnc}
                  onChange={(e) => setFormData(prev => ({ ...prev, rnc: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Email de Contacto</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Años de Experiencia</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Meses de Soporte</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.support_months}
                  onChange={(e) => setFormData(prev => ({ ...prev, support_months: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_certified"
                checked={formData.certified}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, certified: !!checked }))}
              />
              <Label htmlFor="edit_certified">Proveedor Certificado</Label>
            </div>
            <div>
              <Label>Certificaciones</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {predefinedCertifications.map((cert) => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit_${cert}`}
                      checked={formData.certifications.includes(cert)}
                      onCheckedChange={(checked) => handleCertificationChange(cert, !!checked)}
                    />
                    <Label htmlFor={`edit_${cert}`} className="text-sm">{cert}</Label>
                  </div>
                ))}
              </div>
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