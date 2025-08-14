import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import DashboardClient from './dashboard-client'

interface DashboardStats {
  // Stats generales
  totalTenders: number
  activeTenders: number
  totalProposals: number
  totalSuppliers: number
  
  // Stats financieras
  totalBudget: number
  totalProposalsAmount: number
  totalInvoicesAmount: number
  paidInvoicesAmount: number
  
  // Stats por estado
  tendersByStatus: Record<string, number>
  proposalsByStatus: Record<string, number>
  invoicesByStatus: Record<string, number>
  
  // Actividad reciente
  recentTenders: any[]
  recentProposals: any[]
  recentApprovals: any[]
  
  // Stats específicas por rol
  supplierStats?: {
    myProposals: number
    myProposalsAmount: number
    pendingApprovals: number
    myInvoices: number
    myInvoicesAmount: number
  }
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return getEmptyStats()
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, supplier_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return getEmptyStats()
  }

  try {
    // Stats generales (todos los roles)
    const [
      { count: totalTenders },
      { count: activeTenders },
      { count: totalProposals },
      { count: totalSuppliers }
    ] = await Promise.all([
      supabase.from('tenders').select('*', { count: 'exact', head: true }),
      supabase.from('tenders').select('*', { count: 'exact', head: true }).eq('status', 'abierta'),
      supabase.from('proposals').select('*', { count: 'exact', head: true }),
      supabase.from('suppliers').select('*', { count: 'exact', head: true })
    ])

    // Stats financieras
    const { data: budgetData } = await supabase
      .from('tenders')
      .select('budget_rd')
      .not('budget_rd', 'is', null)

    const { data: proposalsAmountData } = await supabase
      .from('proposals')
      .select('amount_rd')
      .not('amount_rd', 'is', null)

    const { data: invoicesAmountData } = await supabase
      .from('invoices')
      .select('amount_rd, status')
      .not('amount_rd', 'is', null)

    const totalBudget = budgetData?.reduce((sum, item) => sum + (item.budget_rd || 0), 0) || 0
    const totalProposalsAmount = proposalsAmountData?.reduce((sum, item) => sum + (item.amount_rd || 0), 0) || 0
    const totalInvoicesAmount = invoicesAmountData?.reduce((sum, item) => sum + (item.amount_rd || 0), 0) || 0
    const paidInvoicesAmount = invoicesAmountData?.filter(i => i.status === 'pagada').reduce((sum, item) => sum + (item.amount_rd || 0), 0) || 0

    // Stats por estado
    const { data: tendersStatusData } = await supabase
      .from('tenders')
      .select('status')

    const { data: proposalsStatusData } = await supabase
      .from('proposals')
      .select('status')

    const { data: invoicesStatusData } = await supabase
      .from('invoices')
      .select('status')

    const tendersByStatus = tendersStatusData?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const proposalsByStatus = proposalsStatusData?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const invoicesByStatus = invoicesStatusData?.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Actividad reciente
    const { data: recentTenders } = await supabase
      .from('tenders')
      .select('id, code, title, status, budget_rd, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentProposals } = await supabase
      .from('proposals')
      .select(`
        id, amount_rd, status, created_at,
        tenders!proposals_tender_id_fkey (code, title),
        suppliers!proposals_supplier_id_fkey (company_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentApprovals } = await supabase
      .from('approvals')
      .select(`
        id, scope, decision, decided_at, created_at,
        proposals!approvals_proposal_id_fkey (
          amount_rd,
          tenders!proposals_tender_id_fkey (code, title)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Stats específicas para suppliers
    let supplierStats = undefined
    if (profile.role === 'supplier' && profile.supplier_id) {
      const [
        { count: myProposals },
        { data: myProposalsData },
        { count: pendingApprovals },
        { count: myInvoices },
        { data: myInvoicesData }
      ] = await Promise.all([
        supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('supplier_id', profile.supplier_id),
        supabase.from('proposals').select('amount_rd').eq('supplier_id', profile.supplier_id),
        supabase.from('approvals').select('*', { count: 'exact', head: true }).eq('decision', 'pending').eq('proposals.supplier_id', profile.supplier_id),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('proposals.supplier_id', profile.supplier_id),
        supabase.from('invoices').select('amount_rd').eq('proposals.supplier_id', profile.supplier_id)
      ])

      const myProposalsAmount = myProposalsData?.reduce((sum, item) => sum + (item.amount_rd || 0), 0) || 0
      const myInvoicesAmount = myInvoicesData?.reduce((sum, item) => sum + (item.amount_rd || 0), 0) || 0

      supplierStats = {
        myProposals: myProposals || 0,
        myProposalsAmount,
        pendingApprovals: pendingApprovals || 0,
        myInvoices: myInvoices || 0,
        myInvoicesAmount
      }
    }

    return {
      totalTenders: totalTenders || 0,
      activeTenders: activeTenders || 0,
      totalProposals: totalProposals || 0,
      totalSuppliers: totalSuppliers || 0,
      totalBudget,
      totalProposalsAmount,
      totalInvoicesAmount,
      paidInvoicesAmount,
      tendersByStatus,
      proposalsByStatus,
      invoicesByStatus,
      recentTenders: recentTenders || [],
      recentProposals: recentProposals || [],
      recentApprovals: recentApprovals || [],
      supplierStats
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return getEmptyStats()
  }
}

function getEmptyStats(): DashboardStats {
  return {
    totalTenders: 0,
    activeTenders: 0,
    totalProposals: 0,
    totalSuppliers: 0,
    totalBudget: 0,
    totalProposalsAmount: 0,
    totalInvoicesAmount: 0,
    paidInvoicesAmount: 0,
    tendersByStatus: {},
    proposalsByStatus: {},
    invoicesByStatus: {},
    recentTenders: [],
    recentProposals: [],
    recentApprovals: []
  }
}

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, supplier_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) {
    notFound()
  }

  const dashboardStats = await getDashboardStats()

  return (
    <DashboardClient 
      stats={dashboardStats}
      userRole={profile.role}
      userName={profile.full_name}
    />
  )
}