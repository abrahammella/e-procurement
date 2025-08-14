'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SupplierActionsProps {
  tenderId: string
  status: string
  deadline: string
  hasProposal: boolean
}

export default function SupplierActions({ 
  tenderId, 
  status, 
  deadline, 
  hasProposal 
}: SupplierActionsProps) {
  const router = useRouter()

  const handleViewDetails = useCallback(() => {
    router.push(`/tenders/${tenderId}`)
  }, [router, tenderId])

  const canSubmitProposal = useCallback(() => {
    if (status !== 'abierta') return false
    if (new Date() > new Date(deadline)) return false
    if (hasProposal) return false
    return true
  }, [status, deadline, hasProposal])

  const getTooltip = useCallback(() => {
    if (hasProposal) return "Ya enviaste una propuesta"
    if (status !== 'abierta') return "Licitación no disponible"
    if (new Date() > new Date(deadline)) return "Fecha límite vencida"
    return "No disponible"
  }, [hasProposal, status, deadline])

  const canSubmit = canSubmitProposal()

  return (
    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewDetails}
      >
        <Eye className="mr-2 h-4 w-4" />
        Ver
      </Button>
      {canSubmit ? (
        <Button
          size="sm"
          onClick={handleViewDetails}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="mr-2 h-4 w-4" />
          Postular
        </Button>
      ) : (
        <Button
          size="sm"
          disabled
          variant="outline"
          title={getTooltip()}
        >
          <Send className="mr-2 h-4 w-4" />
          {hasProposal ? "Enviada" : "Postular"}
        </Button>
      )}
    </div>
  )
}