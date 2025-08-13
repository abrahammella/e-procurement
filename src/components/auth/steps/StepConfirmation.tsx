'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Shield, Mail, User, Phone, Globe } from 'lucide-react'
import { SignupData, ValidationErrors } from '@/types/auth'

interface StepConfirmationProps {
  data: SignupData
  updateData: (data: Partial<SignupData>) => void
  errors: ValidationErrors
}

export function StepConfirmation({ data, updateData, errors }: StepConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Data Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Resumen de tu información</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Mail className="h-4 w-4 text-navy-600" />
              <span>Información de la cuenta</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{data.email}</span>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <User className="h-4 w-4 text-navy-600" />
              <span>Información personal</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium text-gray-900">{data.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Teléfono:</span>
                <span className="font-medium text-gray-900">{data.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">País:</span>
                <span className="font-medium text-gray-900">{data.country}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Términos y condiciones</h3>
        
        <div className="space-y-4">
          {/* Terms Acceptance */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptTerms"
              checked={data.acceptTerms}
              onCheckedChange={(checked) => updateData({ acceptTerms: checked as boolean })}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="acceptTerms" className="text-sm font-medium text-gray-700">
                Acepto los términos y condiciones
              </Label>
              <p className="text-xs text-gray-500">
                He leído y acepto los{' '}
                <a href="/terms" className="text-navy-600 hover:text-navy-700 underline">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="/privacy" className="text-navy-600 hover:text-navy-700 underline">
                  política de privacidad
                </a>{' '}
                de E-Procurement.
              </p>
            </div>
          </div>

          {errors.acceptTerms && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.acceptTerms}</span>
            </div>
          )}

          {/* Marketing Consent */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptMarketing"
              checked={data.acceptMarketing}
              onCheckedChange={(checked) => updateData({ acceptMarketing: checked as boolean })}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor="acceptMarketing" className="text-sm font-medium text-gray-700">
                Acepto recibir comunicaciones de marketing (opcional)
              </Label>
              <p className="text-xs text-gray-500">
                Me gustaría recibir noticias, actualizaciones y ofertas especiales por email. 
                Puedes cancelar en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security and Privacy Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Seguridad y privacidad</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Security */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Seguridad de nivel bancario</p>
                <p className="text-xs text-green-700 mt-1">
                  Tu cuenta está protegida con encriptación AES-256 y autenticación de dos factores opcional.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">🔒</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Privacidad garantizada</p>
                <p className="text-xs text-blue-700 mt-1">
                  Tus datos personales están protegidos y nunca se comparten sin tu consentimiento explícito.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Confirmation */}
      <div className="p-6 bg-navy-50 rounded-lg border border-navy-200">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-navy-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-navy-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-navy-900">¡Estás listo para crear tu cuenta!</h3>
            <p className="text-sm text-navy-700 mt-1">
              Al hacer clic en "Crear Cuenta", confirmas que toda la información proporcionada es correcta 
              y aceptas nuestros términos y condiciones.
            </p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="h-5 w-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-yellow-600 text-xs font-bold">⚠</span>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-900">Importante</p>
            <p className="text-xs text-yellow-700 mt-1">
              Después de crear tu cuenta, recibirás un email de confirmación. 
              Debes hacer clic en el enlace del email para activar tu cuenta.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs font-bold">ℹ</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">¿Tienes preguntas?</p>
            <p className="text-xs text-blue-700 mt-1">
              Si tienes alguna duda sobre el proceso de registro, no dudes en contactarnos 
              a través de nuestro soporte técnico.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
