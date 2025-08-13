import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareSupabase } from '@/lib/supabase-server';

// Definir rutas por tipo
const PUBLIC_ROUTES = ['/login', '/signup', '/signup/wizard', '/reset-password', '/forgot-password'];
const ADMIN_ROUTES = ['/admin'];
const SUPPLIER_ROUTES = ['/supplier'];
const SHARED_PROTECTED = ['/dashboard', '/profile', '/settings', '/tenders', '/tenders-test', '/tenders-test-simple', '/rfp', '/proposals', '/invoices'];

// Función helper para verificar si una ruta coincide con un patrón
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

function isProtectedRoute(path: string): boolean {
  return ADMIN_ROUTES.some(route => path === route || path.startsWith(route + '/')) ||
         SUPPLIER_ROUTES.some(route => path === route || path.startsWith(route + '/')) ||
         SHARED_PROTECTED.some(route => path === route || path.startsWith(route + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  console.log('🔍 Middleware - Pathname:', pathname);
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    console.log('🔍 Middleware - Public route, allowing access');
    return NextResponse.next();
  }

  // Check if route needs protection
  if (!isProtectedRoute(pathname)) {
    console.log('🔍 Middleware - Route does not need protection, allowing access');
    return NextResponse.next();
  }

  console.log('🔍 Middleware - Protected route, checking authentication');

  try {
    // Create Supabase client for middleware
    const supabase = createMiddlewareSupabase(req);

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('🔍 Middleware - User:', user?.id, 'Error:', userError);

    // If no authenticated user, redirect to login
    if (userError || !user) {
      console.log('🔍 Middleware - No user authenticated, redirecting to login');
      
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname + (req.nextUrl.search || ''));
      console.log('🔍 Middleware - Redirecting to login:', url.toString());
      return NextResponse.redirect(url);
    }

    // User is authenticated - check role-based access
    console.log('🔍 Middleware - User authenticated:', user.email);
    
    // Get user role from app_metadata or profiles table
    let role = (user.app_metadata?.role as string) || null;
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      role = profile?.role ?? 'supplier';
      console.log('🔍 Middleware - Role from profile:', role);
    } else {
      console.log('🔍 Middleware - Role from metadata:', role);
    }

    // Check role-based access for admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      console.log('🔍 Middleware - Non-admin user trying to access admin route');
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Check role-based access for supplier routes
    if (pathname.startsWith('/supplier') && role !== 'supplier') {
      console.log('🔍 Middleware - Non-supplier user trying to access supplier route');
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // User authenticated with correct role - allow access
    console.log('🔍 Middleware - Access granted to protected route:', pathname);
    return NextResponse.next();

  } catch (error) {
    console.error('❌ Middleware error:', error);
    // On error, redirect to login for protected routes
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
