import { createServerSupabase } from '@/lib/supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'tender' | 'proposal' | 'approval' | 'invoice'

export interface CreateNotificationParams {
  user_id: string
  title: string
  message: string
  type: NotificationType
  entity_type?: string
  entity_id?: string
  action_url?: string
  metadata?: Record<string, any>
}

/**
 * Crea una notificación directamente en la base de datos
 * Usar cuando el sistema de eventos no sea suficiente
 */
export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...params,
        metadata: params.metadata || {}
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

/**
 * Crea notificaciones para múltiples usuarios
 */
export async function createBulkNotifications(
  supabase: SupabaseClient,
  user_ids: string[],
  params: Omit<CreateNotificationParams, 'user_id'>
) {
  try {
    const notifications = user_ids.map(user_id => ({
      user_id,
      ...params,
      metadata: params.metadata || {}
    }))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select('*')

    if (error) {
      console.error('Error creating bulk notifications:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create bulk notifications:', error)
    throw error
  }
}

/**
 * Notifica a todos los admins
 */
export async function notifyAdmins(
  supabase: SupabaseClient,
  params: Omit<CreateNotificationParams, 'user_id'>
) {
  try {
    // Obtener todos los usuarios admin
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (adminError) {
      console.error('Error fetching admins:', adminError)
      throw adminError
    }

    if (!admins || admins.length === 0) {
      console.warn('No admins found to notify')
      return []
    }

    const adminIds = admins.map(admin => admin.id)
    return createBulkNotifications(supabase, adminIds, params)
  } catch (error) {
    console.error('Failed to notify admins:', error)
    throw error
  }
}

/**
 * Notifica a todos los suppliers activos
 */
export async function notifyActiveSuppliers(
  supabase: SupabaseClient,
  params: Omit<CreateNotificationParams, 'user_id'>
) {
  try {
    // Obtener todos los usuarios de suppliers activos
    const { data: suppliers, error: supplierError } = await supabase
      .from('profiles')
      .select('id, supplier_id')
      .eq('role', 'supplier')
      .not('supplier_id', 'is', null)

    if (supplierError) {
      console.error('Error fetching suppliers:', supplierError)
      throw supplierError
    }

    if (!suppliers || suppliers.length === 0) {
      console.warn('No active suppliers found to notify')
      return []
    }

    // Filtrar solo suppliers activos
    const { data: activeSuppliers, error: activeError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('status', 'activo')
      .in('id', suppliers.map(s => s.supplier_id).filter(Boolean))

    if (activeError) {
      console.error('Error fetching active suppliers:', activeError)
      throw activeError
    }

    const activeSupplierIds = new Set(activeSuppliers?.map(s => s.id) || [])
    const activeUserIds = suppliers
      .filter(s => s.supplier_id && activeSupplierIds.has(s.supplier_id))
      .map(s => s.id)

    return createBulkNotifications(supabase, activeUserIds, params)
  } catch (error) {
    console.error('Failed to notify active suppliers:', error)
    throw error
  }
}

/**
 * Notifica a un supplier específico
 */
export async function notifySupplier(
  supabase: SupabaseClient,
  supplier_id: string,
  params: Omit<CreateNotificationParams, 'user_id'>
) {
  try {
    // Obtener el usuario asociado al supplier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('supplier_id', supplier_id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching supplier profile:', profileError)
      throw profileError || new Error('Supplier profile not found')
    }

    return createNotification(supabase, {
      ...params,
      user_id: profile.id
    })
  } catch (error) {
    console.error('Failed to notify supplier:', error)
    throw error
  }
}

/**
 * Tipos de notificaciones predefinidas
 */
export const NotificationTemplates = {
  // Tenders
  tenderCreated: (tenderTitle: string, tenderId: string) => ({
    title: 'Nueva Licitación Disponible',
    message: `Se ha publicado una nueva licitación: ${tenderTitle}`,
    type: 'tender' as NotificationType,
    entity_type: 'tender',
    entity_id: tenderId,
    action_url: `/tenders/${tenderId}`
  }),

  tenderClosed: (tenderTitle: string, tenderId: string) => ({
    title: 'Licitación Cerrada',
    message: `La licitación "${tenderTitle}" ha sido cerrada`,
    type: 'info' as NotificationType,
    entity_type: 'tender',
    entity_id: tenderId,
    action_url: `/tenders/${tenderId}`
  }),

  tenderAdjudicated: (tenderTitle: string, tenderId: string) => ({
    title: '¡Felicitaciones! Licitación Adjudicada',
    message: `Tu propuesta ha sido seleccionada para: ${tenderTitle}`,
    type: 'success' as NotificationType,
    entity_type: 'tender',
    entity_id: tenderId,
    action_url: `/tenders/${tenderId}`
  }),

  // Proposals
  proposalReceived: (tenderTitle: string, supplierName: string, proposalId: string) => ({
    title: 'Nueva Propuesta Recibida',
    message: `${supplierName} ha enviado una propuesta para: ${tenderTitle}`,
    type: 'proposal' as NotificationType,
    entity_type: 'proposal',
    entity_id: proposalId,
    action_url: '/proposals'
  }),

  proposalStatusChanged: (tenderTitle: string, newStatus: string, proposalId: string) => ({
    title: 'Estado de Propuesta Actualizado',
    message: `Tu propuesta para "${tenderTitle}" cambió a: ${newStatus}`,
    type: newStatus === 'adjudicada' ? 'success' as NotificationType : 'info' as NotificationType,
    entity_type: 'proposal',
    entity_id: proposalId,
    action_url: '/proposals'
  }),

  // Approvals
  approvalRequired: (tenderTitle: string, approvalId: string) => ({
    title: 'Aprobación Requerida',
    message: `Se requiere tu aprobación para: ${tenderTitle}`,
    type: 'warning' as NotificationType,
    entity_type: 'approval',
    entity_id: approvalId,
    action_url: '/approvals'
  }),

  approvalDecided: (tenderTitle: string, decision: string, approvalId: string) => ({
    title: decision === 'approved' ? 'Propuesta Aprobada' : 'Propuesta Rechazada',
    message: `La propuesta para "${tenderTitle}" ha sido ${decision === 'approved' ? 'aprobada' : 'rechazada'}`,
    type: decision === 'approved' ? 'success' as NotificationType : 'error' as NotificationType,
    entity_type: 'approval',
    entity_id: approvalId,
    action_url: '/approvals'
  }),

  // Invoices
  invoiceReceived: (amount: number, invoiceId: string) => ({
    title: 'Nueva Factura Recibida',
    message: `Se ha recibido una factura por RD$ ${amount.toLocaleString('es-DO')}`,
    type: 'invoice' as NotificationType,
    entity_type: 'invoice',
    entity_id: invoiceId,
    action_url: '/invoices'
  }),

  invoicePaid: (amount: number, invoiceId: string) => ({
    title: 'Factura Pagada',
    message: `Tu factura por RD$ ${amount.toLocaleString('es-DO')} ha sido pagada`,
    type: 'success' as NotificationType,
    entity_type: 'invoice',
    entity_id: invoiceId,
    action_url: '/invoices'
  }),

  invoiceRejected: (reason: string, invoiceId: string) => ({
    title: 'Factura Rechazada',
    message: `Tu factura ha sido rechazada: ${reason}`,
    type: 'error' as NotificationType,
    entity_type: 'invoice',
    entity_id: invoiceId,
    action_url: '/invoices'
  })
}