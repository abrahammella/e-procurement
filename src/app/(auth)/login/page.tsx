'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail, Eye, EyeOff, Building2, Users, FileText, ShoppingCart, TrendingUp, Award, Globe, Shield, CheckCircle } from 'lucide-react'

interface CarouselItem {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
}

const carouselItems: CarouselItem[] = [
  {
    icon: <Building2 className="h-16 w-16 text-white" />,
    title: "E-Procurement",
    subtitle: "Gestiona concursos, RFPs y proveedores de manera eficiente",
    color: "from-navy-700 to-navy-900"
  },
  {
    icon: <Users className="h-16 w-16 text-white" />,
    title: "Proveedores Certificados",
    subtitle: "Conecta con proveedores verificados y de calidad",
    color: "from-navy-800 to-navy-900"
  },
  {
    icon: <FileText className="h-16 w-16 text-white" />,
    title: "Gestión de RFPs",
    subtitle: "Crea y administra solicitudes de propuestas de forma profesional",
    color: "from-navy-700 to-navy-800"
  },
  {
    icon: <ShoppingCart className="h-16 w-16 text-white" />,
    title: "Compras Inteligentes",
    subtitle: "Optimiza tus procesos de compra con análisis y métricas",
    color: "from-navy-800 to-navy-900"
  },
  {
    icon: <TrendingUp className="h-16 w-16 text-white" />,
    title: "Análisis Avanzado",
    subtitle: "Toma decisiones basadas en datos y reportes en tiempo real",
    color: "from-navy-700 to-navy-900"
  },
  {
    icon: <Award className="h-16 w-16 text-white" />,
    title: "Calidad Garantizada",
    subtitle: "Asegura la calidad de tus compras con procesos estandarizados",
    color: "from-navy-800 to-navy-900"
  }
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentCarouselIndex((prev: number) => (prev + 1) % carouselItems.length)
        setIsAnimating(false)
      }, 500)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Manual carousel navigation
  const goToSlide = (index: number) => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentCarouselIndex(index)
      setIsAnimating(false)
    }, 500)
  }

  const currentItem = carouselItems[currentCarouselIndex]

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-navy-100 to-white">
        <div className="w-full max-w-md">
          {/* Logo and title - Perfectly centered */}
          <div className="text-center mb-12">
            {/* Enhanced and Centered Logo */}
            <div className="flex justify-center items-center mb-8">
              <div className="relative">
                {/* Main logo container */}
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900 flex items-center justify-center shadow-2xl shadow-navy-300/50 relative overflow-hidden">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-3 left-3 w-12 h-12 border border-white/40 rounded-full"></div>
                    <div className="absolute bottom-3 right-3 w-8 h-8 border border-white/40 rounded-lg"></div>
                  </div>
                  
                  {/* Central icon composition */}
                  <div className="relative z-10 flex items-center justify-center">
                    {/* Main icon - Shopping cart with checkmark */}
                    <div className="relative">
                      <ShoppingCart className="h-14 w-14 text-white" />
                      <div className="absolute -top-2 -right-2 bg-green-400 rounded-full p-1 shadow-lg">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Subtle floating elements */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-navy-400 rounded-full animate-pulse-slow opacity-60"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-navy-500 rounded-full animate-pulse-slow delay-1000 opacity-60"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-navy-400 rounded-full animate-pulse-slow delay-500 opacity-60"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-navy-500 rounded-full animate-pulse-slow delay-1500 opacity-60"></div>
              </div>
            </div>
            
            {/* Title and subtitle - Perfectly centered */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold">
                <span className="bg-gradient-to-r from-navy-700 via-navy-800 to-navy-900 bg-clip-text text-transparent">
                  E-Procurement
                </span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-navy-400 to-navy-600 mx-auto rounded-full"></div>
              <p className="text-xl text-navy-700 font-medium">Plataforma de Gestión de Compras</p>
              <p className="text-base text-navy-600">Inicia sesión en tu cuenta</p>
            </div>
          </div>

          {/* Login form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-center text-navy-900">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center text-navy-700">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-navy-800">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-600" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    className="pl-12 h-14 text-base border-2 border-navy-300 focus:border-navy-700 focus:ring-navy-300/50 transition-all duration-300 ease-out rounded-xl"
                    autoFocus
                    aria-describedby="email-help"
                  />
                </div>
                <p id="email-help" className="text-xs text-navy-600">
                  Ingresa tu correo electrónico corporativo
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-navy-800">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-600" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-12 pr-12 h-14 text-base border-2 border-navy-300 focus:border-navy-700 focus:ring-navy-300/50 transition-all duration-300 ease-out rounded-xl"
                    aria-describedby="password-help"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-600 hover:text-navy-800 transition-all duration-200 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p id="password-help" className="text-xs text-navy-600">
                  Mínimo 8 caracteres
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-navy-400 text-navy-700 focus:ring-navy-600 focus:ring-2 transition-all duration-200 scale-110"
                  />
                  <span className="text-sm text-navy-700 font-medium">Recordarme</span>
                </label>
                <a 
                  href="#" 
                  className="text-sm text-navy-600 hover:text-navy-800 hover:underline transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-300 rounded-lg px-2 py-1"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button 
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-navy-700 to-navy-800 hover:from-navy-800 hover:to-navy-900 focus:ring-2 focus:ring-navy-300 focus:ring-offset-2 transition-all duration-300 ease-out shadow-lg hover:shadow-xl hover:shadow-navy-300/50 rounded-xl transform hover:-translate-y-0.5"
                aria-describedby="signin-help"
              >
                Iniciar Sesión
              </Button>
              <p id="signin-help" className="text-xs text-navy-600 text-center">
                Al hacer clic en "Iniciar Sesión" aceptas nuestros términos de servicio
              </p>
            </CardContent>
          </Card>

          {/* Sign up link */}
          <div className="text-center mt-8">
            <p className="text-navy-700 text-lg">
              ¿No tienes una cuenta?{' '}
              <a 
                href="/signup" 
                className="text-navy-600 hover:text-navy-800 font-semibold hover:underline transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-300 rounded-lg px-2 py-1"
              >
                Crear cuenta
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Carousel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-900 relative overflow-hidden">
        {/* Enhanced animated background pattern */}
        <div className="absolute inset-0 opacity-30">
          {/* Floating geometric shapes */}
          <div className="absolute top-16 left-16 w-40 h-40 border-2 border-white/40 rounded-2xl transform rotate-12 animate-float"></div>
          <div className="absolute top-40 right-24 w-32 h-32 border-2 border-white/40 rounded-full animate-float delay-1000"></div>
          <div className="absolute bottom-24 left-20 w-36 h-36 border-2 border-white/40 transform rotate-45 animate-float delay-500"></div>
          <div className="absolute bottom-40 right-40 w-28 h-28 border-2 border-white/40 rounded-2xl animate-float delay-1500"></div>
          
          {/* Additional floating elements */}
          <div className="absolute top-1/4 left-1/3 w-24 h-24 bg-white/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute top-3/4 right-1/4 w-20 h-20 bg-white/20 rounded-lg animate-pulse-slow delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/20 rounded-full animate-pulse-slow delay-2000"></div>
          
          {/* Rotating elements */}
          <div className="absolute top-1/3 right-1/3 w-32 h-32 border border-white/30 rounded-full animate-rotate-slow"></div>
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border border-white/30 rounded-full animate-rotate-slow delay-1000"></div>
        </div>

        {/* Carousel content */}
        <div className="relative w-full flex items-center justify-center">
          <div className="text-center text-white px-16 max-w-2xl">
            {/* Icon with enhanced animation */}
            <div className={`mb-10 transition-all duration-700 ease-out ${isAnimating ? 'scale-50 opacity-0 rotate-12' : 'scale-100 opacity-100 rotate-0'}`}>
              {currentItem.icon}
            </div>
            
            {/* Title with enhanced animation */}
            <h2 className={`text-5xl font-bold mb-8 transition-all duration-700 ease-out ${isAnimating ? 'translate-y-8 opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}`}>
              {currentItem.title}
            </h2>
            
            {/* Subtitle with enhanced animation */}
            <p className={`text-2xl leading-relaxed opacity-95 transition-all duration-700 ease-out ${isAnimating ? 'translate-y-8 opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}`}>
              {currentItem.subtitle}
            </p>
          </div>
        </div>

        {/* Enhanced carousel indicators */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-white/50 hover:scale-125 ${
                index === currentCarouselIndex 
                  ? 'bg-white scale-125 shadow-lg shadow-white/30' 
                  : 'bg-white/40 hover:bg-white/60 hover:scale-110'
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Enhanced progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-white to-navy-200 transition-all duration-1000 ease-out shadow-lg"
            style={{ 
              width: `${((currentCarouselIndex + 1) / carouselItems.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  )
}
