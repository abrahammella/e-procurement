import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { logEvent } from '@/lib/events'

// Zod Schemas
const ProposalCreateSchema = z.object({
  tender_id: z.string().uuid('ID de licitación inválido'),
  amount_rd: z.number().positive('El monto debe ser mayor a 0'),
  delivery_months: z.number().int().positive('Los meses de entrega deben ser un entero positivo'),
})

const GetQuerySchema = z.object({
  tender_id: z.string().uuid().optional(),
  status: z.enum(['recibida', 'en_evaluacion', 'rechazada', 'adjudicada']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
  orderBy: z.enum(['created_at', 'amount_rd', 'delivery_months']).optional().default('created_at'),
  orderDir: z.enum(['asc', 'desc']).optional().default('desc'),
})

/**
 * GET /api/proposals
 * Lista las propuestas del supplier actual (filtradas por RLS)
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
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que es admin o supplier
    if (profile.role !== 'admin' && !profile.supplier_id) {
      return NextResponse.json(
        { error: 'Solo los administradores y proveedores pueden ver propuestas' },
        { status: 403 }
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

    const { tender_id, status, limit, offset, orderBy, orderDir } = validatedQuery.data

    // Construir query base con join a tenders para obtener información completa
    let query = supabase
      .from('proposals')
      .select(`
        id,
        tender_id,
        supplier_id,
        amount_rd,
        delivery_months,
        status,
        doc_url,
        created_at,
        tenders (
          id,
          code,
          title,
          status,
          deadline,
          budget_rd
        ),
        suppliers (
          id,
          name,
          rnc
        )
      `)

    // Solo filtrar por supplier_id si no es admin
    if (profile.role !== 'admin' && profile.supplier_id) {
      query = query.eq('supplier_id', profile.supplier_id)
    }

    // Aplicar filtros opcionales
    if (tender_id) {
      query = query.eq('tender_id', tender_id)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Aplicar ordenamiento y paginación
    query = query
      .order(orderBy, { ascending: orderDir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: proposals, error: queryError, count } = await query

    if (queryError) {
      console.error('Error al consultar propuestas:', queryError)
      return NextResponse.json(
        { error: 'Error al obtener propuestas' },
        { status: 500 }
      )
    }

    // Obtener count total para paginación
    let countQuery = supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })

    // Solo filtrar por supplier_id si no es admin
    if (profile.role !== 'admin' && profile.supplier_id) {
      countQuery = countQuery.eq('supplier_id', profile.supplier_id)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      ok: true,
      data: {
        items: proposals || [],
        total: totalCount || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Error inesperado en GET proposals:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/proposals
 * Crea una nueva propuesta (solo suppliers)
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

    // Obtener perfil del usuario y verificar que es supplier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('supplier_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.supplier_id) {
      return NextResponse.json(
        { error: 'Solo los proveedores pueden crear propuestas' },
        { status: 403 }
      )
    }

    // Parsear form data
    const formData = await request.formData()
    
    // Extraer campos del formulario
    const tender_id = formData.get('tender_id')?.toString()
    const amount_rd = formData.get('amount_rd')?.toString()
    const delivery_months = formData.get('delivery_months')?.toString()
    const file = formData.get('file') as File | null

    // Validar campos requeridos
    if (!tender_id || !amount_rd || !delivery_months || !file) {
      return NextResponse.json(
        { error: 'Los campos tender_id, amount_rd, delivery_months y file son requeridos' },
        { status: 400 }
      )
    }

    // Validar archivo PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Solo se permiten archivos PDF' },
        { status: 400 }
      )
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB
      return NextResponse.json(
        { error: 'El archivo no puede exceder 20MB' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'El archivo no puede estar vacío' },
        { status: 400 }
      )
    }

    // Validar campos con Zod
    const validationData = {
      tender_id,
      amount_rd: parseFloat(amount_rd),
      delivery_months: parseInt(delivery_months)
    }

    const validatedData = ProposalCreateSchema.safeParse(validationData)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de propuesta inválidos', details: validatedData.error.issues },
        { status: 400 }
      )
    }

    const { tender_id: validTenderId, amount_rd: validAmount, delivery_months: validDelivery } = validatedData.data

    // Validaciones de negocio: obtener tender y validar estado/deadline
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('id, status, deadline, title, code')
      .eq('id', validTenderId)
      .single()

    if (tenderError || !tender) {
      return NextResponse.json(
        { error: 'Licitación no encontrada' },
        { status: 404 }
      )
    }

    // Validación 1: tender debe estar abierto
    if (tender.status !== 'abierta') {
      return NextResponse.json(
        { error: 'Solo se pueden enviar propuestas a licitaciones abiertas' },
        { status: 422 }
      )
    }

    // Validación 2: deadline no debe haber vencido
    const now = new Date()
    const deadline = new Date(tender.deadline)
    if (now > deadline) {
      return NextResponse.json(
        { error: 'La fecha límite para enviar propuestas ha vencido' },
        { status: 422 }
      )
    }

    // Verificar si el supplier ya tiene una propuesta para esta licitación
    const { data: existingProposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('tender_id', validTenderId)
      .eq('supplier_id', profile.supplier_id)
      .single()

    if (existingProposal) {
      return NextResponse.json(
        { error: 'Ya tienes una propuesta enviada para esta licitación' },
        { status: 409 }
      )
    }

    // Subir archivo PDF usando el cliente autenticado (no service role)
    let docUrl: string
    try {
      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const baseName = file.name.replace(/\.pdf$/i, '')
      const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const fileName = `proposals/${validTenderId}/${timestamp}-${slug}.pdf`
      
      // Convertir File a ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)
      
      // Subir archivo usando el cliente autenticado del usuario actual
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('docs')
        .upload(fileName, buffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Error al subir archivo:', uploadError)
        throw new Error(`Error al subir archivo: ${uploadError.message}`)
      }
      
      if (!uploadData?.path) {
        throw new Error('No se pudo obtener el path del archivo subido')
      }
      
      docUrl = uploadData.path
    } catch (uploadError) {
      console.error('Error al subir archivo:', uploadError)
      return NextResponse.json(
        { error: `Error al subir archivo: ${uploadError instanceof Error ? uploadError.message : 'Error desconocido'}` },
        { status: 500 }
      )
    }

    // Insertar propuesta en la base de datos
    const { data: proposal, error: insertError } = await supabase
      .from('proposals')
      .insert({
        tender_id: validTenderId,
        supplier_id: profile.supplier_id,
        amount_rd: validAmount,
        delivery_months: validDelivery,
        doc_url: docUrl,
        status: 'recibida'
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error al insertar propuesta:', insertError)
      
      // Si hay error, intentar limpiar el archivo subido
      try {
        await supabase.storage
          .from('docs')
          .remove([docUrl])
      } catch (cleanupError) {
        console.error('Error al limpiar archivo después de fallo:', cleanupError)
      }

      return NextResponse.json(
        { error: 'Error al crear propuesta' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'proposal',
        proposal.id,
        'created',
        {
          tender_id: validTenderId,
          tender_code: tender.code,
          tender_title: tender.title,
          amount_rd: validAmount,
          delivery_months: validDelivery,
          supplier_id: profile.supplier_id
        }
      )
    } catch (eventError) {
      console.error('Error logging proposal creation event:', eventError)
      // No fallar la operación por error de logging
    }

    return NextResponse.json({
      ok: true,
      data: proposal
    }, { status: 201 })

  } catch (error) {
    console.error('Error inesperado en POST proposals:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}