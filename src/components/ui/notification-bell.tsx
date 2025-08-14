'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
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

const typeColors = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  tender: 'bg-purple-100 text-purple-800 border-purple-200',
  proposal: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  approval: 'bg-orange-100 text-orange-800 border-orange-200',
  invoice: 'bg-teal-100 text-teal-800 border-teal-200',
}

const typeIcons = {
  info: '💡',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  tender: '📋',
  proposal: '📄',
  approval: '✍️',
  invoice: '💰',
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Cargar notificaciones
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=10&read=all')
      const result = await response.json()
      
      if (result.ok) {
        setNotifications(result.data.items)
        setUnreadCount(result.data.unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Marcar como leída
  const markAsRead = async (ids: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })

      const result = await response.json()
      
      if (result.ok) {
        setNotifications(prev => 
          prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - ids.length))
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
      toast({
        title: 'Notificaciones marcadas como leídas',
        description: `${unreadIds.length} notificaciones actualizadas`,
      })
    }
  }

  // Eliminar notificación
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      })

      const result = await response.json()
      
      if (result.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        const notification = notifications.find(n => n.id === id)
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
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
      setIsOpen(false)
      router.push(notification.action_url)
    }
  }

  // Formatear fecha relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora mismo'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`
    if (diffInMinutes < 10080) return `Hace ${Math.floor(diffInMinutes / 1440)} días`
    
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  // Cargar notificaciones al abrir
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Polling para nuevas notificaciones (cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        fetchNotifications()
      }
    }, 30000)

    // Carga inicial
    fetchNotifications()

    return () => clearInterval(interval)
  }, [])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notificaciones</h3>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
            >
              <Check className="mr-2 h-4 w-4" />
              Marcar todas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-muted/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-lg border ${typeColors[notification.type]}`}>
                      <span className="text-lg">{typeIcons[notification.type]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          {notification.action_url && (
                            <div className="flex items-center gap-1 mt-2">
                              <ExternalLink className="h-3 w-3 text-primary" />
                              <span className="text-xs text-primary hover:underline">
                                Ver detalles
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-4">
              <Link href="/notifications">
                <Button variant="outline" className="w-full" size="sm">
                  Ver todas las notificaciones
                </Button>
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}