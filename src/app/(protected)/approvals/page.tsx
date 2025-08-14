import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ApprovalsClient from './approvals-client'

interface Approval {
  id: string
  scope: 'apertura_tender' | 'comite_rfp' | 'comite_ejecutivo' | 'gerente_ti' | 'director_ti' | 'vp_ti'
  proposal_id: string | null
  tender_id: string | null
  approver_email: string
  decision: 'pending' | 'approved' | 'rejected'
  decided_at: string | null
  comment: string | null
  decided_by: string | null
  token: string
  expires_at: string
  proposals?: {
    id: string
    amount_rd: number
    delivery_months: number
    status: string
    tenders: {
      id: string
      code: string
      title: string
      status: string
      budget_rd: number
      deadline: string
    }
  }
  tenders?: {
    id: string
    code: string
    title: string
    status: string
    budget_rd: number
    deadline: string
    description: string | null
  }
}

interface ApprovalsData {
  items: Approval[]
  total: number
}

async function getApprovals(): Promise<ApprovalsData> {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { items: [], total: 0 }
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { items: [], total: 0 }
  }

  // Construir query base
  let query = supabase
    .from('approvals')
    .select(`
      id,
      scope,
      proposal_id,
      tender_id,
      approver_email,
      decision,
      decided_at,
      comment,
      decided_by,
      token,
      expires_at,
      proposals (
        id,
        amount_rd,
        delivery_months,
        status,
        tenders (
          id,
          code,
          title,
          status,
          budget_rd,
          deadline
        )
      ),
      tenders!approvals_tender_id_fkey (
        id,
        code,
        title,
        status,
        budget_rd,
        deadline,
        description
      )
    `, { count: 'exact' })

  // Filtrar según el rol
  if (profile.role === 'admin') {
    // Admins pueden ver todas las aprobaciones
  } else {
    // Usuarios normales solo ven sus propias aprobaciones
    query = query.eq('approver_email', profile.email)
  }

  // Ordenar por fecha de creación, pendientes primero
  query = query.order('decision').order('created_at', { ascending: false })

  const { data: items, error } = await query

  if (error) {
    console.error('Error fetching approvals:', error)
    return { items: [], total: 0 }
  }

  // Transform data to match interface
  const transformedItems = items?.map((item: any) => ({
    ...item,
    proposals: item.proposals?.[0] || null,
    tenders: item.tenders?.[0] || null
  })) || []

  return {
    items: transformedItems,
    total: transformedItems.length
  }
}

export default async function ApprovalsPage() {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    notFound()
  }

  const approvalsData = await getApprovals()

  return (
    <ApprovalsClient 
      initialData={approvalsData}
      userRole={profile.role}
      userEmail={profile.email}
    />
  )
}