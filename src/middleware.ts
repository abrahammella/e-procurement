import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareSupabase } from '@/lib/supabase-server';

// Definir rutas por tipo
const PUBLIC_ROUTES = ['/login', '/signup', '/signup/wizard', '/reset-password', '/forgot-password'];
const ADMIN_ROUTES = ['/admin', '/admin/users', '/admin/settings', '/admin/reports'];
const SUPPLIER_ROUTES = ['/supplier', '/supplier/proposals', '/supplier/invoices'];
const SHARED_PROTECTED = ['/dashboard', '/profile', '/settings', '/tenders', '/rfp', '/proposals', '/invoices'];

// Función helper para verificar si una ruta coincide con un patrón
function startsWithAny(path: string, routes: string[]) {
  return routes.some((r) => path === r || path.startsWith(r + '/'));
}

export async function middleware(req: NextRequest) {
  // STEP 3: Selective protection - Only protect specific routes
  const { pathname } = req.nextUrl;
  
  console.log('🔍 Middleware - Pathname:', pathname);
  
  // Verificar si esta ruta necesita protección
  const needsProtection = pathname.startsWith('/admin') || 
                         pathname.startsWith('/supplier') || 
                         pathname.startsWith('/api/protected');
  
  console.log('🔍 Middleware - Needs protection:', needsProtection);
  
  // Si la ruta no necesita protección, permitir acceso
  if (!needsProtection) {
    console.log('🔍 Middleware - Route does not need protection, allowing access');
    return NextResponse.next();
  }
  
  try {
    // Crear cliente Supabase para middleware
    const supabase = createMiddlewareSupabase()

    // Obtener usuario autenticado de forma segura
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('🔍 Middleware - User:', user?.id, 'Error:', userError);

    // Caso 1: Usuario no autenticado intenta acceder a ruta protegida
    if (userError || !user) {
      console.log('🔍 Middleware - No user authenticated, protecting route');
      
      // Redirigir a login con redirect
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname + (req.nextUrl.search || ''));
      console.log('🔍 Middleware - Redirecting to login:', url.toString());
      return NextResponse.redirect(url);
    }

    // Caso 2: Usuario autenticado - verificar rol para rutas específicas
    console.log('🔍 Middleware - User authenticated:', user.email);
    
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

    // Verificar acceso basado en rol para rutas específicas
    if (pathname.startsWith('/admin') && role !== 'admin') {
      console.log('🔍 Middleware - Non-admin user trying to access admin route');
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/supplier') && role !== 'supplier') {
      console.log('🔍 Middleware - Non-supplier user trying to access supplier route');
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Usuario autenticado con rol correcto - permitir acceso
    console.log('🔍 Middleware - Access granted to protected route:', pathname);
    return NextResponse.next();

  } catch (error) {
    console.error('❌ Middleware error:', error);
    // En caso de error, redirigir a login para rutas protegidas
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Solo rutas que realmente necesiten middleware
    '/admin/:path*',
    '/supplier/:path*',
    '/api/protected/:path*',
    // Excluir rutas principales para evitar conflictos
    '/((?!_next/static|_next/image|favicon.ico|api|dashboard|login|signup|signup/wizard|reset-password|forgot-password).*)',
  ],
};
