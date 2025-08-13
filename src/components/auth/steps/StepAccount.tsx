'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { SignupData, ValidationErrors } from '@/types/auth'

interface StepAccountProps {
  data: SignupData
  updateData: (data: Partial<SignupData>) => void
  errors: ValidationErrors
}

export function StepAccount({ data, updateData, errors }: StepAccountProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const getPasswordStrength = (password: string) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return 'text-red-500'
    if (strength <= 3) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 2) return 'Débil'
    if (strength <= 3) return 'Media'
    return 'Fuerte'
  }

  const passwordStrength = getPasswordStrength(data.password)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          className={`${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
          autoFocus
        />
        {errors.email && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.email}</span>
          </div>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={data.password}
            onChange={(e) => updateData({ password: e.target.value })}
            className={`pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {data.password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Fortaleza de la contraseña:</span>
              <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength)}`}>
                {getPasswordStrengthText(passwordStrength)}
              </span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
                    level <= passwordStrength
                      ? getPasswordStrengthColor(passwordStrength).replace('text-', 'bg-')
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Password Requirements */}
        <div className="space-y-2">
          <p className="text-xs text-gray-600">La contraseña debe contener:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { condition: data.password.length >= 8, text: 'Al menos 8 caracteres' },
              { condition: /[a-z]/.test(data.password), text: 'Una letra minúscula' },
              { condition: /[A-Z]/.test(data.password), text: 'Una letra mayúscula' },
              { condition: /\d/.test(data.password), text: 'Un número' }
            ].map((req, index) => (
              <div key={index} className="flex items-center space-x-2">
                {req.condition ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-xs ${req.condition ? 'text-green-600' : 'text-gray-500'}`}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {errors.password && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.password}</span>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirmar Contraseña
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={data.confirmPassword}
            onChange={(e) => updateData({ confirmPassword: e.target.value })}
            className={`pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Password Match Indicator */}
        {data.confirmPassword && (
          <div className="flex items-center space-x-2">
            {data.password === data.confirmPassword ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs ${
              data.password === data.confirmPassword ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.password === data.confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
            </span>
          </div>
        )}

        {errors.confirmPassword && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.confirmPassword}</span>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs font-bold">ℹ</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Seguridad de la cuenta</p>
            <p className="text-xs text-blue-700 mt-1">
              Tu contraseña debe ser única y no debe ser compartida con nadie. 
              Recomendamos usar un gestor de contraseñas para mayor seguridad.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
