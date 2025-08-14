import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { logEvent } from '@/lib/events'

// Zod Schemas
const SupplierCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  rnc: z.string().optional(),
  status: z.enum(['activo', 'inactivo', 'suspendido']).optional().default('activo'),
  certified: z.boolean().optional().default(false),
  certifications: z.array(z.string()).optional().default([]),
  experience_years: z.number().int().min(0).optional().default(0),
  support_months: z.number().int().min(0).optional().default(0),
  contact_email: z.string().email('Email inválido').optional(),
})

const SupplierUpdateSchema = z.object({
  id: z.string().uuid('ID de proveedor inválido'),
  name: z.string().min(1).optional(),
  rnc: z.string().optional(),
  status: z.enum(['activo', 'inactivo', 'suspendido']).optional(),
  certified: z.boolean().optional(),
  certifications: z.array(z.string()).optional(),
  experience_years: z.number().int().min(0).optional(),
  support_months: z.number().int().min(0).optional(),
  contact_email: z.string().email('Email inválido').optional(),
})

const GetQuerySchema = z.object({
  status: z.enum(['activo', 'inactivo', 'suspendido']).optional(),
  certified: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
  orderBy: z.enum(['created_at', 'name', 'experience_years', 'support_months']).optional().default('created_at'),
  orderDir: z.enum(['asc', 'desc']).optional().default('desc'),
})

/**
 * GET /api/suppliers
 * Lista proveedores (solo admins)
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
        { error: 'Solo los administradores pueden gestionar proveedores' },
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

    const { status, certified, search, limit, offset, orderBy, orderDir } = validatedQuery.data

    // Construir query base con estadísticas relacionadas
    let query = supabase
      .from('suppliers')
      .select(`
        id,
        name,
        rnc,
        status,
        certified,
        certifications,
        experience_years,
        support_months,
        contact_email,
        created_at,
        proposals:proposals(count),
        active_proposals:proposals!inner(count).eq(status, 'enviada')
      `, { count: 'exact' })

    // Aplicar filtros opcionales
    if (status) {
      query = query.eq('status', status)
    }
    if (certified !== undefined) {
      query = query.eq('certified', certified === 'true')
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%, rnc.ilike.%${search}%, contact_email.ilike.%${search}%`)
    }

    // Aplicar ordenamiento y paginación
    query = query
      .order(orderBy, { ascending: orderDir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: suppliers, error: queryError, count } = await query

    if (queryError) {
      console.error('Error al consultar proveedores:', queryError)
      return NextResponse.json(
        { error: 'Error al obtener proveedores' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        items: suppliers || [],
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Error inesperado en GET suppliers:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/suppliers
 * Crea un nuevo proveedor (solo admins)
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
        { error: 'Solo los administradores pueden crear proveedores' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = SupplierCreateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de proveedor inválidos', details: validatedData.error.issues },
        { status: 400 }
      )
    }

    const supplierData = validatedData.data

    // Verificar que el RNC no esté duplicado (si se proporciona)
    if (supplierData.rnc) {
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('rnc', supplierData.rnc)
        .single()

      if (existingSupplier) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este RNC' },
          { status: 409 }
        )
      }
    }

    // Verificar que el email no esté duplicado (si se proporciona)
    if (supplierData.contact_email) {
      const { data: existingEmail } = await supabase
        .from('suppliers')
        .select('id')
        .eq('contact_email', supplierData.contact_email)
        .single()

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este email' },
          { status: 409 }
        )
      }
    }

    // Crear el proveedor
    const { data: supplier, error: insertError } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Error al crear proveedor:', insertError)
      return NextResponse.json(
        { error: 'Error al crear proveedor' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'supplier',
        supplier.id,
        'created',
        {
          name: supplier.name,
          rnc: supplier.rnc,
          status: supplier.status,
          certified: supplier.certified
        }
      )
    } catch (eventError) {
      console.error('Error logging supplier creation event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: supplier
    }, { status: 201 })

  } catch (error) {
    console.error('Error inesperado en POST suppliers:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/suppliers
 * Actualiza un proveedor (solo admins)
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
        { error: 'Solo los administradores pueden actualizar proveedores' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    const validatedData = SupplierUpdateSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Datos de actualización inválidos', details: validatedData.error.issues },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validatedData.data

    // Verificar que el proveedor existe
    const { data: existingSupplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (supplierError || !existingSupplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Verificar duplicados si se están actualizando
    if (updateData.rnc && updateData.rnc !== existingSupplier.rnc) {
      const { data: duplicateRnc } = await supabase
        .from('suppliers')
        .select('id')
        .eq('rnc', updateData.rnc)
        .neq('id', id)
        .single()

      if (duplicateRnc) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este RNC' },
          { status: 409 }
        )
      }
    }

    if (updateData.contact_email && updateData.contact_email !== existingSupplier.contact_email) {
      const { data: duplicateEmail } = await supabase
        .from('suppliers')
        .select('id')
        .eq('contact_email', updateData.contact_email)
        .neq('id', id)
        .single()

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este email' },
          { status: 409 }
        )
      }
    }

    // Actualizar el proveedor
    const { data: updatedSupplier, error: updateError } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error al actualizar proveedor:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar proveedor' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'supplier',
        id,
        'updated',
        {
          ...updateData,
          previous_status: existingSupplier.status,
          previous_certified: existingSupplier.certified
        }
      )
    } catch (eventError) {
      console.error('Error logging supplier update event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      data: updatedSupplier
    })

  } catch (error) {
    console.error('Error inesperado en PATCH suppliers:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suppliers
 * Elimina un proveedor (solo admins, si no tiene propuestas)
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
        { error: 'Solo los administradores pueden eliminar proveedores' },
        { status: 403 }
      )
    }

    // Parsear el body
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de proveedor requerido' },
        { status: 400 }
      )
    }

    // Verificar que el proveedor existe
    const { data: existingSupplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (supplierError || !existingSupplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tenga propuestas
    const { count: proposalCount } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id)

    if (proposalCount && proposalCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un proveedor que tiene propuestas asociadas' },
        { status: 422 }
      )
    }

    // Verificar que no tenga profiles asociados
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id)

    if (profileCount && profileCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un proveedor que tiene usuarios asociados' },
        { status: 422 }
      )
    }

    // Eliminar el proveedor
    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error al eliminar proveedor:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar proveedor' },
        { status: 500 }
      )
    }

    // Registrar evento de auditoría
    try {
      await logEvent(
        supabase,
        'supplier',
        id,
        'deleted',
        {
          name: existingSupplier.name,
          rnc: existingSupplier.rnc,
          status: existingSupplier.status
        }
      )
    } catch (eventError) {
      console.error('Error logging supplier deletion event:', eventError)
    }

    return NextResponse.json({
      ok: true,
      message: 'Proveedor eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error inesperado en DELETE suppliers:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}