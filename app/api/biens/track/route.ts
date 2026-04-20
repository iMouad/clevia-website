import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function detectAppareil(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile'
  return 'desktop'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bien_id, source, utm_source, utm_medium } = body
    if (!bien_id) return NextResponse.json({ ok: false }, { status: 400 })

    const ua = req.headers.get('user-agent') ?? ''
    const appareil = detectAppareil(ua)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('biens_visites').insert({
      bien_id,
      source: source || 'direct',
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      appareil,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
