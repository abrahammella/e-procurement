import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Lock, CheckCircle, XCircle } from 'lucide-react'
import { SignupData } from '../SignupStepper'

interface StepAccountProps {
  data: SignupData
  updateData: (data: Partial<SignupData>) => void
  errors: Record<string, string>
}

export function StepAccount({ data, updateData, errors }: StepAccountProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    <div className="space-y-6">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-navy-800">
          Correo Electrónico *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
          <Input
            id="email"
            type="email"
            placeholder="usuario@empresa.com"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            className={`pl-12 h-14 text-base border-2 transition-all duration-300 ease-out rounded-xl ${
              errors.email 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' 
                : 'border-navy-200 focus:border-navy-500 focus:ring-navy-200/50'
            }`}
            aria-describedby={errors.email ? "email-error" : "email-help"}
          />
        </div>
        {errors.email ? (
          <p id="email-error" className="text-sm text-red-600 flex items-center space-x-1">
            <XCircle className="h-4 w-4" />
            <span>{errors.email}</span>
          </p>
        ) : (
          <p id="email-help" className="text-xs text-navy-500">
            Este será tu nombre de usuario para acceder al sistema
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-navy-800">
          Contraseña *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={data.password}
            onChange={(e) => updateData({ password: e.target.value })}
            className={`pl-12 pr-12 h-14 text-base border-2 transition-all duration-300 ease-out rounded-xl ${
              errors.password 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' 
                : 'border-navy-200 focus:border-navy-500 focus:ring-navy-200/50'
            }`}
            aria-describedby={errors.password ? "password-error" : "password-help"}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-all duration-200 hover:scale-110"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        
        {/* Password strength indicator */}
        {data.password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy-600">Fortaleza de la contraseña:</span>
              <span className={`text-xs font-medium ${passwordStrength.color}`}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength.score <= 1 ? 'bg-red-500' :
                  passwordStrength.score <= 2 ? 'bg-orange-500' :
                  passwordStrength.score <= 3 ? 'bg-yellow-500' :
                  passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {errors.password ? (
          <p id="password-error" className="text-sm text-red-600 flex items-center space-x-1">
            <XCircle className="h-4 w-4" />
            <span>{errors.password}</span>
          </p>
        ) : (
          <div id="password-help" className="space-y-2">
            <p className="text-xs text-navy-500">La contraseña debe cumplir con:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              <div className={`flex items-center space-x-2 ${
                data.password.length >= 8 ? 'text-green-600' : 'text-navy-400'
              }`}>
                {data.password.length >= 8 ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                /(?=.*[A-Z])/.test(data.password) ? 'text-green-600' : 'text-navy-400'
              }`}>
                {/(?=.*[A-Z])/.test(data.password) ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span>Al menos 1 mayúscula</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                /(?=.*\d)/.test(data.password) ? 'text-green-600' : 'text-navy-400'
              }`}>
                {/(?=.*\d)/.test(data.password) ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span>Al menos 1 número</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                data.password.length >= 12 ? 'text-green-600' : 'text-navy-400'
              }`}>
                {data.password.length >= 12 ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span>Recomendado 12+ caracteres</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-navy-800">
          Confirmar Contraseña *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={data.confirmPassword}
            onChange={(e) => updateData({ confirmPassword: e.target.value })}
            className={`pl-12 pr-12 h-14 text-base border-2 transition-all duration-300 ease-out rounded-xl ${
              errors.confirmPassword 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200/50' 
                : data.confirmPassword && data.password === data.confirmPassword
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200/50'
                : 'border-navy-200 focus:border-navy-500 focus:ring-navy-200/50'
            }`}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : "confirmPassword-help"}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-all duration-200 hover:scale-110"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        
        {/* Password match indicator */}
        {data.confirmPassword && (
          <div className="flex items-center space-x-2">
            {data.password === data.confirmPassword ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs ${
              data.password === data.confirmPassword ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.password === data.confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
            </span>
          </div>
        )}
        
        {errors.confirmPassword ? (
          <p id="confirmPassword-error" className="text-sm text-red-600 flex items-center space-x-1">
            <XCircle className="h-4 w-4" />
            <span>{errors.confirmPassword}</span>
          </p>
        ) : (
          <p id="confirmPassword-help" className="text-xs text-navy-500">
            Repite la contraseña para confirmar
          </p>
        )}
      </div>

      {/* Security Note */}
      <div className="bg-navy-50 border border-navy-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-navy-200 flex items-center justify-center mt-0.5">
            <span className="text-xs text-navy-600 font-bold">!</span>
          </div>
          <div className="text-sm text-navy-700">
            <p className="font-medium mb-1">Seguridad de la cuenta</p>
            <p>Tu contraseña se almacena de forma segura y encriptada. Nunca compartas tus credenciales de acceso.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
