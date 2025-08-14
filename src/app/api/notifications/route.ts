import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase-server'

// Zod Schemas
const GetQuerySchema = z.object({
  read: z.enum(['true', 'false', 'all']).optional().default('all'),
  type: z.string().optional(),
  entity_type: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
})

const MarkAsReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Al menos un ID requerido'),
})

const CreateNotificationSchema = z.object({
  user_id: z.string().uuid('ID de usuario inválido'),
  title: z.string().min(1, 'Título requerido'),
  message: z.string().min(1, 'Mensaje requerido'),
  type: z.enum(['info', 'success', 'warning', 'error', 'tender', 'proposal', 'approval', 'invoice']),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  action_url: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * GET /api/notifications
 * Lista las notificaciones del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Parsear parámetros de query
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = GetQuerySchema.safeParse(queryParams)
    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: validatedQuery.error.issues },
        { status: 400 }
      )
    }

    const { read, type, entity_type, limit, offset } = validatedQuery.data

    // Construir query base
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Aplicar filtros opcionales
    if (read !== 'all') {
      query = query.eq('read', read === 'true')
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (entity_type) {
      query = query.eq('entity_type', entity_type)
    }

    // Ordenar por fecha de creación descendente y aplicar paginación
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: notifications, error: queryError, count } = await query

    if (queryError) {
      console.error('Error al consultar notificaciones:', queryError)
      return NextResponse.json(
        { error: 'Error al obtener notificaciones' },
        { status: 500 }
      )
    }

    // Obtener conteo de no leídas
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      ok: true,
      data: {
        items: notifications || [],
        total: count || 0,
        unread: unreadCount || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Error inesperado en GET notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Crea una nueva notificación (solo para uso interno/admin)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear notificaciones manuales' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = CreateNotificationSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de notificación inválidos', details: validatedData.error.issues },
        { status: 400 }
      )
    }

    const notificationData = validatedData.data

    // Crear la notificación usando el cliente de servicio para bypass RLS
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        metadata: notificationData.metadata || {}
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error al crear notificación:', insertError)
      return NextResponse.json(
        { error: 'Error al crear notificación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: notification
    }, { status: 201 })

  } catch (error) {
    console.error('Error inesperado en POST notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Marca notificaciones como leídas
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = MarkAsReadSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validatedData.error.issues },
        { status: 400 }
      )
    }

    const { ids } = validatedData.data

    // Marcar como leídas (RLS asegura que solo puede actualizar sus propias notificaciones)
    const { data: updatedNotifications, error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', ids)
      .eq('user_id', user.id)
      .select('*')

    if (updateError) {
      console.error('Error al actualizar notificaciones:', updateError)
      return NextResponse.json(
        { error: 'Error al marcar notificaciones como leídas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        updated: updatedNotifications?.length || 0,
        notifications: updatedNotifications || []
      }
    })

  } catch (error) {
    console.error('Error inesperado en PATCH notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications
 * Elimina notificaciones (solo las propias del usuario)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Parsear el body
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs de notificaciones requeridos' },
        { status: 400 }
      )
    }

    // Eliminar notificaciones (RLS asegura que solo puede eliminar las propias)
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error al eliminar notificaciones:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar notificaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Notificaciones eliminadas exitosamente'
    })

  } catch (error) {
    console.error('Error inesperado en DELETE notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}