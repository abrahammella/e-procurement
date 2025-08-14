import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { logEvent } from '@/lib/events'

// Zod Schemas
const ServiceOrderCreateSchema = z.object({
  proposal_id: z.string().uuid('ID de propuesta inválido'),
  po_number: z.string().min(1, 'Número de orden requerido'),
  pdf_url: z.string().optional(),
})

const ServiceOrderUpdateSchema = z.object({
  id: z.string().uuid('ID de orden inválido'),
  po_number: z.string().min(1).optional(),
  status: z.enum(['emitida', 'en_firma', 'aprobada', 'rechazada']).optional(),
  pdf_url: z.string().optional(),
})

const GetQuerySchema = z.object({
  proposal_id: z.string().uuid().optional(),
  status: z.enum(['emitida', 'en_firma', 'aprobada', 'rechazada']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
  orderBy: z.enum(['created_at', 'po_number', 'status']).optional().default('created_at'),
  orderDir: z.enum(['asc', 'desc']).optional().default('desc'),
})

/**
 * GET /api/service-orders
 * Lista órdenes de servicio (solo admins)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación y permisos de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden ver órdenes de servicio' },
        { status: 403 }
      )
    }

    // Parsear parámetros de query
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = GetQuerySchema.safeParse(queryParams)
    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: validatedQuery.error.errors },
        { status: 400 }
      )
    }

    const { proposal_id, status, limit, offset, orderBy, orderDir } = validatedQuery.data

    // Construir query base con join a proposals y tenders
    let query = supabase
      .from('service_orders')
      .select(`
        id,
        proposal_id,
        po_number,
        pdf_url,
        status,
        created_at,
        proposals!service_orders_proposal_id_fkey (
          id,
          amount_rd,
          delivery_months,
          status,
          supplier_id,
          tenders!proposals_tender_id_fkey (
            id,
            code,
            title,
            status,
            budget_rd
          )
        )
      `, { count: 'exact' })

    // Aplicar filtros opcionales
    if (proposal_id) {
      query = query.eq('proposal_id', proposal_id)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Aplicar ordenamiento y paginación
    query = query
      .order(orderBy, { ascending: orderDir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: serviceOrders, error: queryError, count } = await query

    if (queryError) {
      console.error('Error al consultar órdenes de servicio:', queryError)
      return NextResponse.json(
        { error: 'Error al obtener órdenes de servicio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        items: serviceOrders || [],
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Error inesperado en GET service-orders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/service-orders
 * Crea una nueva orden de servicio (solo admins)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación y permisos de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear órdenes de servicio' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = ServiceOrderCreateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de orden inválidos', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { proposal_id, po_number, pdf_url } = validatedData.data

    // Verificar que la propuesta existe y está adjudicada
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('id', proposal_id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Propuesta no encontrada' },
        { status: 404 }
      )
    }

    if (proposal.status !== 'adjudicada') {
      return NextResponse.json(
        { error: 'Solo se pueden crear órdenes para propuestas adjudicadas' },
        { status: 422 }
      )
    }

    // Verificar que no existe ya una orden para esta propuesta
    const { data: existingOrder } = await supabase
      .from('service_orders')
      .select('id')
      .eq('proposal_id', proposal_id)
      .single()

    if (existingOrder) {
      return NextResponse.json(
        { error: 'Ya existe una orden de servicio para esta propuesta' },
        { status: 409 }
      )
    }

    // Verificar que el número PO es único
    const { data: existingPO } = await supabase
      .from('service_orders')
      .select('id')
      .eq('po_number', po_number)
      .single()

    if (existingPO) {
      return NextResponse.json(
        { error: 'El número de orden ya existe' },
        { status: 409 }
      )
    }

    // Crear la orden de servicio
    const { data: serviceOrder, error: insertError } = await supabase
      .from('service_orders')
      .insert({
        proposal_id,
        po_number,
        pdf_url: pdf_url || null,
        status: 'emitida'
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error al crear orden de servicio:', insertError)
      return NextResponse.json(
        { error: 'Error al crear orden de servicio' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'service_order',
        serviceOrder.id,
        'created',
        {
          proposal_id,
          po_number,
          status: 'emitida'
        }
      )
    } catch (eventError) {
      console.error('Error logging service order creation event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: serviceOrder
    }, { status: 201 })

  } catch (error) {
    console.error('Error inesperado en POST service-orders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/service-orders
 * Actualiza una orden de servicio (solo admins)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Verificar autenticación y permisos de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden actualizar órdenes de servicio' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = ServiceOrderUpdateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validatedData.data

    // Verificar que la orden existe
    const { data: existingOrder, error: orderError } = await supabase
      .from('service_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderError || !existingOrder) {
      return NextResponse.json(
        { error: 'Orden de servicio no encontrada' },
        { status: 404 }
      )
    }

    // Si se está actualizando el número PO, verificar que sea único
    if (updateData.po_number && updateData.po_number !== existingOrder.po_number) {
      const { data: existingPO } = await supabase
        .from('service_orders')
        .select('id')
        .eq('po_number', updateData.po_number)
        .neq('id', id)
        .single()

      if (existingPO) {
        return NextResponse.json(
          { error: 'El número de orden ya existe' },
          { status: 409 }
        )
      }
    }

    // Actualizar la orden
    const { data: updatedOrder, error: updateError } = await supabase
      .from('service_orders')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error al actualizar orden de servicio:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar orden de servicio' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'service_order',
        id,
        'updated',
        {
          ...updateData,
          previous_status: existingOrder.status
        }
      )
    } catch (eventError) {
      console.error('Error logging service order update event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: updatedOrder
    })

  } catch (error) {
    console.error('Error inesperado en PATCH service-orders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}