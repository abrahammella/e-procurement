import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { logEvent } from '@/lib/events'

// Zod Schemas
const InvoiceCreateSchema = z.object({
  proposal_id: z.string().uuid('ID de propuesta inválido'),
  service_order_id: z.string().uuid('ID de orden de servicio inválido').optional(),
  invoice_url: z.string().min(1, 'URL de factura requerida'),
  amount_rd: z.number().positive('El monto debe ser mayor a 0'),
})

const InvoiceUpdateSchema = z.object({
  id: z.string().uuid('ID de factura inválido'),
  invoice_url: z.string().min(1).optional(),
  amount_rd: z.number().positive().optional(),
  status: z.enum(['recibida', 'validada', 'en_pago', 'pagada', 'rechazada']).optional(),
})

const GetQuerySchema = z.object({
  proposal_id: z.string().uuid().optional(),
  service_order_id: z.string().uuid().optional(),
  status: z.enum(['recibida', 'validada', 'en_pago', 'pagada', 'rechazada']).optional(),
  supplier_id: z.string().uuid().optional(),
  limit: z.string().optional().default('10').pipe(z.coerce.number()),
  offset: z.string().optional().default('0').pipe(z.coerce.number()),
  orderBy: z.enum(['created_at', 'amount_rd', 'status']).optional().default('created_at'),
  orderDir: z.enum(['asc', 'desc']).optional().default('desc'),
})

