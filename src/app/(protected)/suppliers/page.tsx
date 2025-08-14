import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import SuppliersClient from './suppliers-client'

interface Supplier {
  id: string
  name: string
  rnc: string | null
  status: 'activo' | 'inactivo' | 'suspendido'
  certified: boolean
  certifications: string[]
  experience_years: number
  support_months: number
  contact_email: string | null
  created_at: string
  proposals?: { count: number }[]
  active_proposals?: { count: number }[]
}

interface SuppliersData {
  items: Supplier[]
  total: number
}

async function getSuppliers(): Promise<SuppliersData> {
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

  // Construir query para proveedores con estadísticas
  const { data: items, error, count } = await supabase
    .from('suppliers')
    .select(`
      id,
      name,
      rnc,
      status,
      certified,
      certifications,
      experience_years,
      support_months,
      contact_email,
      created_at
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching suppliers:', error)
    return { items: [], total: 0 }
  }

  // Obtener estadísticas de propuestas para cada proveedor
  const suppliersWithStats = await Promise.all(
    (items || []).map(async (supplier) => {
      const [
        { count: totalProposals },
        { count: activeProposals }
      ] = await Promise.all([
        supabase
          .from('proposals')
          .select('*', { count: 'exact', head: true })
          .eq('supplier_id', supplier.id),
        supabase
          .from('proposals')
          .select('*', { count: 'exact', head: true })
          .eq('supplier_id', supplier.id)
          .eq('status', 'enviada')
      ])

      return {
        ...supplier,
        totalProposals: totalProposals || 0,
        activeProposals: activeProposals || 0
      }
    })
  )

  return {
    items: suppliersWithStats,
    total: count || 0
  }
}

export default async function SuppliersPage() {
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

  const suppliersData = await getSuppliers()

  return (
    <SuppliersClient 
      initialData={suppliersData}
      userRole={profile.role}
    />
  )
}