import React from 'react'
import { ShoppingCart, CheckCircle, FileText, Users, TrendingUp, Award } from 'lucide-react'

interface AuthShellProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AuthShell({ 
  children, 
  title = "E-Procurement", 
  subtitle = "Gestiona concursos, RFPs y proveedores" 
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-navy-50 to-white">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-900 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-16 left-16 w-40 h-40 border-2 border-white/30 rounded-2xl transform rotate-12 animate-float"></div>
          <div className="absolute top-40 right-24 w-32 h-32 border-2 border-white/30 rounded-full animate-float delay-1000"></div>
          <div className="absolute bottom-24 left-20 w-36 h-36 border-2 border-white/30 transform rotate-45 animate-float delay-500"></div>
          <div className="absolute bottom-40 right-40 w-28 h-28 border-2 border-white/30 rounded-2xl animate-float delay-1500"></div>
        </div>

        {/* Hero content */}
        <div className="relative w-full flex items-center justify-center">
          <div className="text-center text-white px-16 max-w-2xl">
            {/* Logo */}
            <div className="mb-8">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center shadow-2xl mb-6">
                <ShoppingCart className="h-12 w-12 text-white" />
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl font-bold mb-6">
              {title}
            </h1>
            
            {/* Subtitle */}
            <p className="text-2xl leading-relaxed opacity-95 mb-8">
              {subtitle}
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-6 text-left">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm">Gestión de RFPs</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm">Proveedores</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm">Análisis</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
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
