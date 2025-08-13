'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/ui/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, Download, Trash2 } from 'lucide-react'
import { UploadResult, getSignedUrl, deleteFile } from '@/lib/storage'

export function StorageExample() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([])
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const handleUploadSuccess = (result: UploadResult) => {
    setUploadedFiles(prev => [...prev, result])
  }

  const handleUploadError = (error: string) => {
    console.error('Error en upload:', error)
    // Aquí podrías mostrar un toast o notificación
  }

  const handleDownload = async (filePath: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [filePath]: true }))
      
      const signedUrl = await getSignedUrl(filePath, 3600) // 1 hora
      
      // Crear un enlace temporal para descargar
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = filePath.split('/').pop() || 'archivo.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error al descargar:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [filePath]: false }))
    }
  }

  const handleDelete = async (filePath: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [filePath]: true }))
      
      await deleteFile(filePath)
      
      // Remover de la lista local
      setUploadedFiles(prev => prev.filter(file => file.path !== filePath))
      
    } catch (error) {
      console.error('Error al eliminar:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [filePath]: false }))
    }
  }

  const getFileType = (path: string): string => {
    const prefix = path.split('/')[0]
    switch (prefix) {
      case 'rfps': return 'RFP'
      case 'proposals': return 'Propuesta'
      case 'invoices': return 'Factura'
      case 'contracts': return 'Contrato'
      default: return 'Documento'
    }
  }

  const getFileTypeColor = (path: string): string => {
    const prefix = path.split('/')[0]
    switch (prefix) {
      case 'rfps': return 'bg-blue-100 text-blue-800'
      case 'proposals': return 'bg-green-100 text-green-800'
      case 'invoices': return 'bg-orange-100 text-orange-800'
      case 'contracts': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Sistema de Storage - Ejemplo</h1>
        <p className="text-muted-foreground mt-2">
          Demostración del sistema de upload y gestión de archivos PDF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload de RFPs */}
        <FileUpload
          keyPrefix="rfps"
          label="Subir RFP"
          description="Documentos de solicitud de propuestas"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {/* Upload de Propuestas */}
        <FileUpload
          keyPrefix="proposals"
          label="Subir Propuesta"
          description="Propuestas de proveedores"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload de Facturas */}
        <FileUpload
          keyPrefix="invoices"
          label="Subir Factura"
          description="Facturas de proveedores"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {/* Upload de Contratos */}
        <FileUpload
          keyPrefix="contracts"
          label="Subir Contrato"
          description="Contratos y acuerdos"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </div>

      <Separator />

      {/* Lista de archivos subidos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Archivos Subidos</h2>
        
        {uploadedFiles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay archivos subidos aún. Sube tu primer documento usando los formularios de arriba.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getFileTypeColor(file.path)}>
                            {getFileType(file.path)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium">{file.path.split('/').pop()}</p>
                        <p className="text-sm text-muted-foreground">
                          Ruta: {file.path}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.path)}
                        disabled={loadingStates[file.path]}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {loadingStates[file.path] ? 'Descargando...' : 'Descargar'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.path)}
                        disabled={loadingStates[file.path]}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {loadingStates[file.path] ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Información del sistema */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>Bucket:</strong> documents (privado, solo usuarios autenticados)</p>
          <p>• <strong>Límite de tamaño:</strong> 20MB por archivo</p>
          <p>• <strong>Formato:</strong> Solo archivos PDF</p>
          <p>• <strong>Organización:</strong> Archivos organizados por tipo en subdirectorios</p>
          <p>• <strong>Seguridad:</strong> URLs firmadas con expiración de 10 minutos</p>
          <p>• <strong>Acceso:</strong> Controlado por políticas RLS de Supabase</p>
        </CardContent>
      </Card>
    </div>
  )
}
