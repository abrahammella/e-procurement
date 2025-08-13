import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import TenderDetailClient from './tender-detail-client'

interface TenderDetailPageProps {
  params: {
    id: string
  }
}

interface Tender {
  id: string
  code: string
  title: string
  description: string | null
  status: 'abierto' | 'en_evaluacion' | 'cerrado' | 'adjudicado'
  budget_rd: number
  delivery_max_months: number
  deadline: string
  created_at: string
  created_by: string
  rfp_path: string | null
}

export default async function TenderDetailPage({ params }: TenderDetailPageProps) {
  const supabase = createServerSupabase()

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Obtener perfil del usuario para verificar rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, supplier_id')
    .eq('id', user.id)
    .single()

  // Obtener tender por ID
  const { data: tender, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !tender) {
    notFound()
  }

  // Verificar si el usuario supplier ya tiene una propuesta para este tender
  let hasExistingProposal = false
  if (profile?.role === 'supplier' && profile.supplier_id) {
    const { data: existingProposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('tender_id', tender.id)
      .eq('supplier_id', profile.supplier_id)
      .single()
    
    hasExistingProposal = !!existingProposal
  }

  const isSupplier = profile?.role === 'supplier'

  return (
    <TenderDetailClient 
      tender={tender}
      isSupplier={isSupplier}
      hasExistingProposal={hasExistingProposal}
    />
  )
}