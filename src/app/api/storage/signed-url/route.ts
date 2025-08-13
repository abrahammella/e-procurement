import { NextRequest, NextResponse } from 'next/server'
import { getSignedUrl } from '@/lib/storage'
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

    // Obtener datos de la request
    const body = await request.json()
    const { path, expiresInSec } = body

    if (!path) {
      return NextResponse.json(
        { error: 'No se proporcionó path del archivo' }, 
        { status: 400 }
      )
    }

    // Generar URL firmada
    const signedUrl = await getSignedUrl(path, expiresInSec)

    return NextResponse.json({
      success: true,
      signedUrl
    })

  } catch (error) {
    console.error('Error en signed-url API:', error)
    
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