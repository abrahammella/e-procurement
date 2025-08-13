import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Mail, Phone, MapPin, Hash, XCircle } from 'lucide-react'
import { SignupData } from '../SignupStepper'

interface StepCompanyProps {
  data: SignupData
  updateData: (data: Partial<SignupData>) => void
  errors: Record<string, string>
}

const COUNTRIES = [
  'República Dominicana',
  'Estados Unidos',
  'México',
  'Colombia',
  'Argentina',
  'Chile',
  'Perú',
  'Brasil',
  'España',
  'Canadá'
]

const CITIES = {
  'República Dominicana': ['Santo Domingo', 'Santiago', 'La Romana', 'San Pedro de Macorís', 'San Francisco de Macorís'],
  'Estados Unidos': ['Nueva York', 'Los Ángeles', 'Chicago', 'Houston', 'Phoenix'],
  'México': ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta'],
  'Perú': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura'],
  'Brasil': ['São Paulo', 'Río de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza'],
  'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza'],
  'Canadá': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton']
}

export function StepCompany({ data, updateData, errors }: StepCompanyProps) {
  const availableCities = data.country ? CITIES[data.country as keyof typeof CITIES] || [] : []

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-sm font-medium text-navy-800">
          Nombre Legal de la Empresa *
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
          <Input
            id="companyName"
            type="text"
            placeholder="Nombre completo de la empresa"
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
            className={`pl-12 h-14 text-base border-2 transition-all duration-300 ease-out rounded-xl ${
              errors.companyName 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' 
                : 'border-navy-200 focus:border-navy-500 focus:ring-navy-200/50'
            }`}
            aria-describedby={errors.companyName ? "companyName-error" : "companyName-help"}
          />
        </div>
        {errors.companyName ? (
          <p id="companyName-error" className="text-sm text-red-600 flex items-center space-x-1">
            <XCircle className="h-4 w-4" />
            <span>{errors.companyName}</span>
          </p>
        ) : (
          <p id="companyName-help" className="text-xs text-navy-500">
            Nombre oficial registrado en el registro mercantil
          </p>
        )}
      </div>

      {/* RNC */}
      <div className="space-y-2">
        <Label htmlFor="rnc" className="text-sm font-medium text-navy-800">
          Número de RNC *
        </Label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
          <Input
            id="rnc"
            type="text"
            placeholder="123-45678-9"
            value={data.rnc}
            onChange={(e) => updateData({ rnc: e.target.value })}
            className={`pl-12 h-14 text-base border-2 transition-all duration-300 ease-out rounded-xl ${
              errors.rnc 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' 
                : 'border-navy-200 focus:border-navy-500 focus:ring-navy-200/50'
            }`}
            aria-describedby={errors.rnc ? "rnc-error" : "rnc-help"}
          />
        </div>
        {errors.rnc ? (
          <p id="rnc-error" className="text-sm text-red-600 flex items-center space-x-1">
            <XCircle className="h-4 w-4" />
            <span>{errors.rnc}</span>
          </p>
        ) : (
          <p id="rnc-help" className="text-xs text-navy-500">
            Registro Nacional de Contribuyentes (formato: 123-45678-9)
          </p>
        )}
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <Label htmlFor="contactEmail" className="text-sm font-medium text-navy-800">
          Email de Contacto *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
          <Input
            id="contactEmail"
            type="email"
            placeholder="contacto@empresa.com"
            value={data.contactEmail}
            onChange={(e) => updateData({ contactEmail: e.target.value })}
            className={`pl-12 h-14 text-base border-2 transition-all duration-300 ease-out rounded-xl ${
              errors.contactEmail 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' 
                : 'border-navy-200 focus:border-navy-500 focus:ring-navy-200/50'
            }`}
            aria-describedby={errors.contactEmail ? "contactEmail-error" : "contactEmail-help"}
          />
        </div>
        {errors.contactEmail ? (
          <p id="contactEmail-error" className="text-sm text-red-600 flex items-center space-x-1">
            <XCircle className="h-4 w-4" />
            <span>{errors.contactEmail}</span>
          </p>
        ) : (
          <p id="contactEmail-help" className="text-xs text-navy-500">
            Email principal para comunicaciones oficiales
          </p>
        )}
      </div>

      {/* Country and City - Desktop 2 columns, Mobile 1 column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium text-navy-800">
            País *
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
            <select
              id="country"
              value={data.country}
              onChange={(e) => {
                updateData({ 
                  country: e.target.value,
                  city: '' // Reset city when country changes
                })
              }}
              className={`w-full pl-12 h-14 text-base border-2 transition-all duration-300 ease-out rounded-xl appearance-none bg-white ${
                errors.country 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' 
                  : 'border-navy-200 focus:border-navy-500 focus:ring-navy-200/50'
              }`}
              aria-describedby={errors.country ? "country-error" : "country-help"}
            >
              <option value="">Seleccionar país</option>
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="h-5 w-5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.country ? (
            <p id="country-error" className="text-sm text-red-600 flex items-center space-x-1">
              <XCircle className="h-4 w-4" />
              <span>{errors.country}</span>
            </p>
          ) : (
            <p id="country-help" className="text-xs text-navy-500">
              País donde opera la empresa
            </p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium text-navy-800">
            Ciudad *
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
            <select
              id="city"
              value={data.city}
              onChange={(e) => updateData({ city: e.target.value })}
              disabled={!data.country}
              className={`w-full pl-12 h-14 text-base border-2 transition-all duration-300 ease-out rounded-xl appearance-none bg-white ${
                !data.country 
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                  : errors.city 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' 
                  : 'border-navy-200 focus:border-navy-500 focus:ring-navy-200/50'
              }`}
              aria-describedby={errors.city ? "city-error" : "city-help"}
            >
              <option value="">{data.country ? 'Seleccionar ciudad' : 'Primero seleccione un país'}</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="h-5 w-5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.city ? (
            <p id="city-error" className="text-sm text-red-600 flex items-center space-x-1">
              <XCircle className="h-4 w-4" />
              <span>{errors.city}</span>
            </p>
          ) : (
            <p id="city-help" className="text-xs text-navy-500">
              Ciudad principal de operaciones
            </p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-navy-800">
          Teléfono (Opcional)
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (809) 555-0123"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            className="pl-12 h-14 text-base border-2 border-navy-200 focus:border-navy-500 focus:ring-navy-200/50 transition-all duration-300 ease-out rounded-xl"
            aria-describedby="phone-help"
          />
        </div>
        <p id="phone-help" className="text-xs text-navy-500">
          Número de teléfono principal de la empresa
        </p>
      </div>

      {/* Additional Information */}
      <div className="space-y-2">
        <Label htmlFor="additionalInfo" className="text-sm font-medium text-navy-800">
          Información Adicional (Opcional)
        </Label>
        <Textarea
          id="additionalInfo"
          placeholder="Descripción de la empresa, sector de actividad, tamaño, etc."
          className="min-h-[100px] text-base border-2 border-navy-200 focus:border-navy-500 focus:ring-navy-200/50 transition-all duration-300 ease-out rounded-xl resize-none"
        />
        <p className="text-xs text-navy-500">
          Información adicional que nos ayude a conocer mejor su empresa
        </p>
      </div>

      {/* Company Info Note */}
      <div className="bg-navy-50 border border-navy-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-navy-200 flex items-center justify-center mt-0.5">
            <span className="text-xs text-navy-600 font-bold">i</span>
          </div>
          <div className="text-sm text-navy-700">
            <p className="font-medium mb-1">Información de la Empresa</p>
            <p>Esta información será utilizada para verificar la identidad de su empresa y establecer comunicaciones oficiales. Asegúrese de que todos los datos sean correctos y estén actualizados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
