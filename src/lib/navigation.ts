'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Hook personalizado para manejar redirecciones de forma robusta
 * Evita conflictos con el middleware y maneja fallbacks
 */
export function useRobustNavigation() {
  const router = useRouter()
  const isNavigating = useRef(false)

  const navigateTo = async (path: string, options?: {
    replace?: boolean
    delay?: number
    fallback?: boolean
  }) => {
    if (isNavigating.current) {
      console.log('⚠️ Navigation already in progress, skipping:', path)
      return
    }

    const {
      replace = true,
      delay = 1000,
      fallback = true
    } = options || {}

    isNavigating.current = true

    try {
      console.log(`🚀 Starting navigation to: ${path}`)
      console.log(`⏱️ Delay: ${delay}ms, Replace: ${replace}`)

      // Esperar a que el estado de autenticación se estabilice
      await new Promise(resolve => setTimeout(resolve, delay))

      console.log(`🔄 Executing navigation to: ${path}`)

      if (replace) {
        router.replace(path)
      } else {
        router.push(path)
      }

      console.log(`✅ Navigation executed successfully to: ${path}`)

      // Verificar que la navegación fue exitosa
      setTimeout(() => {
        if (window.location.pathname !== path) {
          console.warn(`⚠️ Navigation may have failed. Expected: ${path}, Current: ${window.location.pathname}`)
          
          if (fallback) {
            console.log(`🔄 Using fallback navigation to: ${path}`)
            window.location.href = path
          }
        }
      }, 100)

    } catch (error) {
      console.error(`❌ Navigation error to ${path}:`, error)
      
      if (fallback) {
        console.log(`🔄 Using fallback navigation to: ${path}`)
        window.location.href = path
      }
    } finally {
      // Reset navigation flag after a delay
      setTimeout(() => {
        isNavigating.current = false
      }, 2000)
    }
  }

  const navigateToDashboard = (role?: string) => {
    const path = '/dashboard'
    console.log(`🎯 Navigating to dashboard for role: ${role || 'unknown'}`)
    return navigateTo(path, { replace: true, delay: 1000 })
  }

  const navigateToLogin = (redirectPath?: string) => {
    const path = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'
    console.log(`🔐 Navigating to login with redirect: ${redirectPath || 'none'}`)
    return navigateTo(path, { replace: true, delay: 500 })
  }

  return {
    navigateTo,
    navigateToDashboard,
    navigateToLogin,
    isNavigating: isNavigating.current
  }
}

/**
 * Función de utilidad para redirección inmediata
 * Útil cuando no se puede usar el hook
 */
export function redirectTo(path: string, options?: {
  replace?: boolean
  delay?: number
}) {
  const { replace = true, delay = 1000 } = options || {}

  console.log(`🚀 Direct redirect to: ${path}`)
  console.log(`⏱️ Delay: ${delay}ms, Replace: ${replace}`)

  setTimeout(() => {
    try {
      if (replace) {
        window.location.replace(path)
      } else {
        window.location.href = path
      }
      console.log(`✅ Direct redirect executed to: ${path}`)
    } catch (error) {
      console.error(`❌ Direct redirect error to ${path}:`, error)
      // Fallback
      window.location.href = path
    }
  }, delay)
}

/**
 * Función para verificar si la navegación fue exitosa
 */
export function verifyNavigation(expectedPath: string, timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const checkNavigation = () => {
      const currentPath = window.location.pathname
      const elapsed = Date.now() - startTime
      
      if (currentPath === expectedPath) {
        console.log(`✅ Navigation verified to: ${expectedPath}`)
        resolve(true)
        return
      }
      
      if (elapsed > timeout) {
        console.warn(`⚠️ Navigation verification timeout. Expected: ${expectedPath}, Current: ${currentPath}`)
        resolve(false)
        return
      }
      
      // Check again in 100ms
      setTimeout(checkNavigation, 100)
    }
    
    checkNavigation()
  })
}
