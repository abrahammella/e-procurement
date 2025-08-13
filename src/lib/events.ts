import { SupabaseClient } from '@supabase/supabase-js'

export interface EventPayload {
  [key: string]: any
}

/**
 * Registra un evento en la tabla events para auditoría
 * 
 * @param supabase - Cliente de Supabase con permisos de escritura
 * @param entityType - Tipo de entidad (ej: 'tender', 'proposal', 'user')
 * @param entityId - ID de la entidad afectada
 * @param action - Acción realizada (ej: 'created', 'updated', 'deleted', 'status_changed')
 * @param payload - Datos adicionales del evento (opcional)
 * @param userId - ID del usuario que realizó la acción (opcional, se obtiene del contexto)
 */
export async function logEvent(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string,
  action: string,
  payload?: EventPayload,
  userId?: string
): Promise<void> {
  try {
    // Intentar obtener el usuario del contexto si no se proporciona
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      currentUserId = user?.id || undefined
    }

    // Insertar evento en la tabla events
    const { error } = await supabase
      .from('events')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        payload: payload || {},
        user_id: currentUserId,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging event:', error)
      // No lanzar error para no interrumpir el flujo principal
    }
  } catch (error) {
    console.error('Unexpected error in logEvent:', error)
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Registra múltiples eventos en una sola operación
 */
export async function logEvents(
  supabase: SupabaseClient,
  events: Array<{
    entityType: string
    entityId: string
    action: string
    payload?: EventPayload
    userId?: string
  }>
): Promise<void> {
  try {
    // Obtener usuario del contexto una sola vez
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id

    // Preparar eventos para inserción
    const eventRecords = events.map(event => ({
      entity_type: event.entityType,
      entity_id: event.entityId,
      action: event.action,
      payload: event.payload || {},
      user_id: event.userId || currentUserId,
      created_at: new Date().toISOString()
    }))

    // Insertar todos los eventos
    const { error } = await supabase
      .from('events')
      .insert(eventRecords)

    if (error) {
      console.error('Error logging events:', error)
    }
  } catch (error) {
    console.error('Unexpected error in logEvents:', error)
  }
}

/**
 * Tipos de eventos comunes para referencia
 */
export const EventActions = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGED: 'status_changed',
  PUBLISHED: 'published',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed'
} as const

export const EntityTypes = {
  TENDER: 'tender',
  PROPOSAL: 'proposal',
  RFP_DOC: 'rfp_doc',
  USER: 'user',
  SUPPLIER: 'supplier',
  INVOICE: 'invoice',
  SERVICE_ORDER: 'service_order',
  APPROVAL: 'approval'
} as const