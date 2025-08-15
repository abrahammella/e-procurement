/**
 * Webhook específico para eventos de propuestas
 * URL de N8N: https://apps.n8n.tevolv.com/webhook/f1d3e321-3372-441b-a83e-c05f9aec218d
 */

interface ProposalWebhookPayload {
  id: string
  tender_id: string
  supplier_id: string
  amount_rd: number
  delivery_months: number
  doc_url?: string
  status: string
  created_at: string
  proposal_pdf_url?: string
  proposal_download_url?: string
}

const N8N_PROPOSAL_WEBHOOK_URL = 'https://apps.n8n.tevolv.com/webhook/f1d3e321-3372-441b-a83e-c05f9aec218d'
const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/**
 * Envía datos de la propuesta a N8N cuando un supplier envía una propuesta
 */
export async function sendProposalToN8N(
  proposal: ProposalWebhookPayload,
  tenderData?: any,
  supplierData?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Construir URLs del PDF si existe
    let proposalUrls = {}
    if (proposal.doc_url) {
      const publicUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/docs/${proposal.doc_url}`
      proposalUrls = {
        proposal_pdf_path: proposal.doc_url,
        proposal_pdf_url: publicUrl,
        proposal_download_url: publicUrl,
        proposal_direct_link: publicUrl,
        proposal_storage_url: `${SUPABASE_PROJECT_URL}/storage/v1/object/public/docs/${proposal.doc_url}?download=true`
      }
    }

    // Construir payload completo
    const payload = {
      event_type: 'proposal_submitted',
      timestamp: new Date().toISOString(),
      source: 'e-procurement-platform',
      proposal: {
        ...proposal,
        ...proposalUrls
      },
      tender: tenderData || { id: proposal.tender_id },
      supplier: supplierData || { id: proposal.supplier_id },
      metadata: {
        has_proposal_pdf: !!proposal.doc_url,
        environment: process.env.NODE_ENV || 'development',
        webhook_version: '1.0'
      }
    }

    console.log('Sending proposal webhook to N8N:', {
      url: N8N_PROPOSAL_WEBHOOK_URL,
      proposal_id: proposal.id,
      tender_id: proposal.tender_id,
      supplier_id: proposal.supplier_id,
      has_pdf: !!proposal.doc_url
    })

    // Enviar webhook
    const response = await fetch(N8N_PROPOSAL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'E-Procurement/1.0',
        'X-Proposal-ID': proposal.id,
        'X-Tender-ID': proposal.tender_id,
        'X-Supplier-ID': proposal.supplier_id,
        'X-Event-Type': 'proposal_submitted'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N proposal webhook failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return {
        success: false,
        error: `Proposal webhook failed: ${response.status} ${response.statusText}`
      }
    }

    console.log('N8N proposal webhook sent successfully for proposal:', proposal.id)
    return { success: true }

  } catch (error) {
    console.error('Error sending N8N proposal webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}