'use client'

import dynamic from 'next/dynamic'
import { Eye, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Dynamic import para evitar problemas de hydration
const ActionButtons = dynamic(() => Promise.resolve(ActionButtonsComponent), {
  ssr: false
})

interface ActionButtonsProps {
  tenderId: string
  status: string
  deadline: string
  hasProposal: boolean
}

function ActionButtonsComponent({ 
  tenderId, 
  status, 
  deadline, 
  hasProposal 
}: ActionButtonsProps) {
  const handleViewDetails = () => {
    window.location.href = `/tenders/${tenderId}`
  }

  const canSubmitProposal = () => {
    if (status !== 'abierto') return false
    if (new Date() > new Date(deadline)) return false
    if (hasProposal) return false
    return true
  }

  const getTooltip = () => {
    if (hasProposal) return "Ya enviaste una propuesta"
    if (status !== 'abierto') return "Licitación no disponible"
    if (new Date() > new Date(deadline)) return "Fecha límite vencida"
    return "No disponible"
  }

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
      {canSubmitProposal() ? (
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

export default ActionButtons