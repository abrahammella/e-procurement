'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, FileText, Edit, Trash2, Eye, Upload, Download, Search, Filter, Tag, Calendar } from 'lucide-react'
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

interface RfpDoc {
  id: string
  tender_id: string
  title: string
  description: string | null
  file_url: string
  required_fields: string[]
  is_mandatory: boolean
  created_at: string
  tenders: {
    id: string
    code: string
    title: string
    status: string
    budget_rd: number
    deadline: string
  }
}

interface RfpData {
  items: RfpDoc[]
  total: number
}

interface Tender {
  id: string
  code: string
  title: string
  status: string
  budget_rd: number
  deadline: string
}

interface RfpClientProps {
  initialData: RfpData
  availableTenders: Tender[]
  userRole: string
}

const predefinedFields = [
  'Experiencia técnica',
  'Referencias comerciales',
  'Estados financieros',
  'Propuesta económica',
  'Plan de trabajo',
  'Cronograma',
  'Recursos humanos',
  'Certificaciones',
  'Póliza de seguros',
  'Garantía de cumplimiento'
]

export default function RfpClient({ 
  initialData, 
  availableTenders,
  userRole 
}: RfpClientProps) {
  const [data, setData] = useState<RfpData>(initialData)
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRfp, setSelectedRfp] = useState<RfpDoc | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tenderFilter, setTenderFilter] = useState<string>('all')
  const [mandatoryFilter, setMandatoryFilter] = useState<string>('all')
  
  // Form state
  const [formData, setFormData] = useState({
    tender_id: '',
    title: '',
    description: '',
    file_url: '',
    required_fields: [] as string[],
    is_mandatory: true
  })
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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

  // Subir archivo a Supabase Storage
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'docs')
    formData.append('folder', 'rfp')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al subir archivo')
    }

    const result = await response.json()
    return result.data.path
  }

  // Filtrar datos
  const filteredData = data.items.filter(rfp => {
    const matchesSearch = rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfp.tenders.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfp.tenders.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rfp.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTender = tenderFilter === 'all' || rfp.tender_id === tenderFilter
    const matchesMandatory = mandatoryFilter === 'all' || 
                            (mandatoryFilter === 'mandatory' && rfp.is_mandatory) ||
                            (mandatoryFilter === 'optional' && !rfp.is_mandatory)
    
    return matchesSearch && matchesTender && matchesMandatory
  })

  // Estadísticas
  const stats = {
    total: data.total,
    mandatory: data.items.filter(r => r.is_mandatory).length,
    optional: data.items.filter(r => !r.is_mandatory).length,
    uniqueTenders: new Set(data.items.map(r => r.tender_id)).size,
  }

  // Manejar creación
  const handleCreate = async () => {
    try {
      setLoading(true)

      let fileUrl = formData.file_url

      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        setUploadLoading(true)
        fileUrl = await uploadFile(selectedFile)
        setUploadLoading(false)
      }

      if (!fileUrl) {
        throw new Error('URL de archivo requerida')
      }

      const response = await fetch('/api/rfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          file_url: fileUrl
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear documento RFP')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: [result.data, ...prev.items],
        total: prev.total + 1
      }))

      toast({
        title: 'Documento RFP creado',
        description: 'El documento ha sido creado exitosamente',
      })

      setIsCreateOpen(false)
      clearForm()

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear documento',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setUploadLoading(false)
    }
  }

  // Manejar actualización
  const handleUpdate = async () => {
    if (!selectedRfp) return

    try {
      setLoading(true)

      let fileUrl = formData.file_url

      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        setUploadLoading(true)
        fileUrl = await uploadFile(selectedFile)
        setUploadLoading(false)
      }

      const response = await fetch('/api/rfp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRfp.id,
          title: formData.title,
          description: formData.description || null,
          file_url: fileUrl,
          required_fields: formData.required_fields,
          is_mandatory: formData.is_mandatory
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar documento')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === selectedRfp.id ? { ...item, ...result.data } : item
        )
      }))

      toast({
        title: 'Documento actualizado',
        description: 'El documento ha sido actualizado exitosamente',
      })

      setIsEditOpen(false)
      setSelectedRfp(null)
      clearForm()

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar documento',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setUploadLoading(false)
    }
  }

  // Manejar eliminación
  const handleDelete = async (rfp: RfpDoc) => {
    try {
      setLoading(true)

      const response = await fetch('/api/rfp', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rfp.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar documento')
      }

      // Actualizar datos locales
      setData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== rfp.id),
        total: prev.total - 1
      }))

      toast({
        title: 'Documento eliminado',
        description: 'El documento ha sido eliminado exitosamente',
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar documento',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de edición
  const openEditModal = (rfp: RfpDoc) => {
    setSelectedRfp(rfp)
    setFormData({
      tender_id: rfp.tender_id,
      title: rfp.title,
      description: rfp.description || '',
      file_url: rfp.file_url,
      required_fields: rfp.required_fields,
      is_mandatory: rfp.is_mandatory
    })
    setSelectedFile(null)
    setIsEditOpen(true)
  }

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      tender_id: '',
      title: '',
      description: '',
      file_url: '',
      required_fields: [],
      is_mandatory: true
    })
    setSelectedFile(null)
  }

  // Manejar cambio de campos requeridos
  const handleRequiredFieldChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      required_fields: checked 
        ? [...prev.required_fields, field]
        : prev.required_fields.filter(f => f !== field)
    }))
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
          <h1 className="text-3xl font-bold tracking-tight">Documentos RFP</h1>
          <p className="text-muted-foreground">
            {userRole === 'admin' 
              ? 'Gestiona los documentos de solicitud de propuestas'
              : 'Consulta los documentos RFP disponibles'
            }
          </p>
        </div>
        {userRole === 'admin' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo RFP
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Documento RFP</DialogTitle>
                <DialogDescription>
                  Crea un nuevo documento de solicitud de propuestas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label>Licitación</Label>
                  <Select value={formData.tender_id} onValueChange={(value) => setFormData(prev => ({ ...prev, tender_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar licitación" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTenders.map((tender) => (
                        <SelectItem key={tender.id} value={tender.id}>
                          {tender.code} - {tender.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título del Documento</Label>
                  <Input
                    placeholder="Ej: Especificaciones Técnicas"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    placeholder="Descripción del documento..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Archivo</Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <div className="text-sm text-muted-foreground">
                      O proporciona una URL directa:
                    </div>
                    <Input
                      placeholder="https://..."
                      value={formData.file_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_mandatory"
                    checked={formData.is_mandatory}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_mandatory: !!checked }))}
                  />
                  <Label htmlFor="is_mandatory">Documento obligatorio</Label>
                </div>
                <div>
                  <Label>Campos Requeridos en Propuestas</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                    {predefinedFields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={field}
                          checked={formData.required_fields.includes(field)}
                          onCheckedChange={(checked) => handleRequiredFieldChange(field, !!checked)}
                        />
                        <Label htmlFor={field} className="text-sm">{field}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsCreateOpen(false); clearForm() }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={loading || uploadLoading}>
                  {uploadLoading ? 'Subiendo...' : loading ? 'Creando...' : 'Crear RFP'}
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
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obligatorios</CardTitle>
            <Tag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.mandatory}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opcionales</CardTitle>
            <Tag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.optional}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licitaciones</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueTenders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={tenderFilter} onValueChange={setTenderFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por licitación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las licitaciones</SelectItem>
                {availableTenders.map((tender) => (
                  <SelectItem key={tender.id} value={tender.id}>
                    {tender.code} - {tender.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mandatoryFilter} onValueChange={setMandatoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mandatory">Obligatorios</SelectItem>
                <SelectItem value="optional">Opcionales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Documentos RFP</CardTitle>
          <CardDescription>
            Documentos de solicitud de propuestas organizados por licitación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Licitación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Campos Requeridos</TableHead>
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
                        <p>No hay documentos RFP</p>
                        <p className="text-sm">
                          Los documentos aparecerán aquí cuando se creen
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((rfp) => (
                    <TableRow key={rfp.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rfp.title}</div>
                          {rfp.description && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {rfp.description}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground mt-1">
                            <a 
                              href={rfp.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center"
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Descargar documento
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rfp.tenders.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {rfp.tenders.code} • {formatCurrency(rfp.tenders.budget_rd)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rfp.is_mandatory ? "destructive" : "secondary"}>
                          {rfp.is_mandatory ? "Obligatorio" : "Opcional"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {rfp.required_fields.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Ninguno</span>
                          ) : (
                            rfp.required_fields.slice(0, 3).map((field) => (
                              <Badge key={field} variant="outline" className="mr-1 text-xs">
                                {field}
                              </Badge>
                            ))
                          )}
                          {rfp.required_fields.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{rfp.required_fields.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(rfp.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTender(rfp.tenders.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Licitación
                          </Button>
                          {userRole === 'admin' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(rfp)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar documento RFP?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente el documento RFP.
                                      Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(rfp)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
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
            <DialogTitle>Editar Documento RFP</DialogTitle>
            <DialogDescription>
              Actualiza la información del documento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label>Título del Documento</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Archivo</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className="text-sm text-muted-foreground">
                  Archivo actual: <a href={formData.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Ver archivo</a>
                </div>
                <div className="text-sm text-muted-foreground">
                  O actualiza la URL:
                </div>
                <Input
                  value={formData.file_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_mandatory: !!checked }))}
              />
              <Label htmlFor="edit_is_mandatory">Documento obligatorio</Label>
            </div>
            <div>
              <Label>Campos Requeridos en Propuestas</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {predefinedFields.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit_${field}`}
                      checked={formData.required_fields.includes(field)}
                      onCheckedChange={(checked) => handleRequiredFieldChange(field, !!checked)}
                    />
                    <Label htmlFor={`edit_${field}`} className="text-sm">{field}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading || uploadLoading}>
              {uploadLoading ? 'Subiendo...' : loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}