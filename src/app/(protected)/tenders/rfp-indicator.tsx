'use client'

import dynamic from 'next/dynamic'
import { FileText } from 'lucide-react'

const RfpIndicator = dynamic(() => Promise.resolve(RfpIndicatorComponent), {
  ssr: false
})

interface RfpIndicatorProps {
  hasRfp: boolean
}

function RfpIndicatorComponent({ hasRfp }: RfpIndicatorProps) {
  if (!hasRfp) return null
  
  return (
    <FileText className="inline ml-2 h-4 w-4 text-muted-foreground" />
  )
}

export default RfpIndicator