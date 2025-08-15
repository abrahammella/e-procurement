# 📚 Documentación Completa del Proyecto E-Procurement

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **UI**: Tailwind CSS + shadcn/ui
- **Lenguaje**: TypeScript
- **Validación**: Zod
- **Estado**: React hooks + Context
- **Integración Externa**: N8N webhooks

### Estructura de Carpetas
```
src/
├── app/
│   ├── (auth)/          # Rutas públicas (login, signup)
│   ├── (protected)/     # Rutas protegidas por autenticación
│   └── api/             # API Routes de Next.js
├── components/
│   ├── auth/            # Componentes de autenticación
│   ├── layout/          # Layouts (Sidebar, Header)
│   └── ui/              # Componentes shadcn/ui
├── hooks/               # Custom hooks (useAuth, useToast)
├── lib/                 # Utilidades y configuración
└── types/               # TypeScript types
```

## 🗄️ Base de Datos - Esquema Completo

### Tablas Principales

#### 1. **profiles** (Usuarios extendidos)
```sql
- id (uuid) - PK, FK to auth.users
- role (text) - 'admin' | 'supplier' | 'committee' | 'executive'
- name (text)
- email (text)
- supplier_id (uuid) - FK to suppliers (nullable)
- created_at (timestamptz)
```

#### 2. **suppliers** (Proveedores)
```sql
- id (uuid) - PK
- name (text)
- rnc (text) - Registro Nacional de Contribuyentes
- status (text) - 'activo' | 'inactivo' | 'suspendido'
- certified (boolean)
- certifications (text[])
- experience_years (int)
- support_months (int)
- contact_email (text)
- created_at (timestamptz)
```

#### 3. **tenders** (Licitaciones)
```sql
- id (uuid) - PK
- code (text) - UNIQUE
- title (text)
- description (text)
- status (text) - 'abierta' | 'en_evaluacion' | 'cerrado' | 'adjudicado'
- budget_rd (numeric) - Presupuesto en RD$
- delivery_max_months (int)
- deadline (timestamptz)
- created_by (uuid) - FK to profiles
- created_at (timestamptz)
```

#### 4. **rfp_docs** (Documentos RFP)
```sql
- id (uuid) - PK
- tender_id (uuid) - FK to tenders
- title (text)
- file_url (text) - Path en Storage
- required_fields (jsonb) - Campos requeridos
- meta (jsonb) - Metadata adicional
- created_by (uuid) - FK to profiles
- created_at (timestamptz)
```

#### 5. **proposals** (Propuestas de Proveedores)
```sql
- id (uuid) - PK
- tender_id (uuid) - FK to tenders
- supplier_id (uuid) - FK to suppliers
- amount_rd (numeric) - Monto propuesto
- delivery_months (int)
- doc_url (text) - PDF de propuesta
- status (text) - 'recibida' | 'rechazada' | 'aprobada_comite' | 'aprobada_ejecutivo' | 'seleccionada'
- ai_eval (jsonb) - Evaluación IA (futuro)
- created_at (timestamptz)
```

#### 6. **approvals** (Aprobaciones)
```sql
- id (uuid) - PK
- entity (text) - 'tender' | 'proposal' | 'invoice'
- entity_id (uuid)
- approver_id (uuid) - FK to profiles
- status (text) - 'pendiente' | 'aprobado' | 'rechazado'
- comments (text)
- approved_at (timestamptz)
- created_at (timestamptz)
```

#### 7. **service_orders** (Órdenes de Servicio)
```sql
- id (uuid) - PK
- code (text) - UNIQUE
- tender_id (uuid) - FK to tenders
- proposal_id (uuid) - FK to proposals
- supplier_id (uuid) - FK to suppliers
- amount_rd (numeric)
- delivery_months (int)
- status (text) - 'draft' | 'activo' | 'completado' | 'cancelado'
- created_by (uuid) - FK to profiles
- created_at (timestamptz)
```

