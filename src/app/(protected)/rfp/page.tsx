import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import RfpClient from './rfp-client'

interface RfpDoc {
  id: string
  tender_id: string
  title: string
  description: string | null
  file_url: string
  required_fields: string[]
  is_mandatory: boolean
  created_at: string
  tenders: {
    id: string
    code: string
    title: string
    status: string
    budget_rd: number
    deadline: string
  }
}

interface RfpData {
  items: RfpDoc[]
  total: number
}

interface Tender {
  id: string
  code: string
  title: string
  status: string
  budget_rd: number
  deadline: string
}

async function getRfpDocs(): Promise<RfpData> {
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

  if (!profile) {
    return { items: [], total: 0 }
  }

  // Construir query para documentos RFP
  const { data: items, error, count } = await supabase
    .from('rfp_docs')
    .select(`
      id,
      tender_id,
      title,
      description,
      file_url,
      required_fields,
      is_mandatory,
      created_at,
      tenders!rfp_docs_tender_id_fkey (
        id,
        code,
        title,
        status,
        budget_rd,
        deadline
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching RFP docs:', error)
    return { items: [], total: 0 }
  }

  return {
    items: items || [],
    total: count || 0
  }
}

async function getTenders(): Promise<Tender[]> {
  const supabase = createServerSupabase()
  
  // Obtener licitaciones para el dropdown de creación
  const { data: tenders, error } = await supabase
    .from('tenders')
    .select('id, code, title, status, budget_rd, deadline')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tenders:', error)
    return []
  }

  return tenders || []
}

export default async function RfpPage() {
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

  if (!profile) {
    notFound()
  }

  const [rfpData, availableTenders] = await Promise.all([
    getRfpDocs(),
    getTenders()
  ])

  return (
    <RfpClient 
      initialData={rfpData}
      availableTenders={availableTenders}
      userRole={profile.role}
    />
  )
}