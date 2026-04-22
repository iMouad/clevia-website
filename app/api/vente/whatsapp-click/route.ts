import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function detectAppareil(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile'
  return 'desktop'
}

export async function POST(req: NextRequest) {
  try {
    const { bien_id, bien_titre, bien_reference, telephone } = await req.json()
    if (!bien_id) return NextResponse.json({ ok: false }, { status: 400 })

    const ua = req.headers.get('user-agent') ?? ''
    const appareil = detectAppareil(ua)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('vente_whatsapp_clicks').insert({
      bien_id,
      bien_titre,
      telephone,
      appareil,
    })

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const ref = bien_reference ? ` (Réf: ${bien_reference})` : ''
      const heure = new Date().toLocaleString('fr-MA', { timeZone: 'Africa/Casablanca' })

      await resend.emails.send({
        from: 'Clévia Notifications <notifications@cleviamaroc.com>',
        to: process.env.ADMIN_EMAIL ?? 'vermonadennisa@gmail.com',
        subject: `📱 Clic WhatsApp — ${bien_titre}${ref}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #2C1A0E; margin-bottom: 8px;">Quelqu'un est intéressé !</h2>
            <p style="color: #6B4C35; margin-bottom: 24px;">Un visiteur a cliqué sur le bouton WhatsApp pour un bien à vendre.</p>
            <div style="background: #FAF6F1; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 14px; color: #6B4C35;"><strong>Bien :</strong> ${bien_titre}${ref}</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6B4C35;"><strong>Téléphone affiché :</strong> ${telephone}</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6B4C35;"><strong>Appareil :</strong> ${appareil}</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6B4C35;"><strong>Heure :</strong> ${heure}</p>
            </div>
            <p style="font-size: 12px; color: #A07850;">— Clévia Conciergerie</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
