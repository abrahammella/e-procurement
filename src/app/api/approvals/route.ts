import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { logEvent } from '@/lib/events'
import crypto from 'crypto'

// Zod Schemas
const ApprovalCreateSchema = z.object({
  proposal_id: z.string().uuid('ID de propuesta inválido').optional(),
  tender_id: z.string().uuid('ID de licitación inválido').optional(),
  scope: z.enum(['apertura_tender', 'comite_rfp', 'comite_ejecutivo', 'gerente_ti', 'director_ti', 'vp_ti']),
  approver_email: z.string().email('Email inválido'),
  comment: z.string().optional(),
}).refine(
  (data) => data.proposal_id || data.tender_id,
  { message: "Debe proporcionarse proposal_id o tender_id" }
)

const ApprovalUpdateSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().optional(),
})

const GetQuerySchema = z.object({
  proposal_id: z.string().uuid().optional(),
  tender_id: z.string().uuid().optional(),
  scope: z.enum(['apertura_tender', 'comite_rfp', 'comite_ejecutivo', 'gerente_ti', 'director_ti', 'vp_ti']).optional(),
  decision: z.enum(['pending', 'approved', 'rejected']).optional(),
  approver_email: z.string().email().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
})

/**
 * GET /api/approvals
 * Lista aprobaciones (filtradas por permisos)
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
      .select('role, email')
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

    const { proposal_id, scope, decision, approver_email, limit, offset } = validatedQuery.data

    // Construir query base con join a proposals y tenders
    let query = supabase
      .from('approvals')
      .select(`
        id,
        scope,
        proposal_id,
        approver_email,
        decision,
        decided_at,
        comment,
        decided_by,
        token,
        expires_at,
        proposals!approvals_proposal_id_fkey (
          id,
          amount_rd,
          delivery_months,
          status,
          tenders!proposals_tender_id_fkey (
            id,
            code,
            title,
            status,
            budget_rd,
            deadline
          )
        )
      `, { count: 'exact' })

    // Aplicar filtros de seguridad
    if (profile.role === 'admin') {
      // Admins pueden ver todas las aprobaciones
    } else {
      // Usuarios normales solo pueden ver sus propias aprobaciones
      query = query.eq('approver_email', profile.email)
    }

    // Aplicar filtros opcionales
    if (proposal_id) {
      query = query.eq('proposal_id', proposal_id)
    }
    if (scope) {
      query = query.eq('scope', scope)
    }
    if (decision) {
      query = query.eq('decision', decision)
    }
    if (approver_email && profile.role === 'admin') {
      query = query.eq('approver_email', approver_email)
    }

    // Aplicar ordenamiento y paginación
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: approvals, error: queryError, count } = await query

    if (queryError) {
      console.error('Error al consultar aprobaciones:', queryError)
      return NextResponse.json(
        { error: 'Error al obtener aprobaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        items: approvals || [],
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Error inesperado en GET approvals:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/approvals
 * Crea una nueva aprobación (solo admins)
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

    // Verificar que es admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden crear aprobaciones' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = ApprovalCreateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de aprobación inválidos', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { proposal_id, scope, approver_email, comment } = validatedData.data

    // Verificar que la propuesta existe
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

    // Verificar que no existe ya una aprobación para este scope y propuesta
    const { data: existingApproval } = await supabase
      .from('approvals')
      .select('id')
      .eq('proposal_id', proposal_id)
      .eq('scope', scope)
      .single()

    if (existingApproval) {
      return NextResponse.json(
        { error: 'Ya existe una aprobación para este ámbito y propuesta' },
        { status: 409 }
      )
    }

    // Generar token único y fecha de expiración (7 días)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Crear la aprobación
    const { data: approval, error: insertError } = await supabase
      .from('approvals')
      .insert({
        proposal_id,
        scope,
        approver_email,
        comment: comment || null,
        token,
        expires_at: expiresAt.toISOString(),
        decision: 'pending'
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error al crear aprobación:', insertError)
      return NextResponse.json(
        { error: 'Error al crear aprobación' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'approval',
        approval.id,
        'created',
        {
          proposal_id,
          scope,
          approver_email,
          token: token.substring(0, 8) + '...' // Solo los primeros caracteres por seguridad
        }
      )
    } catch (eventError) {
      console.error('Error logging approval creation event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: approval
    }, { status: 201 })

  } catch (error) {
    console.error('Error inesperado en POST approvals:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/approvals
 * Actualiza una aprobación usando token
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Parsear y validar el body
    const body = await request.json()
    const validatedData = ApprovalUpdateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: validatedData.error.errors },
        { status: 400 }
      )
    }

    const { token, decision, comment } = validatedData.data

    // Buscar la aprobación por token
    const { data: approval, error: approvalError } = await supabase
      .from('approvals')
      .select('*')
      .eq('token', token)
      .eq('decision', 'pending') // Solo permitir actualizar pendientes
      .single()

    if (approvalError || !approval) {
      return NextResponse.json(
        { error: 'Token de aprobación inválido o ya procesado' },
        { status: 404 }
      )
    }

    // Verificar que no ha expirado
    if (new Date() > new Date(approval.expires_at)) {
      return NextResponse.json(
        { error: 'El token de aprobación ha expirado' },
        { status: 410 }
      )
    }

    // Actualizar la aprobación
    const { data: updatedApproval, error: updateError } = await supabase
      .from('approvals')
      .update({
        decision,
        decided_at: new Date().toISOString(),
        comment: comment || approval.comment,
        decided_by: approval.approver_email // Registrar quién decidió
      })
      .eq('id', approval.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error al actualizar aprobación:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar aprobación' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'approval',
        approval.id,
        decision === 'approved' ? 'approved' : 'rejected',
        {
          proposal_id: approval.proposal_id,
          scope: approval.scope,
          approver_email: approval.approver_email,
          comment,
          decided_at: updatedApproval.decided_at
        }
      )
    } catch (eventError) {
      console.error('Error logging approval decision event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: updatedApproval
    })

  } catch (error) {
    console.error('Error inesperado en PATCH approvals:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}