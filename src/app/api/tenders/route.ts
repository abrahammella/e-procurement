import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { logEvent } from '@/lib/events'

// Zod Schemas
const TenderCreateSchema = z.object({
  code: z.string().trim().min(1, 'El código es requerido'),
  title: z.string().trim().min(1, 'El título es requerido'),
  description: z.string().optional(),
  budget_rd: z.number().positive('El presupuesto debe ser mayor a 0'),
  delivery_max_months: z.number().int().positive('Los meses de entrega deben ser un entero positivo'),
  deadline: z.union([z.string(), z.date()]).transform((val) => {
    const date = new Date(val)
    if (isNaN(date.getTime())) {
      throw new Error('Fecha de cierre inválida')
    }
    if (date <= new Date()) {
      throw new Error('La fecha de cierre debe ser futura')
    }
    return date.toISOString()
  })
})

const TenderUpdateSchema = z.object({
  id: z.string().uuid('ID de licitación inválido'),
  code: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  budget_rd: z.number().positive().optional(),
  delivery_max_months: z.number().int().positive().optional(),
  deadline: z.union([z.string(), z.date()]).transform((val) => {
    const date = new Date(val)
    if (isNaN(date.getTime())) {
      throw new Error('Fecha de cierre inválida')
    }
    if (date <= new Date()) {
      throw new Error('La fecha de cierre debe ser futura')
    }
    return date.toISOString()
  }).optional(),
  status: z.enum(['abierto', 'en_evaluacion', 'cerrado', 'adjudicado']).optional()
})

const TenderDeleteSchema = z.object({
  id: z.string().uuid('ID de licitación inválido')
})

const GetQuerySchema = z.object({
  status: z.enum(['abierto', 'en_evaluacion', 'cerrado', 'adjudicado']).optional(),
  q: z.string().optional(),
  limit: z.string().transform((val) => Math.min(Math.max(parseInt(val) || 50, 1), 100)).optional(),
  offset: z.string().transform((val) => Math.max(parseInt(val) || 0, 0)).optional(),
  orderBy: z.enum(['code', 'deadline', 'created_at']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional()
})

/**
 * Verifica autenticación y obtiene el perfil del usuario
 */
async function authenticateAndGetProfile(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'No autorizado', status: 401 }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Perfil no encontrado', status: 401 }
  }

  return { user, profile }
}

