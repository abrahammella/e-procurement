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
  updated_at: string
  tenders: {
    id: string
    code: string
    title: string
    status: string
    deadline: string
    budget_rd: number
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

  // Verificar que es supplier
  const { data: profile } = await supabase
    .from('profiles')
    .select('supplier_id')
    .eq('id', user.id)
    .single()

  if (!profile?.supplier_id) {
    return { items: [], total: 0 }
  }

  // Obtener propuestas del supplier
  const { data: items, error, count } = await supabase
    .from('proposals')
    .select(`
      id,
      tender_id,
      supplier_id,
      amount_rd,
      delivery_months,
      status,
      doc_url,
      created_at,
      updated_at,
      tenders!proposals_tender_id_fkey (
        id,
        code,
        title,
        status,
        deadline,
        budget_rd
      )
    `, { count: 'exact' })
    .eq('supplier_id', profile.supplier_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching proposals:', error)
    return { items: [], total: 0 }
  }

  return {
    items: items || [],
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

  // Verificar que es supplier
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, supplier_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'supplier' || !profile.supplier_id) {
    notFound()
  }

  const proposalsData = await getProposals()

  return (
    <ProposalsClient 
      initialData={proposalsData}
      supplierId={profile.supplier_id}
    />
  )
}