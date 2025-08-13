'use client'

import dynamic from 'next/dynamic'

const SimpleRfpIndicator = dynamic(() => Promise.resolve(SimpleRfpIndicatorComponent), {
  ssr: false
})

interface SimpleRfpIndicatorProps {
  hasRfp: boolean
}

function SimpleRfpIndicatorComponent({ hasRfp }: SimpleRfpIndicatorProps) {
  if (!hasRfp) return null
  
  return (
    <span className="inline ml-2 text-muted-foreground text-xs" title="Tiene documento RFP">
      📄
    </span>
  )
}

export default SimpleRfpIndicator