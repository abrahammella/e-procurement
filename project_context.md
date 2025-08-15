# E‑Procurement — Licitación de Compras (Front + Back con Supabase)

## Estado Actual del Proyecto ✅

**Progreso**: Implementación completa de autenticación y estructura base
**Última actualización**: Mejoras de seguridad implementadas
**Estado**: MVP funcional con autenticación robusta

## Objetivo
Construir en 2 días un MVP funcional de E‑Procurement que permita:
- **Login/Sign Up** (Supabase Auth) ✅ IMPLEMENTADO
- **Panel Admin** (por rol) con CRUD de Licitacións/Licitaciones y RFPs (con archivos en Supabase Storage)
- **Panel Suplidor** para ver RFP/Licitacións, postular, subir documentos y facturas, y ver estados
> En esta primera iteración NO integramos n8n/IA; dejaremos hooks listos.

## Funcionalidades Implementadas ✅

### Autenticación y Seguridad
- **Supabase Auth** completamente configurado
- **Sistema de roles** (admin/supplier) implementado
- **Middleware de protección** de rutas por rol
- **Hook useAuth** con gestión completa de estado
- **Mejoras de seguridad** implementadas (eliminado warning de `getSession()`)
- **Validación de usuarios** directa con servidor Supabase

### Estructura de Base de Datos
- **Tabla profiles** con roles y metadatos de usuario
- **Políticas RLS** (Row Level Security) implementadas
- **Triggers automáticos** para sincronización de datos
- **Índices optimizados** para rendimiento

### Componentes UI
- **Sistema de autenticación** completo (login/signup)
- **Layouts responsivos** para auth y área protegida
- **Sidebar y header** implementados
- **Componentes shadcn/ui** base configurados
- **Sistema de notificaciones** (toast) implementado

## Roles Implementados ✅
- **admin**: ve y gestiona todo (Licitacións, RFPs, propuestas, aprobaciones, OS, facturas)
- **supplier**: ve licitaciones abiertas, postula y sube documentos/facturas; ve su progreso

## Rutas Implementadas ✅
- `/login`, `/signup` ✅ COMPLETO
- `/dashboard` (mismo contenedor; renderiza por rol) ✅ COMPLETO
- `/tenders` (listado + CRUD admin) 🔄 EN DESARROLLO
- `/tenders/[id]` (detalle; supplier ve info/postula) 🔄 EN DESARROLLO
- `/rfp` (admin: listado + CRUD + archivos) 🔄 EN DESARROLLO
- `/proposals` (supplier: mis propuestas) 🔄 EN DESARROLLO
- `/invoices` (supplier/admin) 🔄 EN DESARROLLO

## Estilo UI (referencia visual adjunta) ✅
- **Brand**: *E‑Procurement* ✅
- **Sidebar izquierda** oscura; **contenido** claro ✅
- **Cards** con sombras suaves, **bordes 10–12px**, espaciado generoso ✅
- **Gráficos/KPIs** en dashboard (fase 2) 🔄 PENDIENTE
- **Tipografía**: Inter / system-ui ✅
- **Iconos**: lucide-react ✅
- **Componentes base**: shadcn/ui (Button, Input, Badge, Card, Dialog, Table, Tabs, Toast) ✅

### Paleta (tokens) ✅
- `--brand: #1a3a5a` (azul Tevolv / acento) ✅
- `--navy-900: #0b1e3a` (sidebar) ✅
- `--navy-700: #102a54` ✅
- `--bg: #f6f8fb` ✅
- `--card: #ffffff` ✅
- Éxito `#16a34a`, Advertencia `#f59e0b`, Peligro `#ef4444` ✅

## Accesibilidad ✅
- Contraste AA para texto/botones ✅
- Estados focus visibles ✅
- Soporte teclado en formularios/dialogs ✅

## Datos (v1, implementado) ✅
- `profiles (id, role, name, email, supplier_id?)` ✅ IMPLEMENTADO
- `suppliers (certified, status, certifications, experience_years, support_months, contact_email)` ✅ IMPLEMENTADO
- `tenders (code, title, status, budget_rd, delivery_max_months, deadline)` ✅ IMPLEMENTADO
- `rfp_docs (tender_id, title, file_url, required_fields)` ✅ IMPLEMENTADO
- `proposals (tender_id, supplier_id, amount_rd, delivery_months, doc_url, status)` ✅ IMPLEMENTADO
- `approvals`, `service_orders`, `invoices`, `events` ✅ IMPLEMENTADO

## Mejoras de Seguridad Implementadas ✅

### Problema Resuelto
- **Warning eliminado**: "Using the user object as returned from supabase.auth.getSession() could be insecure"
- **Implementado**: `supabase.auth.getUser()` para validación segura
- **Middleware actualizado**: Protección de rutas más robusta
- **Hook useAuth mejorado**: Autenticación confiable con servidor

### Archivos Modificados
1. `src/middleware.ts` - Middleware de autenticación seguro
2. `src/hooks/useAuth.ts` - Hook de autenticación mejorado
3. `src/components/auth/SupabaseLoginForm.tsx` - Formulario de login seguro

## Roadmap Actualizado

**Día 1** ✅ COMPLETADO
1. ✅ UI: Login / Sign Up (estilo de referencia)
2. ✅ Shell/Layout, Sidebar, Header, Theme tokens
3. ✅ Dashboard por rol (sin datos aún)
4. ✅ Supabase Auth + profiles + role‑based guard
5. ✅ Mejoras de seguridad implementadas
6. ✅ Esquema completo de base de datos implementado

**Día 2** 🔄 EN PROGRESO
1. 🔄 Supabase Storage helper (PDF)
2. ✅ Tablas mínimas + CRUD (tenders + rfp) + lista supplier
3. 🔄 Data seeding y datos de prueba
4. 🔄 Hooks finales para n8n (stubs `callN8N`)

## Definition of Done Actualizado
- ✅ Login/Sign Up funcionando con Supabase
- ✅ Dashboard único por rol
- ✅ Sistema de autenticación seguro implementado
- ✅ Middleware de protección de rutas
- 🔄 CRUD de Licitacións y RFPs (con upload a Storage)
- 🔄 Supplier puede ver licitaciones, postular y subir documentos
- 🔄 Auditoría mínima (events) lista para fase siguiente

## Próximos Pasos Inmediatos
1. ✅ **Implementar CRUD de tenders** (Licitacións/licitaciones) - ESQUEMA LISTO
2. 🔄 **Configurar Supabase Storage** para archivos PDF
3. ✅ **Crear tablas de datos** restantes - COMPLETADO
4. 🔄 **Implementar flujo de propuestas** para suppliers - ESQUEMA LISTO
5. 🔄 **Sistema de notificaciones** para cambios de estado
6. 🔄 **Data seeding** con datos de prueba para desarrollo

## Estado de la Base de Datos
- ✅ **Profiles table**: Implementada con RLS
- ✅ **Auth triggers**: Configurados para sincronización
- ✅ **Core schema**: Esquema completo implementado (suppliers, tenders, rfp_docs, proposals, approvals, service_orders, invoices, events)
- ✅ **RLS policies**: Políticas de seguridad implementadas para todas las tablas
- ✅ **Indexes**: Índices optimizados para consultas frecuentes
- 🔄 **Data seeding**: Pendiente de implementación