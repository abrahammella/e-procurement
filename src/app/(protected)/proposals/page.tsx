import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProposalsClient from './proposals-client'

interface Proposal {
  id: string
  tender_id: string
  supplier_id: string
  amount_rd: number
  delivery_months: number
  status: 'recibida' | 'en_evaluacion' | 'rechazada' | 'adjudicada'
  doc_url: string | null
  created_at: string
  tenders: {
    id: string
    code: string
    title: string
    status: string
    deadline: string
    budget_rd: number
  }
  suppliers?: {
    id: string
    name: string
    rnc: string
  }
}

interface ProposalsData {
  items: Proposal[]
  total: number
}

async function getProposals(): Promise<ProposalsData> {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { items: [], total: 0 }
  }

  // Verificar que es admin o supplier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, supplier_id')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && !profile.supplier_id)) {
    return { items: [], total: 0 }
  }

  // Query para obtener propuestas
  let query = supabase
    .from('proposals')
    .select('*', { count: 'exact' })

  // Solo filtrar por supplier_id si no es admin
  if (profile.role !== 'admin' && profile.supplier_id) {
    query = query.eq('supplier_id', profile.supplier_id)
  }

  const { data: items, error, count } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching proposals:', error)
    return { items: [], total: 0 }
  }

  let processedItems = items || []

  // Agregar información de tenders y suppliers manualmente por ahora
  const tendersMap = new Map()
  const suppliersMap = new Map()

  // Obtener tenders
  if (processedItems.length > 0) {
    const tenderIds = processedItems.map(item => item.tender_id)
    const { data: tenders } = await supabase
      .from('tenders')
      .select('id, code, title, status, deadline, budget_rd')
      .in('id', tenderIds)
    
    tenders?.forEach(tender => {
      tendersMap.set(tender.id, tender)
    })

    const supplierIds = processedItems.map(item => item.supplier_id)
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, name, rnc')
      .in('id', supplierIds)
    
    suppliers?.forEach(supplier => {
      suppliersMap.set(supplier.id, supplier)
    })
  }

  // Transform data to match interface  
  const transformedItems = processedItems?.map((item: any) => ({
    ...item,
    tenders: tendersMap.get(item.tender_id) || null,
    suppliers: suppliersMap.get(item.supplier_id) || null
  })) || []

  return {
    items: transformedItems,
    total: count || 0
  }
}

export default async function ProposalsPage() {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Verificar que es admin o supplier
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, supplier_id')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && !profile.supplier_id)) {
    notFound()
  }

  const proposalsData = await getProposals()

  return (
    <ProposalsClient 
      initialData={proposalsData}
      supplierId={profile.supplier_id}
      userRole={profile.role}
    />
  )
}