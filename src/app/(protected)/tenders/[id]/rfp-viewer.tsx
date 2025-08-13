'use client'

import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RfpViewerProps {
  rfpPath: string
}

export default function RfpViewer({ rfpPath }: RfpViewerProps) {
  const handleViewRfp = async () => {
    try {
      const response = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: rfpPath }),
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

  return (
    <Button variant="outline" onClick={handleViewRfp} className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      Ver Documento RFP
    </Button>
  )
}