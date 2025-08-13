'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, DollarSign, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ProposalForm from './proposal-form'
import RfpViewer from './rfp-viewer'

interface Tender {
  id: string
  code: string
  title: string
  description: string | null
  status: 'abierto' | 'en_evaluacion' | 'cerrado' | 'adjudicado'
  budget_rd: number
  delivery_max_months: number
  deadline: string
  created_at: string
  created_by: string
  rfp_path: string | null
}

interface TenderDetailClientProps {
  tender: Tender
  isSupplier: boolean
  hasExistingProposal: boolean
}

const statusColors = {
  abierto: 'bg-green-100 text-green-800',
  en_evaluacion: 'bg-amber-100 text-amber-800',
  cerrado: 'bg-gray-100 text-gray-800',
  adjudicado: 'bg-blue-100 text-blue-800',
}

const statusLabels = {
  abierto: 'Abierto',
  en_evaluacion: 'En Evaluación',
  cerrado: 'Cerrado',
  adjudicado: 'Adjudicado',
}

// Función para formatear moneda
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-DO', { 
    style: 'currency', 
    currency: 'DOP' 
  }).format(amount)
}

// Función para formatear fecha
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return format(date, "dd 'de' MMMM 'de' yyyy 'a las' h:mm a", { locale: es })
}

// Función para verificar si la fecha límite ha vencido
function isDeadlineExpired(deadline: string): boolean {
  return new Date() > new Date(deadline)
}

export default function TenderDetailClient({ 
  tender, 
  isSupplier, 
  hasExistingProposal 
}: TenderDetailClientProps) {
  const isOpen = tender.status === 'abierto'
  const isNotExpired = !isDeadlineExpired(tender.deadline)
  const canSubmitProposal = isSupplier && isOpen && isNotExpired && !hasExistingProposal

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{tender.title}</h1>
          <Badge className={statusColors[tender.status]}>
            {statusLabels[tender.status]}
          </Badge>
        </div>
        <p className="text-muted-foreground">Código: {tender.code}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Licitación</CardTitle>
              <CardDescription>
                Información completa sobre esta oportunidad de negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Descripción */}
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-muted-foreground">
                  {tender.description || 'Sin descripción disponible'}
                </p>
              </div>

              <Separator />

              {/* Información clave */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Presupuesto</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(tender.budget_rd)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Plazo de Entrega</p>
                    <p className="text-lg font-bold text-blue-600">
                      {tender.delivery_max_months} meses
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Fecha Límite</p>
                    <p className="text-sm font-bold text-red-600">
                      {formatDate(tender.deadline)}
                    </p>
                    {isDeadlineExpired(tender.deadline) && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        Fecha vencida
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RFP Document */}
              {tender.rfp_path && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Documento RFP</h3>
                    <RfpViewer rfpPath={tender.rfp_path} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar con acciones */}
        <div className="space-y-4">
          {/* Estado y fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge className={`${statusColors[tender.status]} text-lg px-4 py-2`}>
                  {statusLabels[tender.status]}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Publicado:</strong><br />
                  {formatDate(tender.created_at)}
                </p>
                <p>
                  <strong>Cierre:</strong><br />
                  {formatDate(tender.deadline)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acciones para suppliers */}
          {isSupplier && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasExistingProposal ? (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">
                      Ya tienes una propuesta enviada para esta licitación
                    </p>
                  </div>
                ) : canSubmitProposal ? (
                  <ProposalForm tenderId={tender.id} />
                ) : (
                  <div className="space-y-2">
                    <button disabled className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">
                      Postular
                    </button>
                    <p className="text-xs text-muted-foreground text-center">
                      {!isOpen && 'Licitación no disponible para propuestas'}
                      {isOpen && !isNotExpired && 'Fecha límite vencida'}
                      {isOpen && isNotExpired && hasExistingProposal && 'Ya enviaste una propuesta'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}