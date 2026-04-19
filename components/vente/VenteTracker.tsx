'use client'

import { useEffect } from 'react'

export default function VenteTracker({ bienId }: { bienId: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = document.referrer
      ? new URL(document.referrer).hostname
      : 'direct'

    fetch('/api/vente/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bien_id: bienId,
        source,
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
      }),
    }).catch(() => {})
  }, [bienId])

  return null
}
