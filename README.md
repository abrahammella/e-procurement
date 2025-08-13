# E-Procurement System

Sistema de E-Procurement construido con Next.js 14, TypeScript, Tailwind CSS y shadcn/ui, con autenticación robusta implementada en Supabase.

## 🚀 Estado del Proyecto

**Progreso**: Implementación completa de autenticación y estructura base
**Última actualización**: Mejoras de seguridad implementadas
**Estado**: MVP funcional con autenticación robusta

## ✨ Características Implementadas

### 🔐 Autenticación y Seguridad
- **Supabase Auth** completamente configurado
- **Sistema de roles** (admin/supplier) implementado
- **Middleware de protección** de rutas por rol
- **Hook useAuth** con gestión completa de estado
- **Mejoras de seguridad** implementadas (eliminado warning de `getSession()`)
- **Validación de usuarios** directa con servidor Supabase

### 🎨 UI/UX
- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes de UI
- **Inter** como fuente principal
- **Layouts responsivos** para autenticación y área protegida
- **Sidebar vertical oscura** con navegación
- **Header superior** con búsqueda y notificaciones
- **Dashboard completo** con métricas y analíticas

### 🗄️ Base de Datos
- **Tabla profiles** con roles y metadatos de usuario
- **Políticas RLS** (Row Level Security) implementadas
- **Triggers automáticos** para sincronización de datos
- **Índices optimizados** para rendimiento

## 🎯 Funcionalidades por Rol

### 👑 Admin
- Acceso completo al sistema
- Gestión de Licitacións y licitaciones
- Administración de RFPs y documentos
- Aprobación de propuestas
- Gestión de proveedores

### 🏢 Supplier
- Visualización de licitaciones abiertas
- Envío de propuestas
- Carga de documentos y facturas
- Seguimiento de estado de propuestas

## 🎨 Colores Personalizados

- `--brand`: #1a3a5a (azul principal)
- `--navy-900`: #0b1e3a (azul oscuro para sidebar)
- `--navy-700`: #102a54
- `--bg`: #f6f8fb (fondo claro)
- `--card`: #ffffff (fondo de tarjetas)

## 🧩 Componentes UI Incluidos

- Button (con variantes)
- Input
- Card (con header, content, footer)
- Dialog (modal)
- Table (tabla completa)
- Badge (etiquetas)
- Tabs (pestañas)
- Toast (notificaciones)
- Sidebar (navegación lateral)
- Header (encabezado superior)

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx      # Layout centrado para auth
│   │   ├── login/
│   │   │   └── page.tsx    # Página de login
│   │   └── signup/
│   │       ├── page.tsx    # Página de registro
│   │       └── wizard/
│   │           └── page.tsx # Wizard de registro
│   ├── (protected)/
│   │   ├── layout.tsx      # Layout con sidebar + header
│   │   └── dashboard/
│   │       └── page.tsx    # Dashboard principal
│   ├── globals.css         # Estilos globales
│   └── layout.tsx          # Layout raíz
├── components/
│   ├── auth/               # Componentes de autenticación
│   │   ├── SupabaseLoginForm.tsx
│   │   ├── SupabaseSignupStepper.tsx
│   │   └── steps/          # Pasos del wizard de registro
│   ├── layout/             # Componentes de layout
│   │   ├── AuthShell.tsx
│   │   └── DashboardShell.tsx
│   └── ui/                 # Componentes shadcn/ui
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       ├── tabs.tsx
│       ├── toast.tsx
│       ├── sidebar.tsx     # Sidebar personalizada
│       └── header.tsx      # Header personalizado
├── hooks/
│   ├── useAuth.ts          # Hook de autenticación
│   └── useToast.ts         # Hook de notificaciones
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   ├── supabase-config.ts  # Configuración de Supabase
│   ├── utils.ts            # Utilidades para shadcn/ui
│   └── validation.ts       # Validaciones
├── middleware.ts            # Middleware de autenticación
└── types/
    └── auth.ts             # Tipos de autenticación
```

## 🚀 Instalación

1. **Clonar el repositorio**:
```bash
git clone <repository-url>
cd e-procurement
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
cp env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

4. **Ejecutar en desarrollo**:
```bash
npm run dev
```

5. **Construir para producción**:
```bash
npm run build
```

## 🔧 Configuración de Supabase

### 1. Crear proyecto en Supabase
- Ir a [supabase.com](https://supabase.com)
- Crear nuevo proyecto
- Obtener URL y anon key

### 2. Configurar variables de entorno
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Ejecutar migraciones
```sql
-- Ejecutar el contenido de supabase-setup.sql en tu SQL Editor
```

## 📱 Uso

### Páginas de Autenticación
- `/login` - Formulario de inicio de sesión
- `/signup` - Formulario de registro con wizard
- `/signup/wizard` - Proceso paso a paso de registro

### Área Protegida
- `/dashboard` - Dashboard principal con métricas y analíticas

### Navegación
El sidebar incluye enlaces a:
- Dashboard
- Compras
- Contratos
- Proveedores
- Productos
- Organizaciones
- Reportes
- Configuración

## 🔒 Mejoras de Seguridad Implementadas

### Problema Resuelto
- **Warning eliminado**: "Using the user object as returned from supabase.auth.getSession() could be insecure"
- **Implementado**: `supabase.auth.getUser()` para validación segura
- **Middleware actualizado**: Protección de rutas más robusta

### Archivos Modificados
1. `src/middleware.ts` - Middleware de autenticación seguro
2. `src/hooks/useAuth.ts` - Hook de autenticación mejorado
3. `src/components/auth/SupabaseLoginForm.tsx` - Formulario de login seguro

## 📱 Responsive Design

- **Mobile**: Sidebar colapsable con overlay
- **Desktop**: Sidebar siempre visible
- **Breakpoints**: Optimizado para móvil, tablet y desktop

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Fonts**: Inter (Google Fonts)
- **Database**: PostgreSQL con RLS
- **Authentication**: Supabase Auth

## 🔄 Roadmap

### ✅ Completado (Día 1)
- [x] UI: Login / Sign Up
- [x] Shell/Layout, Sidebar, Header, Theme tokens
- [x] Dashboard por rol
- [x] Supabase Auth + profiles + role‑based guard
- [x] Mejoras de seguridad implementadas

### 🔄 En Progreso (Día 2)
- [ ] Supabase Storage helper (PDF)
- [ ] Tablas mínimas + CRUD (tenders + rfp)
- [ ] Lista supplier
- [ ] Hooks finales para n8n

## 📚 Documentación Adicional

- `SECURITY_IMPROVEMENTS.md` - Detalles de las mejoras de seguridad
- `SUPABASE_SETUP.md` - Guía de configuración de Supabase
- `MIDDLEWARE_DOCS.md` - Documentación del middleware
- `project_context.md` - Contexto completo del proyecto

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto es para uso educativo y de demostración.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:
1. Revisar la documentación en `/docs`
2. Verificar las issues existentes
3. Crear una nueva issue con detalles del problema
