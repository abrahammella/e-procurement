import { createServerSupabase } from '@/lib/supabase-server'
import TendersClient from './tenders-client'

interface Tender {
  id: string
  code: string
  title: string
  description?: string
  status: 'abierto' | 'en_evaluacion' | 'cerrado' | 'adjudicado'
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

async function getTenders(): Promise<TendersData> {
  const supabase = createServerSupabase()
  
  const { data: items, error, count } = await supabase
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
  const initialData = await getTenders()

  return <TendersClient 
    initialData={initialData} 
    isAdmin={isAdmin} 
    isSupplier={isSupplier}
    supplierId={profile?.supplier_id || null}
  />
}