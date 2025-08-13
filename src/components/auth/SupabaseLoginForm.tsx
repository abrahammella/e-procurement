'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, AlertCircle, Loader2, LogIn, Mail, Lock, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LoginData {
  email: string
  password: string
  rememberMe: boolean
}

interface ValidationErrors {
  [key: string]: string
}

export function SupabaseLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [generalError, setGeneralError] = useState<string>('')

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      // Use getUser() instead of getSession() for better security
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user && !error) {
        // User is already logged in, redirect to dashboard or intended page
        const redirectTo = searchParams.get('redirect') || '/dashboard'
        router.push(redirectTo)
      }
    }

    checkAuth()
  }, [router, searchParams])

  // Load saved email from localStorage if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('eproc_remembered_email')
    if (savedEmail) {
      setData(prev => ({ ...prev, email: savedEmail, rememberMe: true }))
    }
  }, [])

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Email validation
    if (!data.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Formato de email inválido'
    }

    // Password validation
    if (!data.password) {
      newErrors.password = 'La contraseña es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof LoginData, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setGeneralError('')

    try {
      // Attempt to sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password
      })

      if (authError) {
        console.error('Login error:', authError)
        
        // Handle specific error cases
        if (authError.message.includes('Invalid login credentials')) {
          setGeneralError('Email o contraseña incorrectos. Verifica tus credenciales.')
        } else if (authError.message.includes('Email not confirmed')) {
          setGeneralError('Tu email no ha sido confirmado. Revisa tu bandeja de entrada.')
        } else if (authError.message.includes('Too many requests')) {
          setGeneralError('Demasiados intentos fallidos. Intenta nuevamente en unos minutos.')
        } else {
          setGeneralError(authError.message)
        }
        return
      }

      if (authData.user) {
        console.log('Login exitoso:', authData.user.id)
        
        // Handle "Remember Me" functionality
        if (data.rememberMe) {
          localStorage.setItem('eproc_remembered_email', data.email)
        } else {
          localStorage.removeItem('eproc_remembered_email')
        }

        // Get user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          // Still redirect to dashboard even if profile fetch fails
        }

        // Redirect to intended page or dashboard
        const redirectTo = searchParams.get('redirect') || '/dashboard'
        router.push(redirectTo)
      }
    } catch (error: any) {
      console.error('Unexpected error:', error)
      setGeneralError('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setGeneralError('Por favor ingresa un email válido para recuperar tu contraseña.')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        setGeneralError('Error al enviar el email de recuperación. Intenta nuevamente.')
      } else {
        alert('Se ha enviado un email de recuperación de contraseña a tu dirección de correo.')
      }
    } catch (error) {
      setGeneralError('Error inesperado. Intenta nuevamente.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-0 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto"
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">EP</span>
            </div>
          </motion.div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Bienvenido de vuelta
            </CardTitle>
            <CardDescription className="text-gray-600">
              Inicia sesión en tu cuenta de E-Procurement
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Mail className="h-4 w-4 text-navy-600" />
                <span>Email</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={data.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-sm text-red-600"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email}</span>
                </motion.div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Lock className="h-4 w-4 text-navy-600" />
                <span>Contraseña</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={data.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-sm text-red-600"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password}</span>
                </motion.div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={data.rememberMe}
                  onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Recordarme
                </Label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-navy-600 hover:text-navy-700 hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* General Error Alert */}
            {generalError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    {generalError}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-navy-600 hover:bg-navy-700 text-white py-3 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Iniciar Sesión</span>
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">¿No tienes una cuenta?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Button
            variant="outline"
            onClick={() => router.push('/signup/wizard')}
            className="w-full border-navy-200 text-navy-700 hover:bg-navy-50 transition-all duration-200"
          >
            <User className="h-4 w-4 mr-2" />
            Crear cuenta
          </Button>
        </CardContent>
      </Card>

      {/* Security Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <p className="text-xs text-gray-500">
          Al iniciar sesión, aceptas nuestros{' '}
          <a href="/terms" className="text-navy-600 hover:underline">
            términos de servicio
          </a>{' '}
          y{' '}
          <a href="/privacy" className="text-navy-600 hover:underline">
            política de privacidad
          </a>
        </p>
      </motion.div>
    </motion.div>
  )
}
