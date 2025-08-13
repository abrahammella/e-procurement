import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente del navegador (para componentes del cliente)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
