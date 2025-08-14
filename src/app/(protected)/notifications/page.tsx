import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import NotificationsClient from './notifications-client'

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

async function getNotifications(): Promise<NotificationsData> {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { items: [], total: 0, unread: 0 }
  }

  // Obtener todas las notificaciones del usuario
  const { data: items, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    return { items: [], total: 0, unread: 0 }
  }

  // Contar no leídas
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return {
    items: items || [],
    total: count || 0,
    unread: unreadCount || 0
  }
}

export default async function NotificationsPage() {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  const notificationsData = await getNotifications()

  return (
    <NotificationsClient 
      initialData={notificationsData}
    />
  )
}