#### 8. **invoices** (Facturas)
```sql
- id (uuid) - PK
- service_order_id (uuid) - FK to service_orders
- supplier_id (uuid) - FK to suppliers
- invoice_number (text)
- amount_rd (numeric)
- doc_url (text) - PDF de factura
- status (text) - 'borrador' | 'enviada' | 'aprobada' | 'pagada' | 'rechazada'
- created_at (timestamptz)
```

#### 9. **events** (Auditoría)
```sql
- id (uuid) - PK
- entity (text) - Tipo de entidad
- entity_id (uuid) - ID de la entidad
- event (text) - Tipo de evento
- payload (jsonb) - Datos del evento
- created_at (timestamptz)
```

#### 10. **notifications** (Notificaciones)
```sql
- id (uuid) - PK
- user_id (uuid) - FK to auth.users
- title (text)
- message (text)
- type (text) - 'info' | 'success' | 'warning' | 'error' | 'tender' | 'proposal' | 'approval' | 'invoice'
- read (boolean)
- related_entity (text)
- related_id (uuid)
- created_at (timestamptz)
```

### Políticas de Seguridad (RLS)
- **profiles**: Solo lectura autenticados, update propio perfil
- **suppliers**: Lectura autenticados, write solo admin
- **tenders**: Lectura autenticados, write solo admin
- **proposals**: Suppliers ven/crean las suyas, admin ve todas
- **approvals**: Solo usuarios con rol apropiado
- **events**: Solo admin puede leer

## 🎨 Frontend - Componentes y Flujos

### Autenticación
- **Login**: Email + contraseña con Supabase Auth
- **Signup**: Proceso multi-paso (cuenta → info personal → confirmación)
- **Middleware**: Protección de rutas por rol en `middleware.ts`
- **Hook useAuth**: Gestión centralizada del estado de autenticación

### Layouts
- **AuthShell**: Layout para páginas públicas (centrado, minimalista)
- **DashboardShell**: Layout para área protegida (sidebar + header)
- **Sidebar**: Navegación dinámica según rol del usuario
- **Header**: Muestra usuario actual y notificaciones

### Páginas Principales

#### Admin
- **/dashboard**: Métricas y resumen (pendiente gráficos)
- **/tenders**: CRUD completo de licitaciones
- **/tenders/[id]**: Detalle de licitación con propuestas
- **/suppliers**: Gestión de proveedores
- **/approvals**: Centro de aprobaciones
- **/service-orders**: Órdenes de servicio
- **/invoices**: Gestión de facturas

#### Supplier
- **/dashboard**: Sus propuestas y estado
- **/tenders**: Ver licitaciones abiertas
- **/tenders/[id]**: Aplicar a licitación
- **/proposals**: Sus propuestas enviadas
- **/invoices**: Sus facturas

#### Committee
- **/dashboard**: Licitaciones pendientes de aprobación
- **/approvals**: Aprobar/rechazar licitaciones

### Componentes Clave
- **TendersClient**: Lista de licitaciones con filtros y acciones
- **ProposalForm**: Formulario para enviar propuestas
- **RfpViewer**: Visualizador de PDFs
- **NotificationBell**: Notificaciones en tiempo real
- **ActionButtons**: Acciones contextuales según rol

## 🔧 Funcionalidades Implementadas

### ✅ Completadas
1. **Sistema de autenticación completo**
   - Login/logout
   - Registro multi-paso
   - Recuperación de contraseña
   - Gestión de sesiones

2. **Gestión de licitaciones**
   - CRUD completo para admin
   - Upload de RFP (PDF)
   - Estados y flujo de trabajo
   - Búsqueda y filtros

3. **Sistema de propuestas**
   - Suppliers pueden aplicar
   - Upload de documentos
   - Validación de reglas de negocio
   - Estado de aplicación visible

