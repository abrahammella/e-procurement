'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, FileText, Loader2, PlusCircle, Search, Trash2, Edit, MoreHorizontal, Eye, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import ActionButtons from './action-buttons'
import SimpleRfpIndicator from './simple-rfp-indicator'

// Zod schema para validación del formulario
const tenderFormSchema = z.object({
  code: z.string().trim().min(1, 'El código es requerido'),
  title: z.string().trim().min(1, 'El título es requerido'),
  description: z.string().optional(),
  budget_rd: z.string()
    .min(1, 'El presupuesto es requerido')
    .transform((val) => parseFloat(val.replace(/,/g, '')))
    .refine((val) => !isNaN(val) && val > 0, 'El presupuesto debe ser mayor a 0'),
  delivery_max_months: z.string()
    .min(1, 'Los meses de entrega son requeridos')
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val) && val > 0 && Number.isInteger(val), 'Debe ser un número entero positivo'),
  deadline: z.date({
    required_error: 'La fecha de cierre es requerida',
  }).refine(
    (date) => date > new Date(),
    'La fecha de cierre debe ser futura'
  ),
})

type TenderFormValues = z.infer<typeof tenderFormSchema>

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
  rfp_path?: string
}

interface TendersData {
  items: Tender[]
  total: number
}

interface TendersClientProps {
  initialData: TendersData
  isAdmin: boolean
  isSupplier: boolean
  supplierId: string | null
}

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'abierto', label: 'Abierto' },
  { value: 'en_evaluacion', label: 'En Evaluación' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'adjudicado', label: 'Adjudicado' },
]

const statusColors = {
  abierto: 'bg-green-100 text-green-800',
  en_evaluacion: 'bg-amber-100 text-amber-800',
  cerrado: 'bg-gray-100 text-gray-800',
  adjudicado: 'bg-blue-100 text-blue-800',
}

