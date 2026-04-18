import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ valid: false })

  const supabase = await createClient()
  const { data } = await supabase
    .from('owner_tokens')
    .select('id')
    .eq('token', code.trim().toUpperCase())
    .maybeSingle()

  return NextResponse.json({ valid: !!data })
}
