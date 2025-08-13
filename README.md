# E-Procurement System

Sistema de E-Procurement construido con Next.js 14, TypeScript, Tailwind CSS y shadcn/ui.

## Características

- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes de UI
- **Inter** como fuente principal
- **Layouts responsivos** para autenticación y área protegida
- **Sidebar vertical oscura** con navegación
- **Header superior** con búsqueda y notificaciones
- **Dashboard completo** con métricas y analíticas

## Colores Personalizados

- `--brand`: #1a3a5a (azul principal)
- `--navy-900`: #0b1e3a (azul oscuro para sidebar)
- `--bg`: #f6f8fb (fondo claro)

## Componentes UI Incluidos

- Button (con variantes)
- Input
- Card (con header, content, footer)
- Dialog (modal)
- Table (tabla completa)
- Badge (etiquetas)
- Tabs (pestañas)
- Toast (notificaciones)

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx      # Layout centrado para auth
│   │   ├── login/
│   │   │   └── page.tsx    # Página de login
│   │   └── signup/
│   │       └── page.tsx    # Página de registro
│   ├── (protected)/
│   │   ├── layout.tsx      # Layout con sidebar + header
│   │   └── dashboard/
│   │       └── page.tsx    # Dashboard principal
│   ├── globals.css         # Estilos globales
│   └── layout.tsx          # Layout raíz
├── components/
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
└── lib/
    └── utils.ts            # Utilidades para shadcn/ui
```

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en desarrollo:
```bash
npm run dev
```

3. Construir para producción:
```bash
npm run build
```

## Uso

### Páginas de Autenticación
- `/login` - Formulario de inicio de sesión
- `/signup` - Formulario de registro

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

## Responsive Design

- **Mobile**: Sidebar colapsable con overlay
- **Desktop**: Sidebar siempre visible
- **Breakpoints**: Optimizado para móvil, tablet y desktop

## Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Fonts**: Inter (Google Fonts)

## Personalización

### Colores
Los colores personalizados están definidos en `tailwind.config.js` y se pueden modificar fácilmente.

### Componentes
Todos los componentes UI están en `src/components/ui/` y se pueden personalizar según necesidades específicas.

### Layouts
- Layout de autenticación: `src/app/(auth)/layout.tsx`
- Layout protegido: `src/app/(protected)/layout.tsx`

## Licencia

Este proyecto es para uso educativo y de demostración.
