# 🔐 Middleware de Autenticación y Autorización

## 📋 **Descripción General**

Este middleware implementa un sistema robusto de autenticación y autorización basado en roles para la plataforma E-Procurement. Funciona completamente en el servidor para evitar parpadeos y proporciona redirección inteligente basada en el rol del usuario.

## 🏗️ **Arquitectura del Sistema**

### **Componentes Principales**
- **Middleware Edge**: Verificación de autenticación en tiempo real
- **Base de Datos**: Tabla `profiles` con campo `role`
- **Hook de Autenticación**: Estado global de autenticación
- **Sistema de Roles**: Admin y Supplier con permisos específicos

### **Flujo de Verificación**
```
Request → Middleware → Supabase Auth → Profiles Table → Role Check → Redirect
```

## 🛣️ **Configuración de Rutas**

### **Rutas Públicas** (No requieren autenticación)
```typescript
public: [
  '/login', 
  '/signup', 
  '/signup/wizard', 
  '/reset-password', 
  '/forgot-password'
]
```

### **Rutas de Administrador** (Solo admin)
```typescript
admin: [
  '/admin', 
  '/admin/users', 
  '/admin/settings', 
  '/admin/reports'
]
```

### **Rutas de Proveedor** (Solo supplier)
```typescript
supplier: [
  '/supplier', 
  '/supplier/proposals', 
  '/supplier/invoices'
]
```

### **Rutas Compartidas** (Ambos roles)
```typescript
protected: [
  '/dashboard', 
  '/profile', 
  '/settings', 
  '/tenders', 
  '/rfp', 
  '/proposals', 
  '/invoices'
]
```

## 🔄 **Lógica de Redirección**

### **Usuarios No Autenticados**
- **Acceso a rutas protegidas** → Redirigido a `/login`
- **Acceso a rutas públicas** → Permitido

### **Usuarios Autenticados**
- **Acceso a rutas públicas** → Redirigido al dashboard correspondiente
- **Acceso a rutas de admin** → Solo si `role = 'admin'`
- **Acceso a rutas de supplier** → Solo si `role = 'supplier'`
- **Acceso a rutas compartidas** → Permitido para ambos roles

### **Ejemplos de Redirección**
```typescript
// Usuario supplier intentando acceder a /admin
'/admin' → '/dashboard' (redirigido)

// Usuario admin intentando acceder a /supplier
'/supplier' → '/dashboard' (redirigido)

// Usuario supplier accediendo a /dashboard
'/dashboard' → '/dashboard' (permitido)
```

## 🗄️ **Estructura de la Base de Datos**

### **Tabla `profiles`**
```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    role TEXT DEFAULT 'supplier' CHECK (role IN ('admin', 'supplier')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Políticas de Seguridad (RLS)**
- **SELECT**: Usuarios solo pueden ver su propio perfil
- **UPDATE**: Usuarios solo pueden actualizar su propio perfil
- **INSERT**: Solo usuarios autenticados pueden insertar perfiles

## ⚡ **Rendimiento y Optimización**

### **Índices de Base de Datos**
```sql
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);
```

### **Caching del Middleware**
- **Verificación de sesión** en cada request
- **Consulta de perfil** optimizada con índices
- **Redirección inteligente** sin consultas innecesarias

## 🚀 **Implementación del Middleware**

### **Archivo Principal**
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  // 1. Crear cliente Supabase
  // 2. Verificar autenticación
  // 3. Obtener rol del usuario
  // 4. Aplicar lógica de redirección
  // 5. Retornar respuesta
}
```

### **Funciones Auxiliares**
```typescript
// Verificar si una ruta coincide con un patrón
function matchesRoute(pathname: string, routes: string[]): boolean

// Obtener rol del usuario desde la base de datos
async function getUserRole(supabase: any, userId: string): Promise<string | null>

// Determinar ruta de redirección basada en el rol
function getRedirectPath(userRole: string | null, pathname: string): string
```

## 🔧 **Configuración del Proyecto**

### **Variables de Entorno**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Matcher del Middleware**
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 🧪 **Testing del Middleware**

### **Casos de Prueba**
1. **Usuario no autenticado** accediendo a `/dashboard`
2. **Usuario supplier** accediendo a `/admin`
3. **Usuario admin** accediendo a `/supplier`
4. **Usuario autenticado** accediendo a `/login`

### **Verificación en Supabase**
```sql
-- Verificar usuarios y roles
SELECT id, email, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

## 🚨 **Manejo de Errores**

### **Tipos de Errores**
- **Error de autenticación**: Usuario redirigido a login
- **Error de base de datos**: Usuario redirigido a dashboard
- **Error inesperado**: Usuario redirigido a login

### **Logging y Debugging**
```typescript
// Logs del middleware
console.error('Auth error in middleware:', authError)
console.error('Error fetching user role:', error)
console.error('Middleware error:', error)
```

## 🔄 **Integración con Componentes**

### **Hook de Autenticación**
```typescript
const { user, profile, userRole, isAdmin, isSupplier } = useAuth()
```

### **Componente de Header**
```typescript
// Muestra información del usuario y rol
const displayRole = userRole === 'admin' ? 'Administrador' : 'Proveedor'
```

### **Dashboard Dinámico**
```typescript
// Renderiza vista según el rol
{userRole === 'admin' ? <AdminView /> : <SupplierView />}
```

## 📈 **Métricas y Monitoreo**

### **Logs del Middleware**
- **Requests procesados** por minuto
- **Redirecciones** por tipo de usuario
- **Errores** de autenticación y autorización
- **Tiempo de respuesta** del middleware

### **Dashboard de Supabase**
- **Usuarios activos** por rol
- **Sesiones** activas
- **Políticas RLS** funcionando correctamente

## 🚀 **Despliegue y Producción**

### **Consideraciones de Producción**
- **Rate limiting** para evitar abuso
- **Logging estructurado** para monitoreo
- **Métricas de rendimiento** del middleware
- **Backup automático** de la base de datos

### **Escalabilidad**
- **Middleware Edge** para mejor rendimiento
- **Índices optimizados** para consultas rápidas
- **Políticas RLS** para seguridad a nivel de base de datos

## 🔒 **Seguridad**

### **Características de Seguridad**
- **Verificación de sesión** en cada request
- **Políticas RLS** para acceso a datos
- **Validación de roles** en el servidor
- **Redirección segura** sin exposición de información

### **Mejores Prácticas**
- **Nunca confiar** en el cliente para autorización
- **Siempre verificar** en el servidor
- **Usar HTTPS** en producción
- **Monitorear** intentos de acceso no autorizado

## 📚 **Recursos Adicionales**

### **Documentación de Supabase**
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Middleware](https://supabase.com/docs/guides/auth/auth-helpers/nextjs#middleware)
- [Policies](https://supabase.com/docs/guides/auth/row-level-security#policies)

### **Next.js Middleware**
- [Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)

---

## 🎯 **Resumen**

Este middleware proporciona:
- ✅ **Autenticación robusta** con Supabase Auth
- ✅ **Autorización basada en roles** desde la base de datos
- ✅ **Redirección inteligente** sin parpadeos
- ✅ **Seguridad a nivel de servidor** y base de datos
- ✅ **Rendimiento optimizado** con índices y caching
- ✅ **Manejo de errores** completo y logging
- ✅ **Escalabilidad** para aplicaciones en producción
