import { NextRequest, NextResponse } from 'next/server'
import { deleteFile } from '@/lib/storage'
import { createServerSupabase } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest) {
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

    // Obtener datos de la request
    const body = await request.json()
    const { path } = body

    if (!path) {
      return NextResponse.json(
        { error: 'No se proporcionó path del archivo' }, 
        { status: 400 }
      )
    }

    // Eliminar archivo
    await deleteFile(path)

    return NextResponse.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error en delete API:', error)
    
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