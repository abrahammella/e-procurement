import React, { useState, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, FileText, Upload, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { SignupData } from '../SignupStepper'

interface StepComplianceProps {
  data: SignupData
  updateData: (data: Partial<SignupData>) => void
  errors: Record<string, string>
}

const CERTIFICATIONS = [
  'ISO 9001 - Gestión de Calidad',
  'ISO 14001 - Gestión Ambiental',
  'ISO 45001 - Gestión de Seguridad y Salud Ocupacional',
  'ISO 27001 - Gestión de Seguridad de la Información',
  'OHSAS 18001 - Seguridad y Salud Ocupacional',
  'ISO 50001 - Gestión de Energía',
  'ISO 22000 - Gestión de Seguridad Alimentaria',
  'ISO 13485 - Dispositivos Médicos',
  'ISO 20000 - Gestión de Servicios TI',
  'ISO 31000 - Gestión de Riesgos'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['application/pdf']

export function StepCompliance({ data, updateData, errors }: StepComplianceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`El archivo ${file.name} no es un PDF válido`)
        return false
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`El archivo ${file.name} excede el tamaño máximo de 5MB`)
        return false
      }
      
      return true
    })

    updateData({ documents: [...data.documents, ...newFiles] })
  }

  const removeFile = (index: number) => {
    const newFiles = data.documents.filter((_, i) => i !== index)
    updateData({ documents: newFiles })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const toggleCertification = (certification: string) => {
    const newCertifications = data.certifications.includes(certification)
      ? data.certifications.filter(c => c !== certification)
      : [...data.certifications, certification]
    
    updateData({ certifications: newCertifications })
  }

  return (
    <div className="space-y-8">
      {/* Information Verification */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="isInformationVerified"
            checked={data.isInformationVerified}
            onCheckedChange={(checked) => updateData({ isInformationVerified: checked as boolean })}
            className="mt-1"
          />
          <div className="space-y-2">
            <Label htmlFor="isInformationVerified" className="text-base font-medium text-navy-800">
              Declaro que la información proporcionada es verídica y completa
            </Label>
            <p className="text-sm text-navy-600">
              Al marcar esta casilla, confirma que toda la información ingresada en los pasos anteriores 
              es correcta y actualizada. Esta declaración es legalmente vinculante.
            </p>
          </div>
        </div>
        
        {errors.isInformationVerified && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{errors.isInformationVerified}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="border-t border-navy-200 pt-6">
        {/* Certifications */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-navy-600" />
            <h3 className="text-lg font-medium text-navy-800">Certificaciones (Opcional)</h3>
          </div>
          <p className="text-sm text-navy-600">
            Seleccione las certificaciones que posee su empresa. Esto ayudará a mejorar su perfil 
            y aumentar las oportunidades de negocio.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CERTIFICATIONS.map((certification) => (
              <div key={certification} className="flex items-center space-x-3">
                <Checkbox
                  id={`cert-${certification}`}
                  checked={data.certifications.includes(certification)}
                  onCheckedChange={() => toggleCertification(certification)}
                />
                <Label 
                  htmlFor={`cert-${certification}`} 
                  className="text-sm text-navy-700 cursor-pointer"
                >
                  {certification}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-navy-200 pt-6">
        {/* Document Upload */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-navy-600" />
            <h3 className="text-lg font-medium text-navy-800">Documentos de Soporte (Opcional)</h3>
          </div>
          <p className="text-sm text-navy-600">
            Suba documentos PDF que respalden la información proporcionada (certificados, 
            licencias, registros, etc.). Máximo 5MB por archivo.
          </p>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-navy-500 bg-navy-50' 
                : 'border-navy-200 hover:border-navy-300 hover:bg-navy-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-navy-400 mb-4" />
            <p className="text-lg font-medium text-navy-700 mb-2">
              Arrastra archivos PDF aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-navy-500 mb-4">
              Solo archivos PDF, máximo 5MB por archivo
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white hover:bg-navy-50"
            >
              Seleccionar Archivos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Uploaded Files */}
          {data.documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-navy-800">Archivos subidos:</h4>
              {data.documents.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-navy-50 rounded-lg border border-navy-200">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-navy-600" />
                    <div>
                      <p className="text-sm font-medium text-navy-800">{file.name}</p>
                      <p className="text-xs text-navy-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compliance Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Importante - Cumplimiento Legal</p>
            <p>
              La información proporcionada será verificada por nuestro equipo de compliance. 
              Asegúrese de que todos los documentos sean legítimos y estén vigentes. 
              La falsificación de documentos puede resultar en la suspensión permanente de la cuenta.
            </p>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-navy-50 border border-navy-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-navy-600 mt-0.5" />
          <div className="text-sm text-navy-700">
            <p className="font-medium mb-1">Seguridad de Documentos</p>
            <p>
              Todos los documentos se almacenan de forma segura y encriptada. Solo personal autorizado 
              tiene acceso a esta información para fines de verificación y compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
