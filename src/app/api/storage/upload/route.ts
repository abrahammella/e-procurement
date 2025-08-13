import { NextRequest, NextResponse } from 'next/server'
import { uploadPdfToBucket } from '@/lib/storage'
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

    // Subir archivo usando las funciones de storage
    const result = await uploadPdfToBucket(file, prefix)

    return NextResponse.json({
      success: true,
      path: result.path,
      signedUrl: result.signedUrl
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