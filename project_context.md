# E‑Procurement — Concurso de Compras (Front + Back con Supabase)

## Objetivo
Construir en 2 días un MVP funcional de E‑Procurement que permita:
- **Login/Sign Up** (Supabase Auth).
- **Panel Admin** (por rol) con CRUD de Concursos/Licitaciones y RFPs (con archivos en Supabase Storage).
- **Panel Suplidor** para ver RFP/concursos, postular, subir documentos y facturas, y ver estados.
> En esta primera iteración NO integramos n8n/IA; dejaremos hooks listos.

## Roles
- **admin**: ve y gestiona todo (concursos, RFPs, propuestas, aprobaciones, OS, facturas).
- **supplier**: ve licitaciones abiertas, postula y sube documentos/facturas; ve su progreso.

## Rutas iniciales (App Router)
- `/login`, `/signup`
- `/dashboard` (mismo contenedor; renderiza por rol)
- `/tenders` (listado + CRUD admin)
- `/tenders/[id]` (detalle; supplier ve info/postula)
- `/rfp` (admin: listado + CRUD + archivos)
- `/proposals` (supplier: mis propuestas)
- `/invoices` (supplier/admin)

## Estilo UI (referencia visual adjunta)
- **Brand**: *E‑Procurement*.
- **Sidebar izquierda** oscura; **contenido** claro.
- **Cards** con sombras suaves, **bordes 10–12px**, espaciado generoso.
- **Gráficos/KPIs** en dashboard (fase 2).
- **Tipografía**: Inter / system-ui.
- **Iconos**: lucide-react.
- **Componentes base**: shadcn/ui (Button, Input, Badge, Card, Dialog, Table, Tabs, Toast).

### Paleta (tokens)
- `--brand: #1a3a5a` (azul Tevolv / acento)
- `--navy-900: #0b1e3a` (sidebar)
- `--navy-700: #102a54`
- `--bg: #f6f8fb`
- `--card: #ffffff`
- Éxito `#16a34a`, Advertencia `#f59e0b`, Peligro `#ef4444`.

## Accesibilidad
- Contraste AA para texto/botones.
- Estados focus visibles.
- Soporte teclado en formularios/dialogs.

## Datos (v1, resumido)
Más adelante creamos tablas en Supabase. Por ahora sólo UI + Auth.
- `profiles (id, role, name, email, supplier_id?)`
- `suppliers (certified, status, certifications, experience_years, support_months, contact_email)`
- `tenders (code, title, status, budget_rd, delivery_max_months, deadline)`
- `rfp_docs (tender_id, title, file_url, required_fields)`
- `proposals (tender_id, supplier_id, amount_rd, delivery_months, doc_url, status)`
- `approvals`, `service_orders`, `invoices`, `events` (para fases siguientes)

## Roadmap (2 días)
**Día 1**
1. UI: Login / Sign Up (estilo de referencia).
2. Shell/Layout, Sidebar, Header, Theme tokens.
3. Dashboard (UI) por rol (sin datos aún).

**Día 2**
1. Supabase Auth + profiles + role‑based guard.
2. Supabase Storage helper (PDF).
3. Tablas mínimas + CRUD (tenders + rfp) + lista supplier.
4. Hooks finales para n8n (stubs `callN8N`).

## Definition of Done
- Login/Sign Up funcionando con Supabase.
- Dashboard único por rol.
- CRUD de concursos y RFPs (con upload a Storage).
- Supplier puede ver licitaciones, postular y subir documentos.
- Auditoría mínima (events) lista para fase siguiente.