'use client'

import dynamic from 'next/dynamic'
import { Eye, Send, MoreHorizontal, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

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
  console.log('ActionButtons props:', { tenderId, status, deadline, hasProposal })
  
  const handleViewDetails = () => {
    window.location.href = `/tenders/${tenderId}`
  }

  const canSubmitProposal = () => {
    console.log('canSubmitProposal check:', { status, deadline, hasProposal })
    if (status !== 'abierta') return false
    if (new Date() > new Date(deadline)) return false
    if (hasProposal) return false
    return true
  }

  const getApplicationStatus = () => {
    console.log('getApplicationStatus check:', { hasProposal, status, deadline, deadlineDate: new Date(deadline), now: new Date() })
    
    if (hasProposal) {
      console.log('Returning APPLIED status')
      return {
        status: 'applied',
        label: 'Ya Aplicaste',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800'
      }
    }
    if (status !== 'abierta') {
      console.log('Returning CLOSED status - tender not open')
      return {
        status: 'closed',
        label: 'No Disponible',
        icon: XCircle,
        color: 'bg-gray-100 text-gray-800'
      }
    }
    if (new Date() > new Date(deadline)) {
      console.log('Returning EXPIRED status - deadline passed')
      return {
        status: 'expired',
        label: 'Vencida',
        icon: XCircle,
        color: 'bg-red-100 text-red-800'
      }
    }
    console.log('Returning AVAILABLE status - can submit')
    return {
      status: 'available',
      label: 'Disponible',
      icon: Clock,
      color: 'bg-blue-100 text-blue-800'
    }
  }

  const applicationStatus = getApplicationStatus()
  const StatusIcon = applicationStatus.icon

  return (
    <div className="flex items-center gap-2">
      {/* Badge de estado de aplicación */}
      <Badge className={applicationStatus.color}>
        <StatusIcon className="mr-1 h-3 w-3" />
        {applicationStatus.label}
      </Badge>
      
      {/* Dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          
          {canSubmitProposal() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleViewDetails}
                className="text-green-600 focus:text-green-600"
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar Propuesta
              </DropdownMenuItem>
            </>
          )}
          
          {hasProposal && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Estado de mi propuesta
              </DropdownMenuLabel>
              <DropdownMenuItem disabled>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Propuesta Enviada
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default ActionButtons