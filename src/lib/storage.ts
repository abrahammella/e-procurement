import { createServerSupabase } from '@/lib/supabase-server'

// Constantes de configuración
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB en bytes
const SIGNED_URL_EXPIRY = 600 // 10 minutos en segundos

// Tipos
export interface UploadResult {
  path: string
  signedUrl: string
}

export interface StorageError {
  code: string
  message: string
}

/**
 * Valida un archivo PDF antes de subirlo
 */
function validatePdfFile(file: File): void {
  // Validar tipo MIME
  if (file.type !== 'application/pdf') {
    throw new Error('El archivo debe ser un PDF válido')
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo no puede exceder ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  // Validar que el archivo no esté vacío
  if (file.size === 0) {
    throw new Error('El archivo no puede estar vacío')
  }
}

/**
 * Genera un nombre de archivo seguro y único
 */
function generateFileName(file: File, keyPrefix: string): string {
  const timestamp = Date.now()
  const originalName = file.name.replace(/\.pdf$/i, '') // Remover extensión .pdf si existe
  
  // Crear slug del nombre original (solo letras, números y guiones)
  const slug = originalName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .trim()
  
  return `${keyPrefix}/${timestamp}-${slug}.pdf`
}

/**
 * Sube un archivo PDF a Supabase Storage
 * 
 * @param file - Archivo PDF a subir
 * @param keyPrefix - Prefijo para organizar archivos (ej: 'rfps', 'proposals', 'invoices')
 * @returns Promise con el path del archivo y URL firmada
 * 
 * @throws Error si la validación falla o hay error en la subida
 */
export async function uploadPdfToBucket(
  file: File, 
  keyPrefix: string
): Promise<UploadResult> {
  try {
    // Validar archivo
    validatePdfFile(file)
    
    // Generar nombre único
    const fileName = generateFileName(file, keyPrefix)
    
    // Crear cliente Supabase del servidor
    const supabase = createServerSupabase()
    
    // Subir archivo al bucket 'documents'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        cacheControl: '3600', // Cache por 1 hora
        upsert: false // No sobrescribir archivos existentes
      })
    
    if (uploadError) {
      console.error('Error al subir archivo:', uploadError)
      throw new Error(`Error al subir el archivo: ${uploadError.message}`)
    }
    
    if (!uploadData?.path) {
      throw new Error('No se pudo obtener el path del archivo subido')
    }
    
    // Generar URL firmada para acceso temporal
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(uploadData.path, SIGNED_URL_EXPIRY)
    
    if (signedUrlError) {
      console.error('Error al generar URL firmada:', signedUrlError)
      throw new Error(`Error al generar URL de acceso: ${signedUrlError.message}`)
    }
    
    if (!signedUrlData?.signedUrl) {
      throw new Error('No se pudo generar la URL de acceso')
    }
    
    return {
      path: uploadData.path,
      signedUrl: signedUrlData.signedUrl
    }
    
  } catch (error) {
    // Re-lanzar errores de validación
    if (error instanceof Error) {
      throw error
    }
    
    // Error genérico
    console.error('Error inesperado en uploadPdfToBucket:', error)
    throw new Error('Error inesperado al subir el archivo')
  }
}

/**
 * Obtiene una URL firmada para un archivo existente
 * 
 * @param filePath - Path del archivo en Storage
 * @param expirySeconds - Tiempo de expiración en segundos (default: 10 min)
 * @returns Promise con la URL firmada
 */
export async function getSignedUrl(
  filePath: string, 
  expirySeconds: number = SIGNED_URL_EXPIRY
): Promise<string> {
  try {
    const supabase = createServerSupabase()
    
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expirySeconds)
    
    if (error) {
      throw new Error(`Error al generar URL firmada: ${error.message}`)
    }
    
    if (!data?.signedUrl) {
      throw new Error('No se pudo generar la URL de acceso')
    }
    
    return data.signedUrl
    
  } catch (error) {
    console.error('Error en getSignedUrl:', error)
    throw error
  }
}

/**
 * Elimina un archivo del Storage
 * 
 * @param filePath - Path del archivo a eliminar
 * @returns Promise que se resuelve cuando se elimina
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const supabase = createServerSupabase()
    
    const { error } = await supabase.storage
      .from('documents')
      .remove([filePath])
    
    if (error) {
      throw new Error(`Error al eliminar archivo: ${error.message}`)
    }
    
  } catch (error) {
    console.error('Error en deleteFile:', error)
    throw error
  }
}

/**
 * Lista archivos en un directorio específico
 * 
 * @param folderPath - Ruta del directorio (ej: 'rfps', 'proposals')
 * @returns Promise con lista de archivos
 */
export async function listFiles(folderPath: string): Promise<string[]> {
  try {
    const supabase = createServerSupabase()
    
    const { data, error } = await supabase.storage
      .from('documents')
      .list(folderPath)
    
    if (error) {
      throw new Error(`Error al listar archivos: ${error.message}`)
    }
    
    return data?.map(file => `${folderPath}/${file.name}`) || []
    
  } catch (error) {
    console.error('Error en listFiles:', error)
    throw error
  }
}
