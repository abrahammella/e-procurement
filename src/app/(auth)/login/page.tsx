'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SupabaseLoginForm } from '@/components/auth/SupabaseLoginForm'
import { useToast } from '@/hooks/useToast'
import { CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // Check for logout success message
    const message = searchParams.get('message')
    if (message === 'logout_success') {
      toast({
        variant: 'success',
        title: 'Sesión cerrada exitosamente',
        description: 'Has cerrado sesión correctamente. ¡Hasta pronto!',
      })
    }
  }, [searchParams, toast])

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-navy-100 to-white">
        <SupabaseLoginForm />
      </div>

      {/* Right side - Hero Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-900 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-16 left-16 w-40 h-40 border-2 border-white/30 rounded-2xl transform rotate-12 animate-float"></div>
          <div className="absolute top-40 right-24 w-32 h-32 border-2 border-white/30 rounded-full animate-float delay-1000"></div>
          <div className="absolute bottom-24 left-20 w-36 h-36 border-2 border-white/30 transform rotate-45 animate-float delay-500"></div>
          <div className="absolute bottom-40 right-40 w-28 h-28 border-2 border-white/30 rounded-full animate-float delay-1500"></div>
        </div>

        {/* Hero content */}
        <div className="relative w-full flex items-center justify-center">
          <div className="text-center text-white px-16 max-w-2xl">
            {/* Logo */}
            <div className="mb-8">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center shadow-2xl mb-6">
                <span className="text-white font-bold text-2xl">EP</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl font-bold mb-6">
              E-Procurement
            </h1>

            {/* Subtitle */}
            <p className="text-2xl leading-relaxed opacity-95 mb-8">
              Gestiona licitaciones, RFPs y proveedores
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-6 text-left">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
                <span className="text-sm">Gestión de RFPs</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
                <span className="text-sm">Proveedores</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
                <span className="text-sm">Análisis</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg">🏆</span>
                </div>
                <span className="text-sm">Calidad</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div className="h-full bg-gradient-to-r from-white to-navy-200 w-full"></div>
        </div>
      </div>
    </div>
  )
}
