'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SignupData, SignupStep, ValidationErrors } from '@/types/auth'
import { validateStep1, validateStep2, validateStep3, isStepValid } from '@/lib/validation'
import { StepAccount } from './steps/StepAccount'
import { StepPersonalInfo } from './steps/StepPersonalInfo'
import { StepConfirmation } from './steps/StepConfirmation'

const STEPS: SignupStep[] = [
  {
    id: 1,
    title: 'Cuenta',
    description: 'Email y contraseña',
    isCompleted: false,
    isValid: false
  },
  {
    id: 2,
    title: 'Información Personal',
    description: 'Datos personales',
    isCompleted: false,
    isValid: false
  },
  {
    id: 3,
    title: 'Confirmación',
    description: 'Términos y envío',
    isCompleted: false,
    isValid: false
  }
]

const STORAGE_KEY = 'supabase_signup_draft'

export function SupabaseSignupStepper() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    country: '',
    acceptTerms: false,
    acceptMarketing: false
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [steps, setSteps] = useState<SignupStep[]>(STEPS)

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setData(parsed)
        
        // Update steps validation
        updateStepsValidation(parsed)
        
        // Find last valid step
        for (let i = STEPS.length; i > 0; i--) {
          if (isStepValid(i, parsed)) {
            setCurrentStep(i)
            break
          }
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error)
    }
  }, [])

  // Save to localStorage on data change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      updateStepsValidation(data)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [data])

  // Update steps validation
  const updateStepsValidation = (formData: SignupData) => {
    setSteps(prev => prev.map(step => ({
      ...step,
      isValid: isStepValid(step.id, formData),
      isCompleted: step.id < currentStep
    })))
  }

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(data).some(key => data[key as keyof SignupData])) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [data])

  const updateData = (newData: Partial<SignupData>) => {
    setData(prev => ({ ...prev, ...newData }))
    // Clear errors for updated fields
    setErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(newData).forEach(key => delete newErrors[key])
      return newErrors
    })
  }

  const validateCurrentStep = () => {
    let stepErrors: ValidationErrors = {}
    
    switch (currentStep) {
      case 1:
        stepErrors = validateStep1(data)
        break
      case 2:
        stepErrors = validateStep2(data)
        break
      case 3:
        stepErrors = validateStep3(data)
        break
    }
    
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const resetForm = () => {
    if (confirm('¿Estás seguro de que quieres reiniciar el formulario? Se perderán todos los datos.')) {
      setData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        country: '',
        acceptTerms: false,
        acceptMarketing: false
      })
      setErrors({})
      setCurrentStep(1)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsSubmitting(true)

    try {
      // Crear cuenta de usuario con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            country: data.country
          }
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(authError.message)
      }

      if (authData.user) {
        console.log('Usuario creado exitosamente:', authData.user.id)
        
        // Limpiar draft del localStorage
        localStorage.removeItem(STORAGE_KEY)

        // Mostrar éxito y redirigir al dashboard
        alert('¡Cuenta creada exitosamente! Bienvenido a E-Procurement.')
        router.push('/dashboard')
      } else {
        throw new Error('No se pudo crear el usuario')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      
      // Mensaje de error más amigable
      let errorMessage = 'Error al crear la cuenta'
      if (error.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'Ya existe una cuenta con este email'
        } else if (error.message.includes('password')) {
          errorMessage = 'La contraseña no cumple con los requisitos'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100
  const isLastStep = currentStep === STEPS.length
  const canGoNext = currentStep < STEPS.length

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepAccount
            data={data}
            updateData={updateData}
            errors={errors}
          />
        )
      case 2:
        return (
          <StepPersonalInfo
            data={data}
            updateData={updateData}
            errors={errors}
          />
        )
      case 3:
        return (
          <StepConfirmation
            data={data}
            updateData={updateData}
            errors={errors}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center items-center space-x-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
            <span className="text-white font-bold text-lg">EP</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900">Crear Cuenta</h1>
        </div>
        <p className="text-navy-600">Complete los siguientes pasos para crear su cuenta</p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex justify-between text-sm text-navy-600">
          <span>Progreso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </motion.div>

      {/* Stepper */}
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {steps.map((step, index) => {
          const isCompleted = step.isCompleted
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

              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 transition-colors duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          )
        })}
      </motion.div>

      <Separator />

      {/* Current Step */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {/* Step Header */}
            <div className="mb-8 text-center">
              <Badge variant="secondary" className="mb-4">
                Paso {currentStep} de {STEPS.length}
              </Badge>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-navy-600">{steps[currentStep - 1].description}</p>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-8 border-t">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
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
                    disabled={!steps[currentStep - 1].isValid}
                    className="flex items-center space-x-2 bg-navy-600 hover:bg-navy-700"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!steps[currentStep - 1].isValid || isSubmitting}
                    className="flex items-center space-x-3 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <span>Crear Cuenta</span>
                        <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Alert */}
      {Object.keys(errors).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Por favor corrige los errores antes de continuar.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  )
}
