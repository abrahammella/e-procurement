import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente del servidor (para Server Components y API routes)
export function createServerSupabase() {
  const cookieStore = cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Las cookies solo se pueden establecer en un Server Component o Route Handler
        }
      },
    },
  })
}

// Cliente para middleware (con cookies de request)
export function createMiddlewareSupabase(request?: Request) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (request) {
          // Extraer cookies del request
          const cookieHeader = request.headers.get('cookie') || ''
          const cookies = cookieHeader.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=')
            return { name: name || '', value: value || '' }
          }).filter(cookie => cookie.name && cookie.value)
          return cookies
        }
        return []
      },
      setAll(cookiesToSet) {
        // No-op para middleware - no podemos establecer cookies aquí
      },
    },
  })
}
