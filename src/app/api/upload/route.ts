import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

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

    // Parsear FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'docs'
    const folder = formData.get('folder') as string || 'general'

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se admiten PDF, DOC, DOCX y TXT' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB permitido' },
        { status: 400 }
      )
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir archivo: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      ok: true,
      data: {
        path: uploadData.path,
        fullPath: uploadData.fullPath,
        publicUrl: urlData.publicUrl,
        fileName: file.name,
        size: file.size,
        type: file.type
      }
    })

  } catch (error) {
    console.error('Error inesperado en upload:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}