/**
 * GET /api/invoices
 * Lista facturas (admins ven todas, suppliers solo las suyas)
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

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, supplier_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
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

    const { proposal_id, service_order_id, status, supplier_id, limit, offset, orderBy, orderDir } = validatedQuery.data

    // Construir query base con joins
    let query = supabase
      .from('invoices')
      .select(`
        id,
        proposal_id,
        service_order_id,
        invoice_url,
        amount_rd,
        status,
        created_at,
        proposals!invoices_proposal_id_fkey (
          id,
          amount_rd as proposal_amount,
          delivery_months,
          status as proposal_status,
          supplier_id,
          tenders!proposals_tender_id_fkey (
            id,
            code,
            title,
            status as tender_status,
            budget_rd
          )
        ),
        service_orders!invoices_service_order_id_fkey (
          id,
          po_number,
          status as so_status
        )
      `, { count: 'exact' })

    // Aplicar filtros de seguridad
    if (profile.role === 'admin') {
      // Admins pueden ver todas las facturas
    } else if (profile.role === 'supplier' && profile.supplier_id) {
      // Suppliers solo pueden ver sus propias facturas a través de sus propuestas
      query = query.eq('proposals.supplier_id', profile.supplier_id)
    } else {
      return NextResponse.json(
        { error: 'No tienes permisos para ver facturas' },
        { status: 403 }
      )
    }

    // Aplicar filtros opcionales
    if (proposal_id) {
      query = query.eq('proposal_id', proposal_id)
    }
    if (service_order_id) {
      query = query.eq('service_order_id', service_order_id)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (supplier_id && profile.role === 'admin') {
      query = query.eq('proposals.supplier_id', supplier_id)
    }

    // Aplicar ordenamiento y paginación
    query = query
      .order(orderBy, { ascending: orderDir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: invoices, error: queryError, count } = await query

    if (queryError) {
      console.error('Error al consultar facturas:', queryError)
      return NextResponse.json(
        { error: 'Error al obtener facturas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        items: invoices || [],
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Error inesperado en GET invoices:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invoices
 * Crea una nueva factura (suppliers para sus propuestas, admins para cualquiera)
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

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, supplier_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = InvoiceCreateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de factura inválidos', details: validatedData.error.issues },
        { status: 400 }
      )
    }

    const { proposal_id, service_order_id, invoice_url, amount_rd } = validatedData.data

    // Verificar que la propuesta existe y permisos
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, status, supplier_id, amount_rd')
      .eq('id', proposal_id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Propuesta no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos según el rol
    if (profile.role === 'supplier') {
      if (proposal.supplier_id !== profile.supplier_id) {
        return NextResponse.json(
          { error: 'Solo puedes crear facturas para tus propias propuestas' },
          { status: 403 }
        )
      }
    }

    // Verificar que la propuesta está adjudicada
    if (proposal.status !== 'adjudicada') {
      return NextResponse.json(
        { error: 'Solo se pueden crear facturas para propuestas adjudicadas' },
        { status: 422 }
      )
    }

    // Verificar que el monto no excede la propuesta
    if (amount_rd > proposal.amount_rd) {
      return NextResponse.json(
        { error: 'El monto de la factura no puede exceder el monto de la propuesta adjudicada' },
        { status: 422 }
      )
    }

    // Verificar la orden de servicio si se proporciona
    if (service_order_id) {
      const { data: serviceOrder, error: soError } = await supabase
        .from('service_orders')
        .select('id, proposal_id, status')
        .eq('id', service_order_id)
        .single()

      if (soError || !serviceOrder) {
        return NextResponse.json(
          { error: 'Orden de servicio no encontrada' },
          { status: 404 }
        )
      }

      if (serviceOrder.proposal_id !== proposal_id) {
        return NextResponse.json(
          { error: 'La orden de servicio no corresponde a la propuesta' },
          { status: 422 }
        )
      }

      if (serviceOrder.status !== 'aprobada') {
        return NextResponse.json(
          { error: 'La orden de servicio debe estar aprobada' },
          { status: 422 }
        )
      }
    }

    // Crear la factura
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        proposal_id,
        service_order_id: service_order_id || null,
        invoice_url,
        amount_rd,
        status: 'recibida'
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error al crear factura:', insertError)
      return NextResponse.json(
        { error: 'Error al crear factura' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'invoice',
        invoice.id,
        'created',
        {
          proposal_id,
          service_order_id,
          amount_rd,
          status: 'recibida',
          supplier_id: proposal.supplier_id
        }
      )
    } catch (eventError) {
      console.error('Error logging invoice creation event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: invoice
    }, { status: 201 })

  } catch (error) {
    console.error('Error inesperado en POST invoices:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/invoices
 * Actualiza una factura (admins pueden cambiar status, suppliers datos básicos)
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

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, supplier_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = InvoiceUpdateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: validatedData.error.issues },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validatedData.data

    // Verificar que la factura existe y permisos
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        proposals!invoices_proposal_id_fkey (
          supplier_id,
          amount_rd as proposal_amount
        )
      `)
      .eq('id', id)
      .single()

    if (invoiceError || !existingInvoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos según el rol
    if (profile.role === 'supplier') {
      if (existingInvoice.proposals.supplier_id !== profile.supplier_id) {
        return NextResponse.json(
          { error: 'Solo puedes actualizar tus propias facturas' },
          { status: 403 }
        )
      }
      // Los suppliers no pueden cambiar status
      if (updateData.status) {
        return NextResponse.json(
          { error: 'No tienes permisos para cambiar el estado de la factura' },
          { status: 403 }
        )
      }
    }

    // Validar que el nuevo monto no excede la propuesta (si se está actualizando)
    if (updateData.amount_rd && updateData.amount_rd > existingInvoice.proposals.proposal_amount) {
      return NextResponse.json(
        { error: 'El monto de la factura no puede exceder el monto de la propuesta adjudicada' },
        { status: 422 }
      )
    }

    // Actualizar la factura
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error al actualizar factura:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar factura' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'invoice',
        id,
        'updated',
        {
          ...updateData,
          previous_status: existingInvoice.status,
          updated_by_role: profile.role
        }
      )
    } catch (eventError) {
      console.error('Error logging invoice update event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: updatedInvoice
    })

  } catch (error) {
    console.error('Error inesperado en PATCH invoices:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/invoices
 * Elimina una factura (solo admins y suppliers dueños, solo si está en estado 'recibida')
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

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, supplier_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Parsear el body
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    // Verificar que la factura existe y permisos
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        proposals!invoices_proposal_id_fkey (
          supplier_id
        )
      `)
      .eq('id', id)
      .single()

    if (invoiceError || !existingInvoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos según el rol
    if (profile.role === 'supplier') {
      if (existingInvoice.proposals.supplier_id !== profile.supplier_id) {
        return NextResponse.json(
          { error: 'Solo puedes eliminar tus propias facturas' },
          { status: 403 }
        )
      }
    }

    // Solo permitir eliminar si está en estado 'recibida'
    if (existingInvoice.status !== 'recibida') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar facturas en estado "recibida"' },
        { status: 422 }
      )
    }

    // Eliminar la factura
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error al eliminar factura:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar factura' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'invoice',
        id,
        'deleted',
        {
          proposal_id: existingInvoice.proposal_id,
          amount_rd: existingInvoice.amount_rd,
          previous_status: existingInvoice.status,
          deleted_by_role: profile.role
        }
      )
    } catch (eventError) {
      console.error('Error logging invoice deletion event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      message: 'Factura eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error inesperado en DELETE invoices:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}