'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Trash2
} from 'lucide-react'
// Función slugify para preview (copia de lib/storage.ts)
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') 
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface UploadedFile {
  path: string
  signedUrl: string
  originalName: string
  size: string
  timestamp: number
}

export function StorageTest() {
  const [file, setFile] = useState<File | null>(null)
  const [prefix, setPrefix] = useState('test')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
    }
  }

  // Subir archivo usando API route
  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona un archivo PDF')
      return
    }

    if (!prefix.trim()) {
      setError('Ingresa un prefijo válido')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append('file', file)
      formData.append('prefix', prefix.trim())

      // Llamar a la API route de upload
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error en la subida')
      }
      
      const uploadedFile: UploadedFile = {
        path: result.path,
        signedUrl: result.signedUrl,
        originalName: file.name,
        size: formatFileSize(file.size),
        timestamp: Date.now()
      }

      setUploadedFiles(prev => [uploadedFile, ...prev])
      setSuccess(`Archivo subido exitosamente: ${result.path}`)
      
      // Limpiar formulario
      setFile(null)
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error al subir archivo: ${errorMessage}`)
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  // Generar nueva URL firmada usando API route
  const handleRefreshUrl = async (fileIndex: number) => {
    const fileToRefresh = uploadedFiles[fileIndex]
    if (!fileToRefresh) return

    try {
      const response = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: fileToRefresh.path,
          expiresInSec: 600, // 10 minutos
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al generar URL firmada')
      }
      
      setUploadedFiles(prev => 
        prev.map((f, index) => 
          index === fileIndex 
            ? { ...f, signedUrl: result.signedUrl, timestamp: Date.now() }
            : f
        )
      )
      
      setSuccess(`URL renovada para: ${fileToRefresh.originalName}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error al renovar URL: ${errorMessage}`)
    }
  }

  // Eliminar archivo usando API route
  const handleDelete = async (fileIndex: number) => {
    const fileToDelete = uploadedFiles[fileIndex]
    if (!fileToDelete) return

    if (!confirm(`¿Estás seguro de eliminar ${fileToDelete.originalName}?`)) {
      return
    }

    try {
      const response = await fetch('/api/storage/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: fileToDelete.path,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al eliminar archivo')
      }
      
      setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex))
      setSuccess(`Archivo eliminado: ${fileToDelete.originalName}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error al eliminar archivo: ${errorMessage}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Test de Supabase Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulario de upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file-input">Archivo PDF (máx. 20MB)</Label>
              <Input
                id="file-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {file && (
                <div className="text-sm text-gray-600">
                  <p>📄 {file.name}</p>
                  <p>📏 {formatFileSize(file.size)}</p>
                  <p>🏷️ Slug: "{slugify(file.name.replace(/\.pdf$/i, ''))}"</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">Prefijo (carpeta)</Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="ej: rfps, proposals, invoices"
                disabled={isUploading}
              />
              <p className="text-sm text-gray-500">
                El archivo se guardará en: {prefix}/{Date.now()}-slug.pdf
              </p>
            </div>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading || !prefix.trim()}
            className="w-full md:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Archivo
              </>
            )}
          </Button>

          {/* Mensajes */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de archivos subidos */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Archivos Subidos ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={uploadedFile.path} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{uploadedFile.originalName}</h4>
                      <p className="text-sm text-gray-500 truncate">{uploadedFile.path}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{uploadedFile.size}</Badge>
                        <Badge variant="outline">
                          URL válida por {Math.max(0, Math.floor((uploadedFile.timestamp + 600000 - Date.now()) / 60000))} min
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(uploadedFile.signedUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshUrl(index)}
                      >
                        🔄
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>1. <strong>Configurar env.local:</strong> Añade SUPABASE_SERVICE_ROLE_KEY con tu service role key</p>
          <p>2. <strong>Bucket:</strong> Asegúrate de tener un bucket llamado "docs" en Supabase Storage</p>
          <p>3. <strong>Políticas:</strong> Configura las políticas RLS para permitir acceso según roles</p>
          <p>4. <strong>Validaciones:</strong> Solo archivos PDF, máximo 20MB</p>
          <p>5. <strong>URLs firmadas:</strong> Válidas por 10 minutos, puedes renovarlas</p>
        </CardContent>
      </Card>
    </div>
  )
}