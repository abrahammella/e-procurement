import { SignupData, ValidationErrors } from '@/types/auth'

export const validateStep1 = (data: Partial<SignupData>): ValidationErrors => {
  const errors: ValidationErrors = {}

  // Email validation
  if (!data.email) {
    errors.email = 'El email es requerido'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Formato de email inválido'
  }

  // Password validation
  if (!data.password) {
    errors.password = 'La contraseña es requerida'
  } else if (data.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres'
  } else if (!/(?=.*[a-z])/.test(data.password)) {
    errors.password = 'La contraseña debe contener al menos una minúscula'
  } else if (!/(?=.*[A-Z])/.test(data.password)) {
    errors.password = 'La contraseña debe contener al menos una mayúscula'
  } else if (!/(?=.*\d)/.test(data.password)) {
    errors.password = 'La contraseña debe contener al menos un número'
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden'
  }

  return errors
}

export const validateStep2 = (data: Partial<SignupData>): ValidationErrors => {
  const errors: ValidationErrors = {}

  // Full name validation
  if (!data.fullName) {
    errors.fullName = 'El nombre completo es requerido'
  } else if (data.fullName.length < 2) {
    errors.fullName = 'El nombre debe tener al menos 2 caracteres'
  }

  // Phone validation
  if (!data.phone) {
    errors.phone = 'El teléfono es requerido'
  } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Formato de teléfono inválido'
  }

  // Country validation
  if (!data.country) {
    errors.country = 'El país es requerido'
  }

  return errors
}

export const validateStep3 = (data: Partial<SignupData>): ValidationErrors => {
  const errors: ValidationErrors = {}

  // Terms acceptance validation
  if (!data.acceptTerms) {
    errors.acceptTerms = 'Debes aceptar los términos y condiciones'
  }

  return errors
}

export const validateAllSteps = (data: SignupData): ValidationErrors => {
  return {
    ...validateStep1(data),
    ...validateStep2(data),
    ...validateStep3(data)
  }
}

export const isStepValid = (step: number, data: Partial<SignupData>): boolean => {
  switch (step) {
    case 1:
      return Object.keys(validateStep1(data)).length === 0
    case 2:
      return Object.keys(validateStep2(data)).length === 0
    case 3:
      return Object.keys(validateStep3(data)).length === 0
    default:
      return false
  }
}
