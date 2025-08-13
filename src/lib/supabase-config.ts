// Supabase Configuration
// Create a .env.local file in your project root with these variables:

export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

// To get these values:
// 1. Go to https://supabase.com
// 2. Create a new project or select existing
// 3. Go to Settings > API
// 4. Copy Project URL and anon public key

// Note: For client-side usage, import from '@/lib/supabase'
// Note: For server-side usage, import from '@/lib/supabase-server'
