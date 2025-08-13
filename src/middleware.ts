import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
  let res = NextResponse.next({
    request: req,
  });

  // Crear cliente Supabase para middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          res = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Obtener sesión del usuario
    const { data: { session } } = await supabase.auth.getSession();
    const { pathname, searchParams } = req.nextUrl;
    const isPublic = startsWithAny(pathname, PUBLIC_ROUTES);

    // Caso 1: Usuario NO autenticado
    if (!session) {
      if (!isPublic) {
        // Si no es ruta pública, redirigir a login con redirect
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname + (req.nextUrl.search || ''));
        return NextResponse.redirect(url);
      }
      // Si es ruta pública, permitir acceso
      return res;
    }

    // Caso 2: Usuario autenticado - determinar rol
    let role = (session.user.app_metadata?.role as string) || null;

    // Si no hay rol en app_metadata, consultar la tabla profiles
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      
      role = profile?.role ?? 'supplier';
    }

    // Caso 3: Usuario autenticado intenta acceder a ruta pública
    if (isPublic) {
      const url = req.nextUrl.clone();
      url.pathname = role === 'admin' ? '/dashboard' : '/dashboard';
      return NextResponse.redirect(url);
    }

    // Caso 4: Verificar acceso a rutas por rol
    const isAdminRoute = startsWithAny(pathname, ADMIN_ROUTES);
    const isSupplierRoute = startsWithAny(pathname, SUPPLIER_ROUTES);

    // Verificar acceso a rutas de admin
    if (isAdminRoute && role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Verificar acceso a rutas de supplier
    if (isSupplierRoute && role !== 'supplier') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Si pasa todas las verificaciones, permitir acceso
    return res;

  } catch (error) {
    console.error('Middleware error:', error);
    
    // En caso de error, redirigir a login para rutas protegidas
    const { pathname } = req.nextUrl;
    const isPublic = startsWithAny(pathname, PUBLIC_ROUTES);
    
    if (!isPublic) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname + (req.nextUrl.search || ''));
      return NextResponse.redirect(url);
    }
    
    return res;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
