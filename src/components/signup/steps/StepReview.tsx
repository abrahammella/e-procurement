import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  Shield, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react'
import { SignupData } from '../SignupStepper'

interface StepReviewProps {
  data: SignupData
  updateData: (data: Partial<SignupData>) => void
  errors: Record<string, string>
}

export function StepReview({ data, updateData, errors }: StepReviewProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/(?=.*[A-Z])/.test(password)) score++
    if (/(?=.*\d)/.test(password)) score++
    if (password.length >= 12) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
    
    if (score <= 1) return { score, label: 'Débil', color: 'text-red-500' }
    if (score <= 2) return { score, label: 'Regular', color: 'text-orange-500' }
    if (score <= 3) return { score, label: 'Buena', color: 'text-yellow-500' }
    if (score <= 4) return { score, label: 'Fuerte', color: 'text-blue-500' }
    return { score, label: 'Excelente', color: 'text-green-500' }
  }

  const passwordStrength = getPasswordStrength(data.password)

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-navy-600" />
          <h3 className="text-lg font-medium text-navy-800">Información de Cuenta</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy-600">Email</Label>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-navy-400" />
              <span className="text-navy-800">{data.email}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy-600">Fortaleza de Contraseña</Label>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={passwordStrength.color}>
                {passwordStrength.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Company Information */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-navy-600" />
          <h3 className="text-lg font-medium text-navy-800">Información de la Empresa</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy-600">Nombre de la Empresa</Label>
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-navy-400" />
              <span className="text-navy-800">{data.companyName}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy-600">RNC</Label>
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-navy-400" />
              <span className="text-navy-800">{data.rnc}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy-600">Email de Contacto</Label>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-navy-400" />
              <span className="text-navy-800">{data.contactEmail}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy-600">Teléfono</Label>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-navy-400" />
              <span className="text-navy-800">{data.phone || 'No especificado'}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy-600">País</Label>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-navy-400" />
              <span className="text-navy-800">{data.country}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-navy-600">Ciudad</Label>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-navy-400" />
              <span className="text-navy-800">{data.city}</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Compliance Information */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-navy-600" />
          <h3 className="text-lg font-medium text-navy-800">Cumplimiento y Verificación</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {data.isInformationVerified ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm ${data.isInformationVerified ? 'text-green-700' : 'text-red-700'}`}>
              {data.isInformationVerified 
                ? 'Declaración de veracidad confirmada' 
                : 'Declaración de veracidad pendiente'
              }
            </span>
          </div>
          
          {data.certifications.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-navy-600">Certificaciones Seleccionadas</Label>
              <div className="flex flex-wrap gap-2">
                {data.certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {data.documents.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-navy-600">Documentos Subidos</Label>
              <div className="space-y-2">
                {data.documents.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-navy-50 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-navy-500" />
                      <span className="text-sm text-navy-700">{file.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptTerms"
            checked={data.acceptTerms}
            onCheckedChange={(checked) => updateData({ acceptTerms: checked as boolean })}
            className="mt-1"
          />
          <div className="space-y-2">
            <Label htmlFor="acceptTerms" className="text-base font-medium text-navy-800">
              Acepto los Términos y Condiciones
            </Label>
            <p className="text-sm text-navy-600">
              He leído y acepto los{' '}
              <a href="#" className="text-navy-600 hover:text-navy-800 underline font-medium">
                Términos y Condiciones
              </a>
              {' '}y la{' '}
              <a href="#" className="text-navy-600 hover:text-navy-800 underline font-medium">
                Política de Privacidad
              </a>
              {' '}de E-Procurement. Entiendo que al crear mi cuenta, acepto cumplir con todas las 
              políticas y procedimientos de la plataforma.
            </p>
          </div>
        </div>
        
        {errors.acceptTerms && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{errors.acceptTerms}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Final Review Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center mt-0.5">
            <span className="text-xs text-blue-600 font-bold">✓</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Revisión Final Completada</p>
            <p>
              Ha revisado toda la información proporcionada. Si está de acuerdo con todos los datos, 
              haga clic en "Crear Cuenta" para finalizar el proceso de registro. 
              Recibirá un email de confirmación una vez que su cuenta sea creada exitosamente.
            </p>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-navy-50 border border-navy-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-navy-200 flex items-center justify-center mt-0.5">
            <span className="text-xs text-navy-600 font-bold">i</span>
          </div>
          <div className="text-sm text-navy-700">
            <p className="font-medium mb-1">Resumen de Datos</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span>• Email: {data.email}</span>
              <span>• Empresa: {data.companyName}</span>
              <span>• País: {data.country}</span>
              <span>• Ciudad: {data.city}</span>
              <span>• Certificaciones: {data.certifications.length}</span>
              <span>• Documentos: {data.documents.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
