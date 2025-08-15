/**
 * Helper para enviar webhooks a N8N
 */

interface TenderWebhookPayload {
  id: string
  code: string
  title: string
  description?: string
  budget_rd: number
  delivery_max_months: number
  deadline: string
  status: string
  created_by: string
  created_at: string
  rfp_url?: string
  rfp_download_url?: string
}

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

const N8N_WEBHOOK_URL = 'https://apps.n8n.tevolv.com/webhook/bb9eb21a-d715-4189-9901-788bf44963c9'
const N8N_PROPOSAL_WEBHOOK_URL = 'https://apps.n8n.tevolv.com/webhook/f1d3e321-3372-441b-a83e-c05f9aec218d'
const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/**
 * Envía datos del tender a N8N cuando se crea exitosamente
 */
export async function sendTenderToN8N(
  tender: TenderWebhookPayload,
  rfpPath?: string | null , event_type?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Construir URLs del PDF si existe
    let rfpUrls = {}
    if (rfpPath) {
      const publicUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/docs/${rfpPath}`
      rfpUrls = {
        rfp_path: rfpPath,
        rfp_url: publicUrl,
        rfp_download_url: publicUrl,
        rfp_direct_link: publicUrl,
        // URL alternativa por si acaso
        rfp_storage_url: `${SUPABASE_PROJECT_URL}/storage/v1/object/public/docs/${rfpPath}?download=true`
      }
    }

    // Construir payload completo
    const payload = {
      event_type: event_type,
      timestamp: new Date().toISOString(),
      source: 'e-procurement-platform',
      tender: {
        ...tender,
        ...rfpUrls,
        // URLs adicionales útiles
        platform_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tenders/${tender.id}`,
        api_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tenders/${tender.id}`
      },
      metadata: {
        has_rfp: !!rfpPath,
        environment: process.env.NODE_ENV || 'development',
        webhook_version: '2.0'
      }
    }

    console.log('Sending webhook to N8N:', {
      url: N8N_WEBHOOK_URL,
      tender_code: tender.code,
      has_rfp: !!rfpPath,
      rfp_url: rfpUrls
    })

    // Enviar webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'E-Procurement/2.0',
        'X-Tender-ID': tender.id,
        'X-Tender-Code': tender.code,
        'X-Event-Type': 'tender_created'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N webhook failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return {
        success: false,
        error: `Webhook failed: ${response.status} ${response.statusText}`
      }
    }

    console.log('N8N webhook sent successfully for tender:', tender.code)
    return { success: true }

  } catch (error) {
    console.error('Error sending N8N webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Envía notificación cuando se sube un RFP a un tender existente
 */
export async function sendRfpUploadToN8N(
  tenderId: string,
  rfpPath: string,
  tenderData?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const publicUrl = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/docs/${rfpPath}`
    
    const payload = {
      event_type: 'rfp_uploaded',
      timestamp: new Date().toISOString(),
      source: 'e-procurement-platform',
      tender_id: tenderId,
      rfp: {
        path: rfpPath,
        url: publicUrl,
        download_url: `${publicUrl}?download=true`,
        uploaded_at: new Date().toISOString()
      },
      tender: tenderData || { id: tenderId },
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        webhook_version: '2.0'
      }
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'E-Procurement/2.0',
        'X-Tender-ID': tenderId,
        'X-Event-Type': 'rfp_uploaded'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook failed: ${response.status}`
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Error sending RFP webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

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