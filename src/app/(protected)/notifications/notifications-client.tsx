'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Bell, 
  Check, 
  Trash2, 
  ExternalLink, 
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'tender' | 'proposal' | 'approval' | 'invoice'
  entity_type?: string
  entity_id?: string
  read: boolean
  read_at?: string
  action_url?: string
  metadata?: Record<string, any>
  created_at: string
}

interface NotificationsData {
  items: Notification[]
  total: number
  unread: number
}

interface NotificationsClientProps {
  initialData: NotificationsData
}

const typeColors = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  tender: 'bg-purple-100 text-purple-800',
  proposal: 'bg-indigo-100 text-indigo-800',
  approval: 'bg-orange-100 text-orange-800',
  invoice: 'bg-teal-100 text-teal-800',
}

const typeLabels = {
  info: 'Información',
  success: 'Éxito',
  warning: 'Advertencia',
  error: 'Error',
  tender: 'Licitación',
  proposal: 'Propuesta',
  approval: 'Aprobación',
  invoice: 'Factura',
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  tender: Bell,
  proposal: Bell,
  approval: Bell,
  invoice: Bell,
}

export default function NotificationsClient({ initialData }: NotificationsClientProps) {
  const [data, setData] = useState<NotificationsData>(initialData)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<string>('all')
  const { toast } = useToast()
  const router = useRouter()

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy 'a las' h:mm a", { locale: es })
  }

  // Filtrar notificaciones
  const filteredNotifications = data.items.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    const matchesRead = readFilter === 'all' || 
                       (readFilter === 'read' && notification.read) ||
                       (readFilter === 'unread' && !notification.read)
    
    return matchesSearch && matchesType && matchesRead
  })

  // Marcar como leídas
  const markAsRead = async (ids: string[]) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })

      const result = await response.json()
      
      if (result.ok) {
        setData(prev => ({
          ...prev,
          items: prev.items.map(n => 
            ids.includes(n.id) ? { ...n, read: true, read_at: new Date().toISOString() } : n
          ),
          unread: Math.max(0, prev.unread - ids.filter(id => 
            prev.items.find(n => n.id === id && !n.read)
          ).length)
        }))

        toast({
          title: 'Notificaciones actualizadas',
          description: `${ids.length} notificación(es) marcada(s) como leída(s)`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al marcar notificaciones como leídas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    const unreadIds = data.items.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  // Marcar seleccionadas como leídas
  const markSelectedAsRead = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length > 0) {
      await markAsRead(ids)
      setSelectedIds(new Set())
    }
  }

  // Eliminar notificaciones
  const deleteNotifications = async (ids: string[]) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })

      const result = await response.json()
      
      if (result.ok) {
        setData(prev => ({
          ...prev,
          items: prev.items.filter(n => !ids.includes(n.id)),
          total: prev.total - ids.length,
          unread: prev.unread - ids.filter(id => 
            prev.items.find(n => n.id === id && !n.read)
          ).length
        }))

        toast({
          title: 'Notificaciones eliminadas',
          description: `${ids.length} notificación(es) eliminada(s)`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar notificaciones',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setSelectedIds(new Set())
    }
  }

  // Eliminar seleccionadas
  const deleteSelected = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length > 0) {
      await deleteNotifications(ids)
    }
  }

  // Manejar click en notificación
  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      await markAsRead([notification.id])
    }

    // Navegar si hay URL
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  // Toggle selección
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  // Toggle seleccionar todas
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  // Estadísticas
  const stats = {
    total: data.total,
    unread: data.unread,
    read: data.total - data.unread,
    selected: selectedIds.size
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona todas tus notificaciones en un solo lugar
          </p>
        </div>
        <div className="flex gap-2">
          {stats.unread > 0 && (
            <Button 
              variant="outline"
              onClick={markAllAsRead}
              disabled={loading}
            >
              <Check className="mr-2 h-4 w-4" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Leídas</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.unread}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.read}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seleccionadas</CardTitle>
            <Check className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.selected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                placeholder="Buscar en notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="read">Leídas</SelectItem>
                <SelectItem value="unread">No leídas</SelectItem>
              </SelectContent>
            </Select>
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={markSelectedAsRead}
                  disabled={loading}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Marcar como leídas ({selectedIds.size})
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={loading}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar ({selectedIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar notificaciones?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente {selectedIds.size} notificación(es).
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteSelected}
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
        </CardContent>
      </Card>

      {/* Lista de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Notificaciones</CardTitle>
          <CardDescription>
            Haz clic en una notificación para ver más detalles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Notificación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Bell className="mx-auto h-8 w-8 mb-2" />
                        <p>No hay notificaciones</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type]
                    return (
                      <TableRow 
                        key={notification.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          !notification.read ? 'bg-muted/20' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(notification.id)}
                            onCheckedChange={() => toggleSelection(notification.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 p-2 rounded-lg ${typeColors[notification.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              {notification.action_url && (
                                <div className="flex items-center gap-1 mt-1">
                                  <ExternalLink className="h-3 w-3 text-primary" />
                                  <span className="text-xs text-primary">Ver detalles</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeColors[notification.type]} variant="secondary">
                            {typeLabels[notification.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>{formatDate(notification.created_at)}</div>
                          {notification.read && notification.read_at && (
                            <div className="text-xs">Leída: {formatDate(notification.read_at)}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotifications([notification.id])}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}