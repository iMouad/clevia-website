import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AnimateIn } from '@/components/ui/AnimateIn'
import BienVenteCard, { type BienVente } from '@/components/BienVenteCard'

export default async function HomeBiensVenteSection() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'vente' })
  const supabase = await createClient()

  const { data } = await supabase
    .from('biens_vente')
    .select('id, titre, categorie, statut, prix, surface, chambres, ville, photos, reference')
    .eq('statut', 'a_vendre')
    .order('created_at', { ascending: false })
    .limit(3)

  if (!data || data.length === 0) return null

  const biens: BienVente[] = data.map((b) => ({
    id: b.id,
    titre: b.titre,
    categorie: b.categorie,
    statut: b.statut,
    prix: b.prix ?? null,
    surface: b.surface ?? null,
    chambres: b.chambres ?? null,
    ville: b.ville,
    photos: b.photos ?? null,
    reference: b.reference ?? null,
  }))

  return (
    <section className="bg-creme py-24 px-4 border-t border-brun/5">
      <div className="max-w-7xl mx-auto">
        <AnimateIn className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <span
              className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-3"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('tag')}
            </span>
            <h2 className="text-4xl md:text-5xl text-brun">{t('homeTitle')}</h2>
            <p className="text-brun-mid mt-2 text-base max-w-lg leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('homeSubtitle')}
            </p>
          </div>
          <Link
            href="/vente"
            className="flex items-center gap-2 border border-brun/20 text-brun text-sm font-medium rounded-full px-6 py-2.5 hover:border-terra hover:text-terra transition-all flex-shrink-0"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('viewAll')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </AnimateIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {biens.map((bien) => (
            <AnimateIn key={bien.id}>
              <BienVenteCard bien={bien} />
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
