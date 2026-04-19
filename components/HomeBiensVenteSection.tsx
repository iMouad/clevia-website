import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function HomeBiensVenteSection() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'vente' })
  const supabase = await createClient()

  const { count } = await supabase
    .from('biens_vente')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'a_vendre')

  if (!count || count === 0) return null

  const categories = ['Appartements', 'Villas', 'Terrains', 'Fermes']

  return (
    <section className="bg-brun/4 border-y border-brun/8 py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Left: texte */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-terra/10 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
              <path d="M16 8h2M18 6v4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {count} bien{count > 1 ? 's' : ''} à vendre
            </p>
            <p className="text-xs text-brun-mid/60 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {categories.join(' · ')}
            </p>
          </div>
        </div>

        {/* Right: CTA */}
        <Link
          href="/vente"
          className="flex items-center gap-2 border border-terra text-terra text-sm font-medium rounded-full px-5 py-2 hover:bg-terra hover:text-creme transition-all duration-200 flex-shrink-0"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Voir les biens à vendre
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

      </div>
    </section>
  )
}
