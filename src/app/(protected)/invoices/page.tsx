import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import InvoicesClient from './invoices-client'

interface Invoice {
  id: string
  proposal_id: string
  service_order_id: string | null
  invoice_url: string
  amount_rd: number
  status: 'recibida' | 'validada' | 'en_pago' | 'pagada' | 'rechazada'
  created_at: string
  proposals: {
    id: string
    amount_rd: number
    delivery_months: number
    status: string
    supplier_id: string
    tenders: {
      id: string
      code: string
      title: string
      status: string
      budget_rd: number
    }
  }
  service_orders: {
    id: string
    po_number: string
    status: string
  } | null
}

interface InvoicesData {
  items: Invoice[]
  total: number
}

async function getInvoices(): Promise<InvoicesData> {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { items: [], total: 0 }
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, supplier_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { items: [], total: 0 }
  }

  // Construir query base con joins
  let query = supabase
    .from('invoices')
    .select(`
      id,
      proposal_id,
      service_order_id,
      invoice_url,
      amount_rd,
      status,
      created_at,
      proposals!invoices_proposal_id_fkey (
        id,
        amount_rd,
        delivery_months,
        status,
        supplier_id,
        tenders!proposals_tender_id_fkey (
          id,
          code,
          title,
          status,
          budget_rd
        )
      ),
      service_orders!invoices_service_order_id_fkey (
        id,
        po_number,
        status
      )
    `, { count: 'exact' })

  // Aplicar filtros de seguridad
  if (profile.role === 'admin') {
    // Admins pueden ver todas las facturas
  } else if (profile.role === 'supplier' && profile.supplier_id) {
    // Suppliers solo pueden ver sus propias facturas
    query = query.eq('proposals.supplier_id', profile.supplier_id)
  } else {
    return { items: [], total: 0 }
  }

  // Ordenar por fecha de creación
  query = query.order('created_at', { ascending: false })

  const { data: items, error, count } = await query

  if (error) {
    console.error('Error fetching invoices:', error)
    return { items: [], total: 0 }
  }

  // Transform data to match interface
  const transformedItems = items?.map((item: any) => ({
    ...item,
    proposals: item.proposals?.[0] || null,
    service_orders: item.service_orders?.[0] || null
  })) || []

  return {
    items: transformedItems,
    total: count || 0
  }
}

export default async function InvoicesPage() {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, supplier_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    notFound()
  }

  const invoicesData = await getInvoices()

  return (
    <InvoicesClient 
      initialData={invoicesData}
      userRole={profile.role}
      supplierId={profile.supplier_id}
    />
  )
}