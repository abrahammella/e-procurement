-- ========= Extensiones requeridas =========
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========= PROFILES (ya lo tienes; aseguramos llave para joins) =========
-- Asumimos public.profiles(id uuid pk, role text, email, supplier_id?) ya existente.

-- ========= SUPPLIERS =========
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rnc text,
  status text not null default 'activo' check (status in ('activo','inactivo','suspendido')),
  certified boolean default false,
  certifications text[],
  experience_years int default 0,
  support_months int default 0,
  contact_email text,
  created_at timestamptz default now()
);
alter table public.suppliers enable row level security;
drop policy if exists "suppliers_read_auth" on public.suppliers;
create policy "suppliers_read_auth" on public.suppliers
for select using (auth.role() = 'authenticated');

-- ========= TENDERS (concursos/licits) =========
create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  status text not null default 'abierto' check (status in ('abierto','en_evaluacion','cerrado','adjudicado')),
  budget_rd numeric(14,2) not null,
  delivery_max_months int not null,
  deadline timestamptz not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.tenders enable row level security;
drop policy if exists "tenders_select_auth" on public.tenders;
create policy "tenders_select_auth" on public.tenders
for select using (auth.role() = 'authenticated');

-- ========= RFP DOCS (documento + metadatos normalizados) =========
create table if not exists public.rfp_docs (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references public.tenders(id) on delete cascade,
  title text not null,
  file_url text not null,                    -- path en Storage
  required_fields jsonb not null default '{}'::jsonb, -- checklist mínimos (legales/técnicos)
  meta jsonb,                                -- issuer, schedule, submission, validity_days, etc.
  evaluation_weights jsonb,                  -- pesos de evaluación (criterios -> %)
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.rfp_docs enable row level security;
drop policy if exists "rfp_select_auth" on public.rfp_docs;
create policy "rfp_select_auth" on public.rfp_docs
for select using (auth.role() = 'authenticated');

-- ========= PROPOSALS (propuestas) =========
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references public.tenders(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete cascade,
  amount_rd numeric(14,2) not null,
  delivery_months int not null,
  doc_url text,                       -- PDF de propuesta en Storage
  status text not null default 'recibida' check (
    status in ('recibida','rechazada','aprobada_comite','aprobada_ejecutivo','seleccionada')
  ),
  ai_eval jsonb,                      -- futuro: resultado IA / scorecard
  created_at timestamptz default now()
);
alter table public.proposals enable row level security;
-- Lectura: admin ve todo; supplier sólo sus propuestas (via profiles.supplier_id)
drop policy if exists "proposals_select_scoped" on public.proposals;
create policy "proposals_select_scoped" on public.proposals
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.supplier_id = proposals.supplier_id
  )
);
-- Inserción: sólo supplier dueño (por su supplier_id)
drop policy if exists "proposals_insert_owner" on public.proposals;
create policy "proposals_insert_owner" on public.proposals
for insert with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.supplier_id = proposals.supplier_id
  )
);

-- ========= APPROVALS (comités) =========
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('comite_rfp','comite_ejecutivo','gerente_ti','director_ti','vp_ti')),
  proposal_id uuid references public.proposals(id) on delete cascade,
  approver_email text not null,
  decision text not null default 'pending' check (decision in ('pending','approved','rejected')),
  decided_at timestamptz,
  comment text,
  decided_by uuid,
  token text,
  expires_at timestamptz
);
alter table public.approvals enable row level security;
-- Lectura/actualización: admin o aprobador (por email en JWT o user_id si luego agregas mapeo)
drop policy if exists "approvals_read_admin_or_approver" on public.approvals;
create policy "approvals_read_admin_or_approver" on public.approvals
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin')
  or (approver_email is not null and approver_email = (auth.jwt()->>'email'))
);
drop policy if exists "approvals_update_approver" on public.approvals;
create policy "approvals_update_approver" on public.approvals
for update using (
  (approver_email is not null and approver_email = (auth.jwt()->>'email'))
);

-- ========= SERVICE ORDERS (OS/PO) =========
create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals(id) on delete cascade,
  po_number text unique,
  pdf_url text,
  status text not null default 'emitida' check (status in ('emitida','en_firma','aprobada','rechazada')),
  created_at timestamptz default now()
);
alter table public.service_orders enable row level security;
drop policy if exists "so_admin_only" on public.service_orders;
create policy "so_admin_only" on public.service_orders
for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ========= INVOICES (facturas) =========
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals(id) on delete cascade,
  service_order_id uuid references public.service_orders(id) on delete set null,
  invoice_url text not null,
  amount_rd numeric(14,2) not null,
  status text not null default 'recibida' check (status in ('recibida','validada','en_pago','pagada','rechazada')),
  created_at timestamptz default now()
);
alter table public.invoices enable row level security;
-- Lectura: admin o supplier dueño (a través de su proposal)
drop policy if exists "invoices_select_scoped" on public.invoices;
create policy "invoices_select_scoped" on public.invoices
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin')
  or exists (
    select 1
    from public.profiles p
    join public.proposals pr on pr.supplier_id = p.supplier_id
    where p.id = auth.uid() and pr.id = invoices.proposal_id
  )
);
-- Inserción: supplier dueño (vinculada a su proposal)
drop policy if exists "invoices_insert_owner" on public.invoices;
create policy "invoices_insert_owner" on public.invoices
for insert with check (
  exists (
    select 1
    from public.profiles p
    join public.proposals pr on pr.supplier_id = p.supplier_id
    where p.id = auth.uid() and pr.id = invoices.proposal_id
  )
);

-- ========= EVENTS (audit log) =========
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  entity text not null,          -- 'tender'|'rfp'|'proposal'|'approval'|'service_order'|'invoice'|'n8n_hook'
  entity_id uuid,
  event text not null,           -- 'created'|'updated'|'deleted'|...
  payload jsonb,
  created_at timestamptz default now()
);
alter table public.events enable row level security;
drop policy if exists "events_admin_read" on public.events;
create policy "events_admin_read" on public.events
for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ========= Índices útiles =========
create index if not exists idx_tenders_status on public.tenders(status);
create index if not exists idx_tenders_deadline on public.tenders(deadline);
create index if not exists idx_proposals_tender on public.proposals(tender_id);
create index if not exists idx_proposals_supplier on public.proposals(supplier_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_events_entity on public.events(entity, entity_id);
create index if not exists idx_approvals_proposal on public.approvals(proposal_id);
create index if not exists idx_approvals_scope on public.approvals(scope);
