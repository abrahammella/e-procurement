import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ServiceOrdersClient from './service-orders-client'

interface ServiceOrder {
  id: string
  proposal_id: string
  po_number: string
  pdf_url: string | null
  status: 'emitida' | 'en_firma' | 'aprobada' | 'rechazada'
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
}

interface ServiceOrdersData {
  items: ServiceOrder[]
  total: number
}

async function getServiceOrders(): Promise<ServiceOrdersData> {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { items: [], total: 0 }
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { items: [], total: 0 }
  }

  // Construir query para órdenes de servicio
  const { data: items, error, count } = await supabase
    .from('service_orders')
    .select(`
      id,
      proposal_id,
      po_number,
      pdf_url,
      status,
      created_at,
      proposals!service_orders_proposal_id_fkey (
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
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching service orders:', error)
    return { items: [], total: 0 }
  }

  // Transform data to match interface
  const transformedItems = items?.map((item: any) => ({
    ...item,
    proposals: item.proposals?.[0] ? {
      ...item.proposals[0],
      tenders: item.proposals[0].tenders?.[0] || null
    } : null
  })) || []

  return {
    items: transformedItems,
    total: count || 0
  }
}

export default async function ServiceOrdersPage() {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Obtener perfil del usuario  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    notFound()
  }

  const serviceOrdersData = await getServiceOrders()

  return (
    <ServiceOrdersClient 
      initialData={serviceOrdersData}
      userRole={profile.role}
    />
  )
}