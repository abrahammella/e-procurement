import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { logEvent } from '@/lib/events'

// Zod Schemas
const RfpCreateSchema = z.object({
  tender_id: z.string().uuid('ID de licitación inválido'),
  title: z.string().min(1, 'Título requerido'),
  description: z.string().optional(),
  file_url: z.string().min(1, 'URL del archivo requerida'),
  required_fields: z.array(z.string()).optional().default([]),
  is_mandatory: z.boolean().optional().default(true),
})

const RfpUpdateSchema = z.object({
  id: z.string().uuid('ID de RFP inválido'),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  file_url: z.string().min(1).optional(),
  required_fields: z.array(z.string()).optional(),
  is_mandatory: z.boolean().optional(),
})

const GetQuerySchema = z.object({
  tender_id: z.string().uuid().optional(),
  is_mandatory: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
  orderBy: z.enum(['created_at', 'title', 'is_mandatory']).optional().default('created_at'),
  orderDir: z.enum(['asc', 'desc']).optional().default('desc'),
})

/**
 * GET /api/rfp
 * Lista documentos RFP (solo admins pueden gestionar, todos pueden ver)
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
      .select('role')
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
        { error: 'Parámetros de consulta inválidos', details: validatedQuery.error.errors },
        { status: 400 }
      )
    }

    const { tender_id, is_mandatory, limit, offset, orderBy, orderDir } = validatedQuery.data

    // Construir query base con joins
    let query = supabase
      .from('rfp_docs')
      .select(`
        id,
        tender_id,
        title,
        description,
        file_url,
        required_fields,
        is_mandatory,
        created_at,
        tenders!rfp_docs_tender_id_fkey (
          id,
          code,
          title,
          status,
          budget_rd,
          deadline
        )
      `, { count: 'exact' })

    // Aplicar filtros opcionales
    if (tender_id) {
      query = query.eq('tender_id', tender_id)
    }
    if (is_mandatory !== undefined) {
      query = query.eq('is_mandatory', is_mandatory === 'true')
    }

    // Aplicar ordenamiento y paginación
    query = query
      .order(orderBy, { ascending: orderDir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: rfpDocs, error: queryError, count } = await query

    if (queryError) {
      console.error('Error al consultar documentos RFP:', queryError)
      return NextResponse.json(
        { error: 'Error al obtener documentos RFP' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        items: rfpDocs || [],
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Error inesperado en GET rfp:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rfp
 * Crea un nuevo documento RFP (solo admins)
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
        { error: 'Solo los administradores pueden crear documentos RFP' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = RfpCreateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de RFP inválidos', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { tender_id, title, description, file_url, required_fields, is_mandatory } = validatedData.data

    // Verificar que la licitación existe
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('id, status')
      .eq('id', tender_id)
      .single()

    if (tenderError || !tender) {
      return NextResponse.json(
        { error: 'Licitación no encontrada' },
        { status: 404 }
      )
    }

    // Crear el documento RFP
    const { data: rfpDoc, error: insertError } = await supabase
      .from('rfp_docs')
      .insert({
        tender_id,
        title,
        description: description || null,
        file_url,
        required_fields: required_fields || [],
        is_mandatory
      })
      .select(`
        *,
        tenders!rfp_docs_tender_id_fkey (
          id, code, title, status, budget_rd, deadline
        )
      `)
      .single()

    if (insertError) {
      console.error('Error al crear documento RFP:', insertError)
      return NextResponse.json(
        { error: 'Error al crear documento RFP' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'rfp_doc',
        rfpDoc.id,
        'created',
        {
          tender_id,
          title,
          is_mandatory,
          required_fields_count: required_fields?.length || 0
        }
      )
    } catch (eventError) {
      console.error('Error logging RFP creation event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: rfpDoc
    }, { status: 201 })

  } catch (error) {
    console.error('Error inesperado en POST rfp:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/rfp
 * Actualiza un documento RFP (solo admins)
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
        { error: 'Solo los administradores pueden actualizar documentos RFP' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = RfpUpdateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validatedData.data

    // Verificar que el documento RFP existe
    const { data: existingRfp, error: rfpError } = await supabase
      .from('rfp_docs')
      .select('*')
      .eq('id', id)
      .single()

    if (rfpError || !existingRfp) {
      return NextResponse.json(
        { error: 'Documento RFP no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el documento RFP
    const { data: updatedRfp, error: updateError } = await supabase
      .from('rfp_docs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        tenders!rfp_docs_tender_id_fkey (
          id, code, title, status, budget_rd, deadline
        )
      `)
      .single()

    if (updateError) {
      console.error('Error al actualizar documento RFP:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar documento RFP' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'rfp_doc',
        id,
        'updated',
        {
          ...updateData,
          previous_title: existingRfp.title,
          previous_is_mandatory: existingRfp.is_mandatory
        }
      )
    } catch (eventError) {
      console.error('Error logging RFP update event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: updatedRfp
    })

  } catch (error) {
    console.error('Error inesperado en PATCH rfp:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rfp
 * Elimina un documento RFP (solo admins)
 */
export async function DELETE(request: NextRequest) {
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
        { error: 'Solo los administradores pueden eliminar documentos RFP' },
        { status: 403 }
      )
    }

    // Parsear el body
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de documento RFP requerido' },
        { status: 400 }
      )
    }

    // Verificar que el documento RFP existe
    const { data: existingRfp, error: rfpError } = await supabase
      .from('rfp_docs')
      .select('*')
      .eq('id', id)
      .single()

    if (rfpError || !existingRfp) {
      return NextResponse.json(
        { error: 'Documento RFP no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar el documento RFP
    const { error: deleteError } = await supabase
      .from('rfp_docs')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error al eliminar documento RFP:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar documento RFP' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'rfp_doc',
        id,
        'deleted',
        {
          tender_id: existingRfp.tender_id,
          title: existingRfp.title,
          is_mandatory: existingRfp.is_mandatory
        }
      )
    } catch (eventError) {
      console.error('Error logging RFP deletion event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      message: 'Documento RFP eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error inesperado en DELETE rfp:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}