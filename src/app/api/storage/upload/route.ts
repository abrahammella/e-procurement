import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      )
    }

    // Obtener datos del formulario
    const formData = await request.formData()
    const file = formData.get('file') as File
    const prefix = formData.get('prefix') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' }, 
        { status: 400 }
      )
    }

    if (!prefix) {
      return NextResponse.json(
        { error: 'No se proporcionó prefijo' }, 
        { status: 400 }
      )
    }

    // Validaciones del archivo
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

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `${prefix}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Subir archivo directamente con el cliente autenticado
    const { data, error: uploadError } = await supabase.storage
      .from('docs')
      .upload(fileName, arrayBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error de upload:', uploadError)
      return NextResponse.json(
        { error: `Error al subir: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Crear signed URL para acceso temporal
    const { data: signedData, error: signError } = await supabase.storage
      .from('docs')
      .createSignedUrl(fileName, 600) // 10 minutos

    if (signError) {
      console.warn('No se pudo crear signed URL:', signError)
    }

    return NextResponse.json({
      success: true,
      path: data.path,
      signedUrl: signedData?.signedUrl || null
    })

  } catch (error) {
    console.error('Error en upload API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      }, 
      { status: 500 }
    )
  }
}