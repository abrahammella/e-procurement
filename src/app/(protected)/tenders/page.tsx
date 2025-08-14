import { createServerSupabase } from '@/lib/supabase-server'
import TendersClient from './tenders-client'

interface Tender {
  id: string
  code: string
  title: string
  description?: string
  status: 'pendiente_aprobacion' | 'abierta' | 'cerrada' | 'evaluacion' | 'adjudicada' | 'cancelada'
  budget_rd: number
  delivery_max_months: number
  deadline: string
  created_at: string
  created_by: string
  rfp_path?: string // Opcional hasta que se agregue la columna en Supabase
}

interface TendersData {
  items: Tender[]
  total: number
}

async function getTenders(userRole?: string): Promise<TendersData> {
  const supabase = createServerSupabase()
  
  let query = supabase
    .from('tenders')
    .select(`
      id,
      code,
      title,
      description,
      status,
      budget_rd,
      delivery_max_months,
      deadline,
      created_at,
      created_by,
      rfp_path
    `, { count: 'exact' })

  // Aplicar filtros basados en el rol
  if (userRole === 'supplier') {
    query = query.eq('status', 'abierta')
  }

  const { data: items, error, count } = await query
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching tenders:', error)
    return { items: [], total: 0 }
  }

  return {
    items: items || [],
    total: count || 0
  }
}

export default async function TendersPage() {
  const { data: { user } } = await createServerSupabase().auth.getUser()
  const { data: profile } = await createServerSupabase()
    .from('profiles')
    .select('role, supplier_id')
    .eq('id', user?.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isSupplier = profile?.role === 'supplier'
  const initialData = await getTenders(profile?.role)

  return <TendersClient 
    initialData={initialData} 
    isAdmin={isAdmin} 
    isSupplier={isSupplier}
    supplierId={profile?.supplier_id || null}
  />
}