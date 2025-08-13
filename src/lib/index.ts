// Supabase Client Imports
// Use these imports based on your context:

// For Client Components (use 'use client')
export { supabase } from './supabase'

// For Server Components and API Routes
export { createServerSupabase } from './supabase-server'

// For Middleware
export { createMiddlewareSupabase } from './supabase-server'

// For Storage operations (Server-side only)
export * from './storage'

// Configuration
export { SUPABASE_CONFIG } from './supabase-config'
