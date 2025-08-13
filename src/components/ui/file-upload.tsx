'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadPdfToBucket, UploadResult } from '@/lib/storage'

interface FileUploadProps {
  keyPrefix: string
  onUploadSuccess: (result: UploadResult) => void
  onUploadError?: (error: string) => void
  maxSize?: number // en MB
  className?: string
  label?: string
  description?: string
}

export function FileUpload({
  keyPrefix,
  onUploadSuccess,
  onUploadError,
  maxSize = 20,
  className = '',
  label = 'Subir PDF',
  description = 'Selecciona un archivo PDF para subir'
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validar tipo de archivo
    if (selectedFile.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      return
    }

    // Validar tamaño
    const fileSizeMB = selectedFile.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      setError(`El archivo no puede exceder ${maxSize}MB`)
      return
    }

    setFile(selectedFile)
    setError(null)
    setSuccess(false)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setSuccess(false)
    setUploadProgress(0)

    try {
      // Simular progreso (en una implementación real, esto vendría del upload)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await uploadPdfToBucket(file, keyPrefix)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setSuccess(true)
      
      // Llamar callback de éxito
      onUploadSuccess(result)
      
      // Resetear estado después de un delay
      setTimeout(() => {
        setFile(null)
        setSuccess(false)
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error inesperado al subir el archivo')
      onUploadError?.(error instanceof Error ? error.message : 'Error inesperado')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {label}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input de archivo */}
        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Máximo {maxSize}MB, solo archivos PDF
          </p>
        </div>

        {/* Archivo seleccionado */}
        {file && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Barra de progreso */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Subiendo archivo...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensajes de estado */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Archivo subido exitosamente
            </AlertDescription>
          </Alert>
        )}

        {/* Botón de upload */}
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Subir PDF
            </>
          )}
        </Button>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• El archivo se organizará en: <Badge variant="outline">{keyPrefix}/</Badge></p>
          <p>• Se generará un nombre único con timestamp</p>
          <p>• Solo usuarios autenticados pueden acceder</p>
        </div>
      </CardContent>
    </Card>
  )
}
