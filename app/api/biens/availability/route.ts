import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const bienId = req.nextUrl.searchParams.get('bien_id')
  if (!bienId) return NextResponse.json({ error: 'missing bien_id' }, { status: 400 })

  const [{ data: reservations }, { data: blocked }] = await Promise.all([
    supabaseAdmin
      .from('reservations')
      .select('date_arrivee, date_depart')
      .eq('bien_id', bienId)
      .eq('statut', 'confirmee'),
    supabaseAdmin
      .from('blocked_dates')
      .select('date')
      .eq('bien_id', bienId),
  ])

  return NextResponse.json({
    reservations: (reservations ?? []).map((r) => ({ start: r.date_arrivee, end: r.date_depart })),
    blocked: (blocked ?? []).map((d) => d.date),
  })
}
