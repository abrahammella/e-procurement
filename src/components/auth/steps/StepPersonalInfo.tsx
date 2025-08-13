'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Globe, User, Phone } from 'lucide-react'
import { SignupData, ValidationErrors } from '@/types/auth'

interface StepPersonalInfoProps {
  data: SignupData
  updateData: (data: Partial<SignupData>) => void
  errors: ValidationErrors
}

const COUNTRIES = [
  { code: 'DO', name: 'República Dominicana' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'PE', name: 'Perú' },
  { code: 'CL', name: 'Chile' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' },
  { code: 'CU', name: 'Cuba' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CA', name: 'Canadá' },
  { code: 'FR', name: 'Francia' },
  { code: 'DE', name: 'Alemania' },
  { code: 'IT', name: 'Italia' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'JP', name: 'Japón' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'Nueva Zelanda' }
].sort((a, b) => a.name.localeCompare(b.name))

export function StepPersonalInfo({ data, updateData, errors }: StepPersonalInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>Nombre Completo</span>
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Tu nombre completo"
          value={data.fullName}
          onChange={(e) => updateData({ fullName: e.target.value })}
          className={`${errors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
          autoFocus
        />
        {errors.fullName && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.fullName}</span>
          </div>
        )}
        <p className="text-xs text-gray-500">
          Ingresa tu nombre completo tal como aparece en tu documento de identidad
        </p>
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
          <Phone className="h-4 w-4" />
          <span>Teléfono</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (809) 555-0123"
          value={data.phone}
          onChange={(e) => updateData({ phone: e.target.value })}
          className={`${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
        />
        {errors.phone && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.phone}</span>
          </div>
        )}
        <p className="text-xs text-gray-500">
          Incluye el código del país. Ejemplo: +1 para Estados Unidos/Canadá, +34 para España
        </p>
      </div>

      {/* Country Field */}
      <div className="space-y-2">
        <Label htmlFor="country" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span>País</span>
        </Label>
        <select
          id="country"
          value={data.country}
          onChange={(e) => updateData({ country: e.target.value })}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 ${
            errors.country ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        >
          <option value="">Selecciona tu país</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
        {errors.country && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.country}</span>
          </div>
        )}
      </div>

      {/* Information Note */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 text-xs font-bold">✓</span>
          </div>
          <div>
            <p className="text-sm font-medium text-green-900">Información personal</p>
            <p className="text-xs text-green-700 mt-1">
              Esta información nos ayuda a personalizar tu experiencia y cumplir con los requisitos legales. 
              Tus datos están protegidos y solo se utilizan para los fines especificados.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs font-bold">🔒</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Privacidad y seguridad</p>
            <p className="text-xs text-blue-700 mt-1">
              Tu información personal está protegida con encriptación de nivel bancario. 
              Nunca compartimos tus datos con terceros sin tu consentimiento explícito.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