export default function TendersClient({ initialData, isAdmin, isSupplier, supplierId }: TendersClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<TendersData>(initialData)
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTender, setEditingTender] = useState<Tender | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    tender: Tender | null
    newStatus: string | null
    open: boolean
  }>({ tender: null, newStatus: null, open: false })
  const [viewMode, setViewMode] = useState(false)
  const [proposalsByTender, setProposalsByTender] = useState<Record<string, boolean>>({})
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [limit] = useState(10)
  const [offset, setOffset] = useState(0)

  const form = useForm<TenderFormValues>({
    resolver: zodResolver(tenderFormSchema),
    defaultValues: {
      code: '',
      title: '',
      description: '',
      budget_rd: '' as any,
      delivery_max_months: '' as any,
      deadline: undefined,
    },
  })

  // Cargar datos con filtros
  async function loadTenders() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('q', searchQuery)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())
      params.append('orderBy', 'created_at')
      params.append('orderDir', 'desc')

      const response = await fetch(`/api/tenders?${params}`)
      const result = await response.json()

      if (result.ok) {
        setData(result.data)
      } else {
        console.error('Error loading tenders:', result)
        toast({
          title: 'Error',
          description: result.error || 'Error al cargar licitaciones',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar propuestas existentes del supplier si es supplier
  async function loadSupplierProposals() {
    if (!isSupplier || !supplierId) return
    
    try {
      const response = await fetch('/api/proposals')
      const result = await response.json()
      
      if (result.ok) {
        const proposals = result.data.items
        const proposalsMap: Record<string, boolean> = {}
        proposals.forEach((proposal: any) => {
          proposalsMap[proposal.tender_id] = true
        })
        setProposalsByTender(proposalsMap)
      }
    } catch (error) {
      console.error('Error loading supplier proposals:', error)
    }
  }

  // Recargar cuando cambien los filtros
  useEffect(() => {
    loadTenders()
    if (isSupplier) {
      loadSupplierProposals()
    }
  }, [statusFilter, searchQuery, offset, isSupplier])

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

  // Abrir diálogo para nuevo/editar/ver
  const openDialog = (tender?: Tender, isViewOnly = false) => {
    setViewMode(isViewOnly)
    
    if (tender) {
      setEditingTender(tender)
      form.reset({
        code: tender.code,
        title: tender.title,
        description: tender.description || '',
        budget_rd: tender.budget_rd.toString() as any,
        delivery_max_months: tender.delivery_max_months.toString() as any,
        deadline: new Date(tender.deadline),
      })
    } else {
      setEditingTender(null)
      form.reset({
        code: '',
        title: '',
        description: '',
        budget_rd: '' as any,
        delivery_max_months: '' as any,
        deadline: undefined,
      })
    }
    setSelectedFile(null)
    setUploadProgress(0)
    setIsDialogOpen(true)
  }

  // Manejar envío del formulario
  async function onSubmit(values: TenderFormValues) {
    try {
      setLoading(true)
      
      // Preparar datos para enviar
      const payload = {
        ...values,
        deadline: values.deadline.toISOString(),
      }

      // Si estamos editando, incluir el ID
      if (editingTender) {
        Object.assign(payload, { id: editingTender.id })
      }

      // POST o PATCH según corresponda
      const response = await fetch('/api/tenders', {
        method: editingTender ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        // Manejar error específico de código duplicado
        if (response.status === 409) {
          form.setError('code', {
            type: 'manual',
            message: 'Ya existe una licitación con este código',
          })
          return
        }
        throw new Error(result.error || 'Error al guardar')
      }

      // Si hay archivo PDF, subirlo directamente desde el cliente
      if (selectedFile && result.data?.id) {
        setUploadProgress(20)
        
        try {
          // Importar cliente de Supabase
          const { supabase } = await import('@/lib/supabase')
          
          // Generar nombre único
          const timestamp = Date.now()
          const fileName = `rfps/${timestamp}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          
          setUploadProgress(50)
          
          // Subir archivo directamente desde el cliente
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('docs')
            .upload(fileName, selectedFile, {
              contentType: 'application/pdf',
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            throw new Error(`Error al subir: ${uploadError.message}`)
          }

          setUploadProgress(80)
          
          // Actualizar el tender con el path del archivo
          const updateResponse = await fetch('/api/tenders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: result.data.id,
              rfp_path: uploadData.path,
            }),
          })
          
          if (updateResponse.ok) {
            setUploadProgress(100)
            toast({
              title: 'Éxito',
              description: 'Licitación y documento RFP guardados correctamente',
            })
          } else {
            toast({
              title: 'Advertencia', 
              description: 'Licitación creada, archivo subido, pero error al asociar el documento',
              variant: 'destructive',
            })
          }
        } catch (error) {
          toast({
            title: 'Error en subida',
            description: `Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            variant: 'destructive',
          })
        }
      }

      toast({
        title: 'Éxito',
        description: editingTender ? 'Licitación actualizada' : 'Licitación creada',
      })

      setIsDialogOpen(false)
      router.refresh()
      loadTenders()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Eliminar licitación
  async function handleDelete(id: string) {
    try {
      setLoading(true)
      
      const response = await fetch('/api/tenders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar')
      }

      toast({
        title: 'Éxito',
        description: 'Licitación eliminada correctamente',
      })

      router.refresh()
      loadTenders()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setDeleteConfirmId(null)
    }
  }

  // Ver documento RFP
  async function viewRfpDocument(rfpPath: string) {
    try {
      const response = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: rfpPath }),
      })

      const result = await response.json()

      if (response.ok && result.signedUrl) {
        window.open(result.signedUrl, '_blank')
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo obtener el documento',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al obtener el documento',
        variant: 'destructive',
      })
    }
  }

  // Ver detalles de licitación
  function viewTender(tender: Tender) {
    openDialog(tender, true) // true indica modo solo lectura
  }

  // Cambiar estado de licitación
  async function changeStatus(tender: Tender, newStatus: string) {
    try {
      setLoading(true)
      
      const response = await fetch('/api/tenders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tender.id,
          status: newStatus,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cambiar estado')
      }

      toast({
        title: 'Estado actualizado',
        description: `Licitación "${tender.title}" cambiada a ${newStatus}`,
      })

      setStatusChangeDialog({ tender: null, newStatus: null, open: false })
      router.refresh()
      loadTenders()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cambiar estado',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Abrir diálogo para cambio de estado
  function openStatusChange(tender: Tender, newStatus: string) {
    setStatusChangeDialog({
      tender,
      newStatus,
      open: true
    })
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Licitaciones</h1>
        <p className="text-muted-foreground">
          Gestiona las licitaciones del sistema
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {isAdmin && (
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                setViewMode(false) // Reset view mode al cerrar
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Licitación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {viewMode 
                    ? 'Detalles de la Licitación'
                    : editingTender 
                      ? 'Editar Licitación' 
                      : 'Nueva Licitación'
                  }
                </DialogTitle>
                <DialogDescription>
                  {viewMode
                    ? 'Información detallada de la licitación seleccionada'
                    : editingTender 
                      ? 'Modifica los datos de la licitación existente' 
                      : 'Completa los datos para crear una nueva licitación'
                  }
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="LIC-2024-001" disabled={viewMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Título de la Licitación" disabled={viewMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Mostrar estado actual en modo vista */}
                  {viewMode && editingTender && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-medium">Estado Actual</Label>
                      <div className="mt-1">
                        <Badge className={statusColors[editingTender.status]}>
                          {editingTender.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Descripción detallada de la licitación"
                            rows={3}
                            disabled={viewMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budget_rd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Presupuesto (RD$)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="text"
                              placeholder="1,000,000"
                              disabled={viewMode}
                              onChange={(e) => {
                                // Permitir solo números y comas
                                const value = e.target.value.replace(/[^\d,]/g, '')
                                field.onChange(value)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="delivery_max_months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plazo máximo (meses)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              placeholder="6"
                              min="1"
                              step="1"
                              disabled={viewMode}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de cierre</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                disabled={viewMode}
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date <= new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          La fecha debe ser posterior al día de hoy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Upload de archivo PDF */}
                  <div className="space-y-2">
                    <Label htmlFor="rfp-file">Documento RFP (PDF)</Label>
                    <Input
                      id="rfp-file"
                      type="file"
                      accept="application/pdf"
                      disabled={viewMode}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.type !== 'application/pdf') {
                            toast({
                              title: 'Error',
                              description: 'Solo se permiten archivos PDF',
                              variant: 'destructive',
                            })
                            e.target.value = ''
                            return
                          }
                          if (file.size > 20 * 1024 * 1024) {
                            toast({
                              title: 'Error',
                              description: 'El archivo no puede exceder 20MB',
                              variant: 'destructive',
                            })
                            e.target.value = ''
                            return
                          }
                          setSelectedFile(file)
                        }
                      }}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    {editingTender?.rfp_path && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => viewRfpDocument(editingTender.rfp_path!)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver RFP actual
                      </Button>
                    )}
                  </div>

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <Progress value={uploadProgress} className="w-full" />
                  )}

                  <DialogFooter>
                    {viewMode ? (
                      // En modo vista, solo mostrar botón de cerrar
                      <Button
                        type="button"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cerrar
                      </Button>
                    ) : (
                      // En modo edición, mostrar botones normales
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={loading}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingTender ? 'Actualizar' : 'Crear'} Licitación
                        </Button>
                      </>
                    )}
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabla de licitaciones */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono">Código</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Plazo</TableHead>
              <TableHead>Cierre</TableHead>
              {(isAdmin || isSupplier) && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data.items.length ? (
              <TableRow>
                <TableCell colSpan={(isAdmin || isSupplier) ? 7 : 6} className="text-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(isAdmin || isSupplier) ? 7 : 6} className="text-center">
                  No se encontraron licitaciones
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell className="font-mono text-sm">
                    {tender.code}
                    <SimpleRfpIndicator hasRfp={!!tender.rfp_path} />
                  </TableCell>
                  <TableCell>{tender.title}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[tender.status]}>
                      {tender.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(tender.budget_rd)}</TableCell>
                  <TableCell>{tender.delivery_max_months} meses</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(tender.deadline)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => viewTender(tender)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => openDialog(tender)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Cambiar Estado
                          </DropdownMenuLabel>

                          {tender.status !== 'abierto' && (
                            <DropdownMenuItem onClick={() => openStatusChange(tender, 'abierto')}>
                              <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                              Marcar como Abierto
                            </DropdownMenuItem>
                          )}

                          {tender.status !== 'en_evaluacion' && (
                            <DropdownMenuItem onClick={() => openStatusChange(tender, 'en_evaluacion')}>
                              <div className="mr-2 h-2 w-2 rounded-full bg-amber-500"></div>
                              En Evaluación
                            </DropdownMenuItem>
                          )}

                          {tender.status !== 'cerrado' && (
                            <DropdownMenuItem onClick={() => openStatusChange(tender, 'cerrado')}>
                              <div className="mr-2 h-2 w-2 rounded-full bg-gray-500"></div>
                              Cerrar
                            </DropdownMenuItem>
                          )}

                          {tender.status !== 'adjudicado' && (
                            <DropdownMenuItem onClick={() => openStatusChange(tender, 'adjudicado')}>
                              <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                              Adjudicar
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirmId(tender.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                  {isSupplier && !isAdmin && (
                    <TableCell className="text-right">
                      <ActionButtons 
                        tenderId={tender.id}
                        status={tender.status}
                        deadline={tender.deadline}
                        hasProposal={proposalsByTender[tender.id] || false}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {data.items.length} de {data.total} resultados
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= data.total}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Diálogo de confirmación para cambio de estado */}
      <AlertDialog
        open={statusChangeDialog.open}
        onOpenChange={(open) => !open && setStatusChangeDialog({ tender: null, newStatus: null, open: false })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar estado de licitación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de cambiar el estado de "{statusChangeDialog.tender?.title}" a{' '}
              <span className="font-semibold">
                {statusChangeDialog.newStatus?.replace('_', ' ')}
              </span>?
              <br />
              <br />
              Esta acción registrará un evento de auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (statusChangeDialog.tender && statusChangeDialog.newStatus) {
                  changeStatus(statusChangeDialog.tender, statusChangeDialog.newStatus)
                }
              }}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cambiar Estado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminación */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar licitación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará la licitación y sus RFPs/propuestas asociadas. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}