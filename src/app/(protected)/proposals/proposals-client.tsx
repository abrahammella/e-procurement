'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Eye, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Proposal {
  id: string
  tender_id: string
  supplier_id: string
  amount_rd: number
  delivery_months: number
  status: 'recibida' | 'en_evaluacion' | 'rechazada' | 'adjudicada'
  doc_url: string | null
  created_at: string
  updated_at: string
  tenders: {
    id: string
    code: string
    title: string
    status: string
    deadline: string
    budget_rd: number
  }
}

interface ProposalsData {
  items: Proposal[]
  total: number
}

interface ProposalsClientProps {
  initialData: ProposalsData
  supplierId: string
}

const statusColors = {
  recibida: 'bg-blue-100 text-blue-800',
  en_evaluacion: 'bg-amber-100 text-amber-800',
  rechazada: 'bg-red-100 text-red-800',
  adjudicada: 'bg-green-100 text-green-800',
}

const statusLabels = {
  recibida: 'Recibida',
  en_evaluacion: 'En Evaluación',
  rechazada: 'Rechazada',
  adjudicada: 'Adjudicada',
}

export default function ProposalsClient({ 
  initialData, 
  supplierId 
}: ProposalsClientProps) {
  const [data] = useState<ProposalsData>(initialData)

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP' 
    }).format(amount)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy 'a las' h:mm a", { locale: es })
  }

  // Ver documento de propuesta
  const handleViewDocument = async (docUrl: string) => {
    try {
      const response = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: docUrl }),
      })

      const result = await response.json()

      if (response.ok && result.signedUrl) {
        window.open(result.signedUrl, '_blank')
      } else {
        alert('No se pudo obtener el documento')
      }
    } catch (error) {
      console.error('Error al obtener documento:', error)
      alert('Error al obtener el documento')
    }
  }

  // Ver detalles del tender
  const handleViewTender = (tenderId: string) => {
    window.open(`/tenders/${tenderId}`, '_blank')
  }

  // Estadísticas rápidas
  const stats = {
    total: data.total,
    recibidas: data.items.filter(p => p.status === 'recibida').length,
    enEvaluacion: data.items.filter(p => p.status === 'en_evaluacion').length,
    adjudicadas: data.items.filter(p => p.status === 'adjudicada').length,
    rechazadas: data.items.filter(p => p.status === 'rechazada').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Propuestas</h1>
        <p className="text-muted-foreground">
          Gestiona y revisa el estado de tus propuestas enviadas
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.recibidas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.enEvaluacion}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adjudicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.adjudicadas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rechazadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de propuestas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Propuestas</CardTitle>
          <CardDescription>
            Todas las propuestas que has enviado a licitaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Licitación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Mi Oferta</TableHead>
                  <TableHead>Plazo Ofrecido</TableHead>
                  <TableHead>Fecha Envío</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <FileText className="mx-auto h-8 w-8 mb-2" />
                        <p>No has enviado propuestas aún</p>
                        <p className="text-sm">
                          Ve a la{' '}
                          <a href="/tenders" className="text-blue-600 hover:underline">
                            lista de licitaciones
                          </a>{' '}
                          para participar
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{proposal.tenders.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {proposal.tenders.code}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Presupuesto: {formatCurrency(proposal.tenders.budget_rd)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[proposal.status]}>
                          {statusLabels[proposal.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(proposal.amount_rd)}
                      </TableCell>
                      <TableCell>
                        {proposal.delivery_months} meses
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(proposal.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTender(proposal.tender_id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Licitación
                          </Button>
                          {proposal.doc_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(proposal.doc_url!)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Mi Propuesta
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}