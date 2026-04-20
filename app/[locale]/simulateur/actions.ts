'use server'

import { createClient } from '@supabase/supabase-js'

export async function submitSimulateurLead(data: {
  telephone: string
  type: string
  chambres: string
  piscine: boolean
  mer: boolean
  clim: boolean
  prixNuit: number
  nuits: number
  bruts: number
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const message = `[Lead Simulateur] ${data.type} · ${data.chambres} chambre(s)${data.piscine ? ' · Piscine' : ''}${data.mer ? ' · Bord de mer' : ''}${data.clim ? ' · Climatisé' : ''} — ${data.prixNuit} MAD/nuit × ${data.nuits} nuits = ${data.bruts.toLocaleString('fr-FR')} MAD/mois estimé`

  const { error } = await supabase.from('contacts').insert({
    nom: 'Lead Simulateur',
    telephone: data.telephone,
    email: null,
    ville_bien: 'El Mansouria / Mohammedia',
    type_bien: data.type,
    message,
    source: 'simulateur',
  })

  if (error) throw new Error(error.message)
}