4. **Notificaciones**
   - Sistema básico implementado
   - Notificaciones a committee
   - Badge de no leídas

5. **Storage de archivos**
   - Bucket 'docs' configurado
   - Upload/download de PDFs
   - Políticas de seguridad

6. **Integración N8N**
   - Webhook al crear tender
   - Payload con datos completos
   - Logs de eventos

### 🔄 Parcialmente Implementadas
1. **Dashboard con métricas** - UI lista, falta data
2. **Sistema de aprobaciones** - Estructura lista, falta flujo
3. **Órdenes de servicio** - CRUD básico
4. **Facturas** - CRUD básico

### ❌ Pendientes
1. **Evaluación automática** con IA
2. **Generación de contratos**
3. **Sistema de pagos**
4. **Reportes y analytics**
5. **Chat/mensajería interna**
6. **API pública**

## 🚀 Configuración y Despliegue

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Comandos Principales
```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run start    # Iniciar producción
npm run lint     # Linting
```

### Setup Inicial
1. Clonar repositorio
2. Instalar dependencias: `npm install`
3. Configurar `.env.local`
4. Ejecutar migraciones: `supabase/migrations/20250813_core.sql`
5. Ejecutar setup adicional: `FINAL_SQL_SETUP.sql`
6. Iniciar desarrollo: `npm run dev`

## 🐛 Problemas Conocidos y Soluciones

### 1. **N8N Webhook no llega**
- **Causa**: pg_net no configurado o URL incorrecta
- **Solución**: Verificar extensión y URL en `FINAL_SQL_SETUP.sql`

### 2. **Upload de PDF falla**
- **Causa**: Políticas de storage restrictivas
- **Solución**: Ejecutar políticas en `FINAL_SQL_SETUP.sql`

### 3. **Roles no funcionan**
- **Causa**: Profile no creado al registrarse
- **Solución**: Trigger automático en tabla profiles

### 4. **Notificaciones no aparecen**
- **Causa**: Tabla notifications no existe
- **Solución**: Incluida en migraciones

## 📝 Notas de Desarrollo

### Patrones Utilizados
- **Server Components** por defecto (Next.js 14)
- **Client Components** solo cuando necesario
- **Composición** sobre herencia
- **Tipos estrictos** con TypeScript
- **Validación en frontend y backend**

### Decisiones de Arquitectura
1. **Supabase sobre backend custom** - Rapidez de desarrollo
2. **App Router** - Mejor performance y DX
3. **shadcn/ui** - Componentes customizables
4. **Zod** - Validación tipo-segura
5. **No ORM** - Supabase client directo

### Mejores Prácticas Aplicadas
- ✅ Autenticación segura (getUser vs getSession)
- ✅ RLS en todas las tablas
- ✅ Validación de inputs
- ✅ Manejo de errores consistente
- ✅ Logs de auditoría
- ✅ Componentes reutilizables

## 🎯 Roadmap Futuro

### Fase 2 (2-4 semanas)
- [ ] Dashboard con gráficos reales
- [ ] Flujo completo de aprobaciones
- [ ] Evaluación con IA
- [ ] Notificaciones email

### Fase 3 (1-2 meses)
- [ ] Generación automática de contratos
- [ ] Sistema de pagos integrado
- [ ] Portal público de licitaciones
- [ ] App móvil

### Fase 4 (3+ meses)
- [ ] Analytics avanzado
- [ ] API pública
- [ ] Integraciones ERP
- [ ] Multi-tenancy

## 🤝 Contribución

### Estructura de Commits
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Documentación
- `style:` Formato, no cambia lógica
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Tareas de mantenimiento

### Flujo de Trabajo
1. Crear branch desde `main`
2. Desarrollar feature
3. Tests y lint
4. PR con descripción clara
5. Code review
6. Merge a main

---

**Última actualización**: Enero 2025
**Versión**: 1.0.0
**Estado**: MVP Funcional