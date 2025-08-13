export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  country: string
  created_at: string
  updated_at: string
}

export interface SignupData {
  // Step 1: Account
  email: string
  password: string
  confirmPassword: string
  
  // Step 2: Personal Info
  fullName: string
  phone: string
  country: string
  
  // Step 3: Confirmation
  acceptTerms: boolean
  acceptMarketing: boolean
}

export interface SignupStep {
  id: number
  title: string
  description: string
  isCompleted: boolean
  isValid: boolean
}

export interface ValidationErrors {
  [key: string]: string
}
