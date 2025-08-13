import { createServiceRoleSupabase } from '@/lib/supabase-server'

// Constantes de configuración
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB en bytes
const DEFAULT_SIGNED_URL_EXPIRY = 600 // 10 minutos en segundos
const BUCKET_NAME = 'docs' // Nombre del bucket

// Tipos
export interface UploadResult {
  path: string
  signedUrl: string
}

/**
 * Convierte una cadena de texto en un slug seguro para URLs y nombres de archivo
 * 
 * @param name - Texto a convertir en slug
 * @returns Slug limpio y seguro
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales y acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    // Mantener solo letras, números y espacios
    .replace(/[^a-z0-9\s-]/g, '')
    // Reemplazar espacios múltiples con uno solo
    .replace(/\s+/g, ' ')
    // Reemplazar espacios con guiones
    .replace(/\s/g, '-')
    // Remover guiones múltiples
    .replace(/-+/g, '-')
    // Remover guiones al inicio y final
    .replace(/^-+|-+$/g, '')
}

/**
 * Sube un archivo PDF al bucket privado 'docs' en Supabase Storage
 * 
 * @param file - Archivo PDF a subir (debe ser File object del navegador)
 * @param prefix - Prefijo para organizar archivos (ej: 'rfps', 'proposals', 'invoices')
 * @returns Promise con el path del archivo y URL firmada temporal
 * 
 * @throws Error si la validación falla o hay error en la subida
 */
export async function uploadPdfToBucket(
  file: File, 
  prefix: string
): Promise<{ path: string; signedUrl: string }> {
  try {
    // Validar que el archivo sea PDF
    if (file.type !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF')
    }

    // Validar tamaño máximo (20MB)
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo no puede exceder ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    // Validar que el archivo no esté vacío
    if (file.size === 0) {
      throw new Error('El archivo no puede estar vacío')
    }

    // Generar nombre seguro: ${prefix}/${timestamp}-${slug(baseName)}.pdf
    const timestamp = Date.now()
    const baseName = file.name.replace(/\.pdf$/i, '') // Remover extensión si existe
    const slug = slugify(baseName)
    const fileName = `${prefix}/${timestamp}-${slug}.pdf`
    
    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Crear cliente Supabase con service role
    const supabase = createServiceRoleSupabase()
    
    // Subir archivo al bucket privado 'docs'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
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
    
    // Crear Signed URL (duración 10 minutos)
    const signedUrl = await getSignedUrl(uploadData.path, DEFAULT_SIGNED_URL_EXPIRY)
    
    return {
      path: uploadData.path,
      signedUrl
    }
    
  } catch (error) {
    // Re-lanzar errores conocidos
    if (error instanceof Error) {
      throw error
    }
    
    // Error genérico
    console.error('Error inesperado en uploadPdfToBucket:', error)
    throw new Error('Error inesperado al subir el archivo')
  }
}

/**
 * Obtiene una URL firmada para acceder a un archivo en el bucket privado
 * 
 * @param path - Path del archivo en Storage (ej: 'rfps/1234567890-documento.pdf')
 * @param expiresInSec - Tiempo de expiración en segundos (default: 600 = 10 minutos)
 * @returns Promise con la URL firmada
 * 
 * @throws Error si no se puede generar la URL o el archivo no existe
 */
export async function getSignedUrl(
  path: string, 
  expiresInSec: number = DEFAULT_SIGNED_URL_EXPIRY
): Promise<string> {
  try {
    // Crear cliente Supabase con service role
    const supabase = createServiceRoleSupabase()
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresInSec)
    
    if (error) {
      console.error('Error al generar URL firmada:', error)
      throw new Error(`Error al generar URL firmada: ${error.message}`)
    }
    
    if (!data?.signedUrl) {
      throw new Error('No se pudo generar la URL de acceso')
    }
    
    return data.signedUrl
    
  } catch (error) {
    // Re-lanzar errores conocidos
    if (error instanceof Error) {
      throw error
    }
    
    console.error('Error inesperado en getSignedUrl:', error)
    throw new Error('Error inesperado al generar URL de acceso')
  }
}

/**
 * Elimina un archivo del Storage
 * 
 * @param path - Path del archivo a eliminar
 * @returns Promise que se resuelve cuando se elimina exitosamente
 * 
 * @throws Error si no se puede eliminar el archivo
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const supabase = createServiceRoleSupabase()
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])
    
    if (error) {
      throw new Error(`Error al eliminar archivo: ${error.message}`)
    }
    
  } catch (error) {
    console.error('Error en deleteFile:', error)
    throw error
  }
}

/**
 * Lista archivos en un directorio específico del bucket
 * 
 * @param folderPath - Ruta del directorio (ej: 'rfps', 'proposals')
 * @returns Promise con lista de paths de archivos
 * 
 * @throws Error si no se pueden listar los archivos
 */
export async function listFiles(folderPath: string): Promise<string[]> {
  try {
    const supabase = createServiceRoleSupabase()
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
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

/**
 * Verifica si un archivo existe en el Storage
 * 
 * @param path - Path del archivo a verificar
 * @returns Promise que resuelve true si el archivo existe, false si no
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleSupabase()
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path.split('/').slice(0, -1).join('/'))
    
    if (error) {
      return false
    }
    
    const fileName = path.split('/').pop()
    return data?.some(file => file.name === fileName) || false
    
  } catch (error) {
    console.error('Error en fileExists:', error)
    return false
  }
}