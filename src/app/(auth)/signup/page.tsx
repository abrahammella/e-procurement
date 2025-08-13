'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to wizard after component mounts
    const timer = setTimeout(() => {
      router.push('/signup/wizard')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
        <p className="text-navy-600">Redirigiendo al formulario de registro...</p>
      </div>
    </div>
  )
}