/**
 * GET /api/tenders - Obtiene lista de licitaciones con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const authResult = await authenticateAndGetProfile(supabase)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Parsear y validar query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = GetQuerySchema.parse(queryParams)

    // Construir query base con total count incluido
    let query = supabase
      .from('tenders')
      .select(`
        id,
        code,
        title,
        description,
        status,
        budget_rd,
        delivery_max_months,
        deadline,
        created_at,
        created_by
      `, { count: 'exact' })

    // Aplicar filtros
    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status)
    }

    if (validatedQuery.q) {
      // Búsqueda mejorada en code y title
      query = query.or(`code.ilike.%${validatedQuery.q}%,title.ilike.%${validatedQuery.q}%`)
    }

    // Aplicar ordenamiento
    const orderBy = validatedQuery.orderBy || 'created_at'
    const orderDir = validatedQuery.orderDir || 'desc'
    query = query.order(orderBy, { ascending: orderDir === 'asc' })

    // Aplicar paginación
    const limit = validatedQuery.limit || 50
    const offset = validatedQuery.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Ejecutar query con count
    const { data: items, error, count } = await query

    if (error) {
      console.error('Error fetching tenders:', error)
      return NextResponse.json(
        { error: 'Error al obtener licitaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        items: items || [],
        total: count || 0
      }
    })

  } catch (error) {
    console.error('GET /api/tenders error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenders - Crea una nueva licitación
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const authResult = await authenticateAndGetProfile(supabase)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { profile } = authResult

    // Verificar que sea admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear licitaciones' },
        { status: 403 }
      )
    }

    // Parsear y validar payload
    const body = await request.json()
    const validatedData = TenderCreateSchema.parse(body)

    // Verificar que el código sea único
    const { data: existingTender, error: checkError } = await supabase
      .from('tenders')
      .select('id')
      .eq('code', validatedData.code)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking tender code uniqueness:', checkError)
      return NextResponse.json(
        { error: 'Error al verificar unicidad del código' },
        { status: 500 }
      )
    }

    if (existingTender) {
      return NextResponse.json(
        { error: 'Ya existe una licitación con este código' },
        { status: 409 }
      )
    }

    // Crear la licitación
    const { data: tender, error: createError } = await supabase
      .from('tenders')
      .insert({
        ...validatedData,
        created_by: authResult.user.id
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating tender:', createError)
      return NextResponse.json(
        { error: 'Error al crear la licitación' },
        { status: 500 }
      )
    }

    // Registrar evento de creación
    await logEvent(
      supabase,
      'tender',
      tender.id,
      'created',
      validatedData,
      authResult.user.id
    )

    return NextResponse.json({
      ok: true,
      data: { id: tender.id }
    })

  } catch (error) {
    console.error('POST /api/tenders error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de licitación inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tenders - Actualiza una licitación existente
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const authResult = await authenticateAndGetProfile(supabase)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { profile } = authResult

    // Verificar que sea admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden actualizar licitaciones' },
        { status: 403 }
      )
    }

    // Parsear y validar payload
    const body = await request.json()
    const validatedData = TenderUpdateSchema.parse(body)

    const { id, ...updateData } = validatedData

    // Obtener estado actual para comparar cambios
    const { data: currentTender, error: fetchError } = await supabase
      .from('tenders')
      .select('status, code')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Licitación no encontrada' },
          { status: 404 }
        )
      }
      console.error('Error fetching current tender:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener licitación' },
        { status: 500 }
      )
    }

    // Verificar unicidad del código si se está actualizando
    if (updateData.code && updateData.code !== currentTender.code) {
      const { data: existingTender, error: checkError } = await supabase
        .from('tenders')
        .select('id')
        .eq('code', updateData.code)
        .neq('id', id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking tender code uniqueness:', checkError)
        return NextResponse.json(
          { error: 'Error al verificar unicidad del código' },
          { status: 500 }
        )
      }

      if (existingTender) {
        return NextResponse.json(
          { error: 'Ya existe otra licitación con este código' },
          { status: 409 }
        )
      }
    }

    // Actualizar la licitación
    const { error: updateError } = await supabase
      .from('tenders')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating tender:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la licitación' },
        { status: 500 }
      )
    }

    // Registrar evento de actualización general
    await logEvent(
      supabase,
      'tender',
      id,
      'updated',
      updateData,
      authResult.user.id
    )

    // Registrar evento adicional si cambió el status
    if (updateData.status && updateData.status !== currentTender.status) {
      await logEvent(
        supabase,
        'tender',
        id,
        'status_changed',
        {
          old_status: currentTender.status,
          new_status: updateData.status
        },
        authResult.user.id
      )
    }

    return NextResponse.json({
      ok: true,
      data: { id }
    })

  } catch (error) {
    console.error('PATCH /api/tenders error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tenders - Elimina una licitación
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const authResult = await authenticateAndGetProfile(supabase)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { profile } = authResult

    // Verificar que sea admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar licitaciones' },
        { status: 403 }
      )
    }

    // Parsear y validar payload
    const body = await request.json()
    const { id } = TenderDeleteSchema.parse(body)

    // Verificar que la licitación existe antes de eliminar
    const { data: tender, error: fetchError } = await supabase
      .from('tenders')
      .select('code, title')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Licitación no encontrada' },
          { status: 404 }
        )
      }
      console.error('Error fetching tender for deletion:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener licitación' },
        { status: 500 }
      )
    }

    // Eliminar la licitación
    const { error: deleteError } = await supabase
      .from('tenders')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting tender:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar la licitación' },
        { status: 500 }
      )
    }

    // Registrar evento de eliminación
    await logEvent(
      supabase,
      'tender',
      id,
      'deleted',
      { code: tender.code, title: tender.title },
      authResult.user.id
    )

    return NextResponse.json({
      ok: true,
      data: { id }
    })

  } catch (error) {
    console.error('DELETE /api/tenders error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ID de licitación inválido', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}