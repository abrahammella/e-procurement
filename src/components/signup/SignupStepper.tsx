'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert } from '@/components/ui/alert'
import { CheckCircle, ArrowLeft, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react'
import { StepAccount } from './steps/StepAccount'
import { StepCompany } from './steps/StepCompany'
import { StepCompliance } from './steps/StepCompliance'
import { StepReview } from './steps/StepReview'

// Types
export interface SignupData {
  // Step 1: Account
  email: string
  password: string
  confirmPassword: string
  
  // Step 2: Company
  companyName: string
  rnc: string
  contactEmail: string
  country: string
  city: string
  phone: string
  
  // Step 3: Compliance
  isInformationVerified: boolean
  certifications: string[]
  documents: File[]
  
  // Step 4: Review
  acceptTerms: boolean
}

interface Step {
  id: number
  title: string
  description: string
  component: React.ComponentType<{
    data: SignupData
    updateData: (data: Partial<SignupData>) => void
    errors: Record<string, string>
  }>
  validation: (data: SignupData) => Record<string, string>
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Cuenta',
    description: 'Información de acceso',
    component: StepAccount,
    validation: (data) => {
      const errors: Record<string, string> = {}
      
      if (!data.email) errors.email = 'El email es requerido'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Email inválido'
      }
      
      if (!data.password) errors.password = 'La contraseña es requerida'
      else if (data.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres'
      } else if (!/(?=.*[A-Z])/.test(data.password)) {
        errors.password = 'La contraseña debe contener al menos una mayúscula'
      } else if (!/(?=.*\d)/.test(data.password)) {
        errors.password = 'La contraseña debe contener al menos un número'
      }
      
      if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden'
      }
      
      return errors
    }
  },
  {
    id: 2,
    title: 'Empresa',
    description: 'Datos corporativos',
    component: StepCompany,
    validation: (data) => {
      const errors: Record<string, string> = {}
      
      if (!data.companyName) errors.companyName = 'El nombre de la empresa es requerido'
      
      if (!data.rnc) errors.rnc = 'El RNC es requerido'
      else if (!/^[0-9\-]{9,11}$/.test(data.rnc)) {
        errors.rnc = 'Formato de RNC inválido'
      }
      
      if (!data.contactEmail) errors.contactEmail = 'El email de contacto es requerido'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
        errors.contactEmail = 'Email inválido'
      }
      
      if (!data.country) errors.country = 'El país es requerido'
      if (!data.city) errors.city = 'La ciudad es requerida'
      
      return errors
    }
  },
  {
    id: 3,
    title: 'Cumplimiento',
    description: 'Verificaciones legales',
    component: StepCompliance,
    validation: (data) => {
      const errors: Record<string, string> = {}
      
      if (!data.isInformationVerified) {
        errors.isInformationVerified = 'Debe declarar que la información es verídica'
      }
      
      return errors
    }
  },
  {
    id: 4,
    title: 'Revisión',
    description: 'Confirmación final',
    component: StepReview,
    validation: (data) => {
      const errors: Record<string, string> = {}
      
      if (!data.acceptTerms) {
        errors.acceptTerms = 'Debe aceptar los términos y condiciones'
      }
      
      return errors
    }
  }
]

export function SignupStepper() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    rnc: '',
    contactEmail: '',
    country: '',
    city: '',
    phone: '',
    isInformationVerified: false,
    certifications: [],
    documents: [],
    acceptTerms: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Memoize current step validation to avoid re-renders
  const currentStepValidation = useMemo(() => {
    const currentStepData = STEPS[currentStep - 1]
    return currentStepData.validation(data)
  }, [currentStep, data])

  // Memoize progress calculation
  const progress = useMemo(() => {
    return (currentStep / STEPS.length) * 100
  }, [currentStep])

  // Memoize step data
  const currentStepData = useMemo(() => {
    return STEPS[currentStep - 1]
  }, [currentStep])

  const updateData = useCallback((newData: Partial<SignupData>) => {
    setData(prev => ({ ...prev, ...newData }))
    // Clear errors for updated fields
    setErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(newData).forEach(key => delete newErrors[key])
      return newErrors
    })
  }, [])

  const validateCurrentStep = useCallback(() => {
    const stepErrors = currentStepValidation
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }, [currentStepValidation])

  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }, [validateCurrentStep])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  const resetForm = useCallback(() => {
    if (confirm('¿Está seguro de que desea reiniciar el formulario? Se perderán todos los datos.')) {
      setData({
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        rnc: '',
        contactEmail: '',
        country: '',
        city: '',
        phone: '',
        isInformationVerified: false,
        certifications: [],
        documents: [],
        acceptTerms: false
      })
      setErrors({})
      setCurrentStep(1)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Signup payload:', data)
      
      // Redirect to success or login
      alert('¡Cuenta creada exitosamente!')
      router.push('/login')
    } catch (error) {
      console.error('Signup error:', error)
      alert('Error al crear la cuenta. Intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }, [validateCurrentStep, data, router])

  const CurrentStepComponent = currentStepData.component
  const isLastStep = currentStep === STEPS.length
  const canGoNext = currentStep < STEPS.length
  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
            <span className="text-white font-bold text-lg">EP</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900">Crear Cuenta</h1>
        </div>
        <p className="text-navy-600">Complete los siguientes pasos para crear su cuenta</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-navy-600">
          <span>Progreso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center space-y-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                    ? 'bg-navy-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="text-center max-w-24">
                  <div className={`text-xs font-medium ${
                    isActive ? 'text-navy-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400 hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 transition-colors duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      <Separator />

      {/* Current Step */}
      <Card className="shadow-xl border-0">
        <CardContent className="p-8">
          {/* Step Header */}
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-4">
              Paso {currentStep} de {STEPS.length}
            </Badge>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-navy-600">{currentStepData.description}</p>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            <CurrentStepComponent 
              data={data} 
              updateData={updateData} 
              errors={errors} 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-8 border-t">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={resetForm}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reiniciar</span>
              </Button>
            </div>

            <div className="flex space-x-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Atrás</span>
                </Button>
              )}
              
              {canGoNext ? (
                <Button
                  onClick={nextStep}
                  disabled={Object.keys(currentStepValidation).length > 0}
                  className="flex items-center space-x-2 bg-navy-600 hover:bg-navy-700"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={Object.keys(currentStepValidation).length > 0 || isSubmitting}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <span>{isSubmitting ? 'Creando...' : 'Crear Cuenta'}</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="ml-2">
            Por favor corrija los errores antes de continuar.
          </span>
        </Alert>
      )}
    </div>
  )
}
